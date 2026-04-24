using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReceiptVault.Application.Services;
using ReceiptVault.Infrastructure.Export;

namespace ReceiptVault.API.Controllers;

[ApiController]
[Route("api/export")]
[Authorize]
public class ExportController(
    ReceiptService receiptService,
    PdfExportService pdfExportService,
    CsvExportService csvExportService,
    ILogger<ExportController> logger) : ControllerBase
{
    [HttpGet("pdf")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ExportPdf(
        [FromQuery] DateOnly? dateFrom,
        [FromQuery] DateOnly? dateTo,
        [FromQuery] string? category,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized();

        var receiptDtos = await receiptService.GetFilteredReceiptsAsync(
            userId.Value, dateFrom, dateTo, category, cancellationToken);

        var receiptsWithItems = receiptDtos.Select(dto => new ReceiptVault.Domain.Entities.Receipt
        {
            Id = dto.Id,
            UserId = dto.UserId,
            HouseholdId = dto.HouseholdId,
            Store = dto.Store,
            StoreShort = dto.StoreShort,
            Category = dto.Category,
            CategoryEn = dto.CategoryEn,
            Date = dto.Date,
            Time = dto.Time,
            Total = dto.Total,
            Vat = dto.Vat,
            Payment = dto.Payment,
            ImagePath = dto.ImagePath,
            CreatedAt = dto.CreatedAt,
            UpdatedAt = dto.UpdatedAt,
            Items = dto.Items.Select(i => new ReceiptVault.Domain.Entities.ReceiptItem
            {
                Id = i.Id,
                ReceiptId = i.ReceiptId,
                Name = i.Name,
                NameEn = i.NameEn,
                Qty = i.Qty,
                Unit = i.Unit,
                Price = i.Price,
                Cat = i.Cat
            }).ToList()
        }).ToList();

        if (receiptsWithItems.Count == 0)
            return NotFound(new { error = "No receipts found for the given filters." });

        logger.LogInformation("Exporting {Count} receipts to PDF for user {UserId}", receiptsWithItems.Count, userId);

        var pdfBytes = await pdfExportService.ExportToPdfAsync(receiptsWithItems);
        var fileName = $"kvittoskan-export-{DateTime.UtcNow:yyyyMMdd-HHmmss}.pdf";

        return File(pdfBytes, "application/pdf", fileName);
    }

    [HttpGet("csv")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ExportCsv(
        [FromQuery] DateOnly? dateFrom,
        [FromQuery] DateOnly? dateTo,
        [FromQuery] string? category,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized();

        var receiptDtos = await receiptService.GetFilteredReceiptsAsync(
            userId.Value, dateFrom, dateTo, category, cancellationToken);

        var receiptsWithItems = receiptDtos.Select(dto => new ReceiptVault.Domain.Entities.Receipt
        {
            Id = dto.Id,
            UserId = dto.UserId,
            HouseholdId = dto.HouseholdId,
            Store = dto.Store,
            StoreShort = dto.StoreShort,
            Category = dto.Category,
            CategoryEn = dto.CategoryEn,
            Date = dto.Date,
            Time = dto.Time,
            Total = dto.Total,
            Vat = dto.Vat,
            Payment = dto.Payment,
            ImagePath = dto.ImagePath,
            CreatedAt = dto.CreatedAt,
            UpdatedAt = dto.UpdatedAt,
            Items = dto.Items.Select(i => new ReceiptVault.Domain.Entities.ReceiptItem
            {
                Id = i.Id,
                ReceiptId = i.ReceiptId,
                Name = i.Name,
                NameEn = i.NameEn,
                Qty = i.Qty,
                Unit = i.Unit,
                Price = i.Price,
                Cat = i.Cat
            }).ToList()
        }).ToList();

        if (receiptsWithItems.Count == 0)
            return NotFound(new { error = "No receipts found for the given filters." });

        logger.LogInformation("Exporting {Count} receipts to CSV for user {UserId}", receiptsWithItems.Count, userId);

        var csvBytes = await csvExportService.ExportToCsvAsync(receiptsWithItems);
        var fileName = $"kvittoskan-export-{DateTime.UtcNow:yyyyMMdd-HHmmss}.csv";

        return File(csvBytes, "text/csv; charset=utf-8", fileName);
    }

    private Guid? GetCurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
               ?? User.FindFirstValue("sub");

        return Guid.TryParse(sub, out var id) ? id : null;
    }
}
