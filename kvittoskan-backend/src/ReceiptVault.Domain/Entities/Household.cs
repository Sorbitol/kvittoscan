namespace ReceiptVault.Domain.Entities;

public class Household
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public List<User> Members { get; set; } = [];
    public List<Receipt> Receipts { get; set; } = [];
}
