using ReceiptVault.Domain.Entities;

namespace ReceiptVault.Application.Interfaces;

public interface IExportService
{
    Task<byte[]> ExportToPdfAsync(IEnumerable<Receipt> receipts);
    Task<byte[]> ExportToCsvAsync(IEnumerable<Receipt> receipts);
}
