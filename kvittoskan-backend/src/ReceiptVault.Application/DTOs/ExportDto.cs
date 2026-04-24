namespace ReceiptVault.Application.DTOs;

public record ExportRequest(
    DateOnly? DateFrom,
    DateOnly? DateTo,
    string? Category,
    string Format
);
