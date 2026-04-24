namespace ReceiptVault.Domain.Entities;

public class ReceiptItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ReceiptId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public decimal Qty { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Cat { get; set; } = string.Empty;

    public Receipt? Receipt { get; set; }
}
