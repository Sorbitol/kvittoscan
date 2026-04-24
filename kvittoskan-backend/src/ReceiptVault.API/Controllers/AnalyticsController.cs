using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReceiptVault.Application.DTOs;
using ReceiptVault.Application.Services;

namespace ReceiptVault.API.Controllers;

[ApiController]
[Route("api/analytics")]
[Authorize]
[Produces("application/json")]
public class AnalyticsController(AnalyticsService analyticsService) : ControllerBase
{
    [HttpGet("categories")]
    [ProducesResponseType(typeof(IEnumerable<CategoryBreakdown>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetCategories(
        [FromQuery] DateOnly? dateFrom,
        [FromQuery] DateOnly? dateTo,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized();

        var breakdown = await analyticsService.GetCategoryBreakdownAsync(userId.Value, dateFrom, dateTo, cancellationToken);
        return Ok(breakdown);
    }

    [HttpGet("weekly")]
    [ProducesResponseType(typeof(IEnumerable<WeeklyStat>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetWeeklyStats(
        [FromQuery] int weeks = 12,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized();

        if (weeks < 1 || weeks > 52)
            return BadRequest(new { error = "weeks must be between 1 and 52." });

        var stats = await analyticsService.GetWeeklyStatsAsync(userId.Value, weeks, cancellationToken);
        return Ok(stats);
    }

    [HttpGet("top-items")]
    [ProducesResponseType(typeof(IEnumerable<TopItem>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetTopItems(
        [FromQuery] int limit = 10,
        [FromQuery] DateOnly? dateFrom = null,
        [FromQuery] DateOnly? dateTo = null,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized();

        if (limit < 1 || limit > 100)
            return BadRequest(new { error = "limit must be between 1 and 100." });

        var items = await analyticsService.GetTopItemsAsync(userId.Value, limit, dateFrom, dateTo, cancellationToken);
        return Ok(items);
    }

    [HttpGet("insights")]
    [ProducesResponseType(typeof(IEnumerable<SpendingInsight>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetInsights(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized();

        var insights = await analyticsService.GetSpendingInsightsAsync(userId.Value, cancellationToken);
        return Ok(insights);
    }

    private Guid? GetCurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
               ?? User.FindFirstValue("sub");

        return Guid.TryParse(sub, out var id) ? id : null;
    }
}
