using System.Globalization;
using System.Text;
using CsvHelper;
using CsvHelper.Configuration;
using ReceiptVault.Application.Interfaces;
using ReceiptVault.Domain.Entities;

namespace ReceiptVault.Infrastructure.Export;

public class CsvExportService : IExportService
{
    public Task<byte[]> ExportToPdfAsync(IEnumerable<Receipt> receipts)
    {
        throw new NotSupportedException("Use PdfExportService for PDF export.");
    }

    public async Task<byte[]> ExportToCsvAsync(IEnumerable<Receipt> receipts)
    {
        var config = new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            Delimiter = ";",
            HasHeaderRecord = true,
            Encoding = Encoding.UTF8
        };

        await using var memoryStream = new MemoryStream();
        await using var writer = new StreamWriter(memoryStream, new UTF8Encoding(encoderShouldEmitUTF8Identifier: true));
        await using var csv = new CsvWriter(writer, config);

        csv.WriteHeader<ReceiptCsvRecord>();
        await csv.NextRecordAsync();

        foreach (var receipt in receipts.OrderByDescending(r => r.Date))
        {
            var record = new ReceiptCsvRecord
            {
                ReceiptId = receipt.Id.ToString(),
                Date = receipt.Date.ToString("yyyy-MM-dd"),
                Time = receipt.Time.ToString("HH:mm"),
                Store = receipt.Store,
                StoreShort = receipt.StoreShort,
                Category = receipt.Category,
                CategoryEn = receipt.CategoryEn,
                Total = receipt.Total,
                Vat = receipt.Vat,
                Payment = receipt.Payment,
                ItemCount = receipt.Items.Count,
                ImagePath = receipt.ImagePath ?? string.Empty
            };

            csv.WriteRecord(record);
            await csv.NextRecordAsync();
        }

        await writer.FlushAsync();
        return memoryStream.ToArray();
    }
}

internal sealed class ReceiptCsvRecord
{
    public string ReceiptId { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string Time { get; set; } = string.Empty;
    public string Store { get; set; } = string.Empty;
    public string StoreShort { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string CategoryEn { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public decimal Vat { get; set; }
    public string Payment { get; set; } = string.Empty;
    public int ItemCount { get; set; }
    public string ImagePath { get; set; } = string.Empty;
}
