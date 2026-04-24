using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using ReceiptVault.Application.Interfaces;
using ReceiptVault.Domain.Entities;

namespace ReceiptVault.Infrastructure.Export;

public class PdfExportService : IExportService
{
    public Task<byte[]> ExportToPdfAsync(IEnumerable<Receipt> receipts)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        var receiptList = receipts.ToList();

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.DefaultTextStyle(x => x.FontSize(10));

                page.Header().Element(ComposeHeader);

                page.Content().Element(content => ComposeContent(content, receiptList));

                page.Footer().AlignCenter().Text(text =>
                {
                    text.Span("Sida ");
                    text.CurrentPageNumber();
                    text.Span(" av ");
                    text.TotalPages();
                });
            });
        });

        var bytes = document.GeneratePdf();
        return Task.FromResult(bytes);
    }

    public Task<byte[]> ExportToCsvAsync(IEnumerable<Receipt> receipts)
    {
        throw new NotSupportedException("Use CsvExportService for CSV export.");
    }

    private static void ComposeHeader(IContainer container)
    {
        container.Row(row =>
        {
            row.RelativeItem().Column(col =>
            {
                col.Item().Text("Kvittoskan — Kvittoexport").FontSize(20).Bold();
                col.Item().Text($"Genererat: {DateTime.Now:yyyy-MM-dd HH:mm}").FontSize(9).FontColor(Colors.Grey.Medium);
            });
        });
    }

    private static void ComposeContent(IContainer container, List<Receipt> receipts)
    {
        if (receipts.Count == 0)
        {
            container.Text("Inga kvitton att exportera.").Italic();
            return;
        }

        var totalSum = receipts.Sum(r => r.Total);
        var categories = receipts.GroupBy(r => r.Category).Count();

        container.Column(col =>
        {
            col.Item().PaddingBottom(10).Row(row =>
            {
                row.RelativeItem().Background(Colors.Grey.Lighten3).Padding(10).Column(summary =>
                {
                    summary.Item().Text($"Totalt antal kvitton: {receipts.Count}").Bold();
                    summary.Item().Text($"Totalt belopp: {totalSum:N2} kr").Bold();
                    summary.Item().Text($"Antal kategorier: {categories}");
                    summary.Item().Text($"Period: {receipts.Min(r => r.Date):yyyy-MM-dd} – {receipts.Max(r => r.Date):yyyy-MM-dd}");
                });
            });

            col.Item().PaddingTop(10).Table(table =>
            {
                table.ColumnsDefinition(cols =>
                {
                    cols.ConstantColumn(80);
                    cols.RelativeColumn(3);
                    cols.RelativeColumn(2);
                    cols.RelativeColumn(2);
                    cols.ConstantColumn(80);
                    cols.ConstantColumn(80);
                });

                table.Header(header =>
                {
                    header.Cell().Background(Colors.Blue.Darken2).Padding(5)
                        .Text("Datum").FontColor(Colors.White).Bold();
                    header.Cell().Background(Colors.Blue.Darken2).Padding(5)
                        .Text("Butik").FontColor(Colors.White).Bold();
                    header.Cell().Background(Colors.Blue.Darken2).Padding(5)
                        .Text("Kategori").FontColor(Colors.White).Bold();
                    header.Cell().Background(Colors.Blue.Darken2).Padding(5)
                        .Text("Betalning").FontColor(Colors.White).Bold();
                    header.Cell().Background(Colors.Blue.Darken2).Padding(5)
                        .Text("Moms").FontColor(Colors.White).Bold().AlignRight();
                    header.Cell().Background(Colors.Blue.Darken2).Padding(5)
                        .Text("Totalt").FontColor(Colors.White).Bold().AlignRight();
                });

                var isOdd = true;
                foreach (var receipt in receipts.OrderByDescending(r => r.Date))
                {
                    var bgColor = isOdd ? Colors.White : Colors.Grey.Lighten4;
                    isOdd = !isOdd;

                    table.Cell().Background(bgColor).Padding(5).Text(receipt.Date.ToString("yyyy-MM-dd"));
                    table.Cell().Background(bgColor).Padding(5).Text(receipt.Store);
                    table.Cell().Background(bgColor).Padding(5).Text(receipt.Category);
                    table.Cell().Background(bgColor).Padding(5).Text(receipt.Payment);
                    table.Cell().Background(bgColor).Padding(5).AlignRight().Text($"{receipt.Vat:N2}");
                    table.Cell().Background(bgColor).Padding(5).AlignRight().Text($"{receipt.Total:N2}");
                }

                table.Cell().ColumnSpan(4).Background(Colors.Grey.Lighten2).Padding(5)
                    .Text("TOTALT").Bold();
                table.Cell().Background(Colors.Grey.Lighten2).Padding(5).AlignRight()
                    .Text($"{receipts.Sum(r => r.Vat):N2}").Bold();
                table.Cell().Background(Colors.Grey.Lighten2).Padding(5).AlignRight()
                    .Text($"{totalSum:N2}").Bold();
            });

            foreach (var receipt in receipts.OrderByDescending(r => r.Date).Where(r => r.Items.Count > 0))
            {
                col.Item().PaddingTop(15).Column(receiptDetail =>
                {
                    receiptDetail.Item().Background(Colors.Grey.Lighten3).Padding(5).Row(headerRow =>
                    {
                        headerRow.RelativeItem().Text($"{receipt.Date:yyyy-MM-dd} — {receipt.Store}").Bold();
                        headerRow.ConstantItem(100).AlignRight().Text($"{receipt.Total:N2} kr").Bold();
                    });

                    receiptDetail.Item().Table(itemTable =>
                    {
                        itemTable.ColumnsDefinition(cols =>
                        {
                            cols.RelativeColumn(4);
                            cols.ConstantColumn(60);
                            cols.ConstantColumn(40);
                            cols.ConstantColumn(80);
                        });

                        itemTable.Header(h =>
                        {
                            h.Cell().Padding(3).Text("Artikel").FontSize(8).Italic();
                            h.Cell().Padding(3).AlignRight().Text("Pris").FontSize(8).Italic();
                            h.Cell().Padding(3).AlignRight().Text("Antal").FontSize(8).Italic();
                            h.Cell().Padding(3).AlignRight().Text("Summa").FontSize(8).Italic();
                        });

                        foreach (var item in receipt.Items)
                        {
                            itemTable.Cell().Padding(3).Text(item.Name).FontSize(9);
                            itemTable.Cell().Padding(3).AlignRight().Text($"{item.Price:N2}").FontSize(9);
                            itemTable.Cell().Padding(3).AlignRight().Text($"{item.Qty:G}").FontSize(9);
                            itemTable.Cell().Padding(3).AlignRight().Text($"{item.Price * item.Qty:N2}").FontSize(9);
                        }
                    });
                });
            }
        });
    }
}
