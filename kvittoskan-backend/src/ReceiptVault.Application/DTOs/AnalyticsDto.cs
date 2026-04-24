namespace ReceiptVault.Application.DTOs;

public record CategoryBreakdown(
    string Category,
    string CategoryEn,
    decimal Total,
    int Count,
    decimal Percentage
);

public record WeeklyStat(
    DateOnly WeekStart,
    DateOnly WeekEnd,
    int WeekNumber,
    decimal Total,
    int ReceiptCount
);

public record SpendingInsight(
    string Type,
    string Message,
    decimal? Value,
    string? Category
);

public record TopItem(
    string Name,
    string NameEn,
    int PurchaseCount,
    decimal TotalSpent,
    decimal AveragePrice
);

public record AnalyticsSummary(
    decimal TotalSpent,
    int TotalReceipts,
    decimal AveragePerReceipt,
    List<CategoryBreakdown> Categories,
    List<WeeklyStat> WeeklyStats,
    List<SpendingInsight> Insights
);
