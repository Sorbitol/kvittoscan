namespace ReceiptVault.Domain.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Initial { get; set; } = string.Empty;
    public Guid? HouseholdId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Household? Household { get; set; }
    public List<Receipt> Receipts { get; set; } = [];
}
