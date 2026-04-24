namespace ReceiptVault.Domain.Entities;

public class Receipt
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid? HouseholdId { get; set; }
    public string Store { get; set; } = string.Empty;
    public string StoreShort { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string CategoryEn { get; set; } = string.Empty;
    public DateOnly Date { get; set; }
    public TimeOnly Time { get; set; }
    public decimal Total { get; set; }
    public decimal Vat { get; set; }
    public string Payment { get; set; } = string.Empty;
    public List<ReceiptItem> Items { get; set; } = [];
    public string? ImagePath { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
    public Household? Household { get; set; }
}
