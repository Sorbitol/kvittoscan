using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReceiptVault.Application.DTOs;
using ReceiptVault.Application.Services;

namespace ReceiptVault.API.Controllers;

[ApiController]
[Route("api/receipts")]
[Authorize]
[Produces("application/json")]
public class ReceiptsController(ReceiptService receiptService, ILogger<ReceiptsController> logger) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<ReceiptDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAll(
        [FromQuery] DateOnly? dateFrom,
        [FromQuery] DateOnly? dateTo,
        [FromQuery] string? category,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized();

        IEnumerable<ReceiptDto> receipts;

        if (dateFrom.HasValue || dateTo.HasValue || !string.IsNullOrWhiteSpace(category))
            receipts = await receiptService.GetFilteredReceiptsAsync(userId.Value, dateFrom, dateTo, category, cancellationToken);
        else
            receipts = await receiptService.GetUserReceiptsAsync(userId.Value, cancellationToken);

        return Ok(receipts);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ReceiptDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized();

        var receipt = await receiptService.GetReceiptByIdAsync(id, userId.Value, cancellationToken);
        if (receipt is null)
            return NotFound();

        return Ok(receipt);
    }

    [HttpPost]
    [ProducesResponseType(typeof(ReceiptDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create([FromBody] CreateReceiptRequest request, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized();

        if (string.IsNullOrWhiteSpace(request.Store))
            return BadRequest(new { error = "Store name is required." });

        var receipt = await receiptService.CreateReceiptAsync(userId.Value, request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = receipt.Id }, receipt);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ReceiptDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateReceiptRequest request, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized();

        if (string.IsNullOrWhiteSpace(request.Store))
            return BadRequest(new { error = "Store name is required." });

        var receipt = await receiptService.UpdateReceiptAsync(id, userId.Value, request, cancellationToken);
        if (receipt is null)
            return NotFound();

        return Ok(receipt);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized();

        var deleted = await receiptService.DeleteReceiptAsync(id, userId.Value, cancellationToken);
        if (!deleted)
            return NotFound();

        return NoContent();
    }

    private Guid? GetCurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
               ?? User.FindFirstValue("sub");

        return Guid.TryParse(sub, out var id) ? id : null;
    }
}
