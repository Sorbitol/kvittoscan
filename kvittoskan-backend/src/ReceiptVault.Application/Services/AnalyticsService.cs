using System.Globalization;
using ReceiptVault.Application.DTOs;
using ReceiptVault.Application.Interfaces;

namespace ReceiptVault.Application.Services;

public class AnalyticsService(IReceiptRepository receiptRepository)
{
    public async Task<IEnumerable<CategoryBreakdown>> GetCategoryBreakdownAsync(
        Guid userId,
        DateOnly? dateFrom = null,
        DateOnly? dateTo = null,
        CancellationToken cancellationToken = default)
    {
        var receipts = (await receiptRepository.GetFilteredAsync(userId, dateFrom, dateTo, null, cancellationToken)).ToList();

        if (receipts.Count == 0)
            return [];

        var grandTotal = receipts.Sum(r => r.Total);

        return receipts
            .GroupBy(r => new { r.Category, r.CategoryEn })
            .Select(g => new CategoryBreakdown(
                g.Key.Category,
                g.Key.CategoryEn,
                g.Sum(r => r.Total),
                g.Count(),
                grandTotal > 0 ? Math.Round(g.Sum(r => r.Total) / grandTotal * 100, 2) : 0
            ))
            .OrderByDescending(c => c.Total);
    }

    public async Task<IEnumerable<WeeklyStat>> GetWeeklyStatsAsync(
        Guid userId,
        int weeks = 12,
        CancellationToken cancellationToken = default)
    {
        var dateTo = DateOnly.FromDateTime(DateTime.UtcNow);
        var dateFrom = dateTo.AddDays(-(weeks * 7));

        var receipts = (await receiptRepository.GetFilteredAsync(userId, dateFrom, dateTo, null, cancellationToken)).ToList();

        var calendar = CultureInfo.InvariantCulture.Calendar;
        var weekStats = receipts
            .GroupBy(r =>
            {
                var weekOfYear = calendar.GetWeekOfYear(r.Date.ToDateTime(TimeOnly.MinValue), CalendarWeekRule.FirstFourDayWeek, DayOfWeek.Monday);
                var year = r.Date.Year;
                return (year, weekOfYear);
            })
            .Select(g =>
            {
                var firstDayOfWeek = ISOWeek.ToDateTime(g.Key.year, g.Key.weekOfYear, DayOfWeek.Monday);
                var weekStart = DateOnly.FromDateTime(firstDayOfWeek);
                var weekEnd = weekStart.AddDays(6);
                return new WeeklyStat(
                    weekStart,
                    weekEnd,
                    g.Key.weekOfYear,
                    g.Sum(r => r.Total),
                    g.Count()
                );
            })
            .OrderBy(w => w.WeekStart);

        return weekStats;
    }

    public async Task<IEnumerable<TopItem>> GetTopItemsAsync(
        Guid userId,
        int limit = 10,
        DateOnly? dateFrom = null,
        DateOnly? dateTo = null,
        CancellationToken cancellationToken = default)
    {
        var receipts = (await receiptRepository.GetFilteredAsync(userId, dateFrom, dateTo, null, cancellationToken)).ToList();

        var allItems = receipts.SelectMany(r => r.Items);

        return allItems
            .GroupBy(i => new { i.Name, i.NameEn })
            .Select(g => new TopItem(
                g.Key.Name,
                g.Key.NameEn,
                g.Count(),
                g.Sum(i => i.Price * i.Qty),
                g.Average(i => i.Price)
            ))
            .OrderByDescending(t => t.PurchaseCount)
            .Take(limit);
    }

    public async Task<IEnumerable<SpendingInsight>> GetSpendingInsightsAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var insights = new List<SpendingInsight>();

        var now = DateOnly.FromDateTime(DateTime.UtcNow);
        var thisMonthStart = new DateOnly(now.Year, now.Month, 1);
        var lastMonthStart = thisMonthStart.AddMonths(-1);
        var lastMonthEnd = thisMonthStart.AddDays(-1);

        var thisMonthReceipts = (await receiptRepository.GetFilteredAsync(userId, thisMonthStart, now, null, cancellationToken)).ToList();
        var lastMonthReceipts = (await receiptRepository.GetFilteredAsync(userId, lastMonthStart, lastMonthEnd, null, cancellationToken)).ToList();

        var thisMonthTotal = thisMonthReceipts.Sum(r => r.Total);
        var lastMonthTotal = lastMonthReceipts.Sum(r => r.Total);

        if (lastMonthTotal > 0)
        {
            var change = (thisMonthTotal - lastMonthTotal) / lastMonthTotal * 100;
            var direction = change >= 0 ? "upp" : "ned";
            insights.Add(new SpendingInsight(
                "MonthOverMonth",
                $"Du har spenderat {Math.Abs(Math.Round(change, 1))}% {direction} jämfört med förra månaden.",
                Math.Round(change, 1),
                null
            ));
        }

        if (thisMonthReceipts.Count > 0)
        {
            var topCategory = thisMonthReceipts
                .GroupBy(r => r.Category)
                .OrderByDescending(g => g.Sum(r => r.Total))
                .FirstOrDefault();

            if (topCategory is not null)
            {
                insights.Add(new SpendingInsight(
                    "TopCategory",
                    $"Din största utgiftskategori denna månad är {topCategory.Key}.",
                    topCategory.Sum(r => r.Total),
                    topCategory.Key
                ));
            }
        }

        var allReceipts = (await receiptRepository.GetByUserIdAsync(userId, cancellationToken)).ToList();
        if (allReceipts.Count >= 5)
        {
            var avgPerReceipt = allReceipts.Average(r => r.Total);
            insights.Add(new SpendingInsight(
                "AverageReceipt",
                $"Ditt genomsnittliga kvittobelopp är {Math.Round(avgPerReceipt, 2)} kr.",
                Math.Round(avgPerReceipt, 2),
                null
            ));
        }

        return insights;
    }
}
