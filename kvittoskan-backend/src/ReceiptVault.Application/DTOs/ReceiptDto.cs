namespace ReceiptVault.Application.DTOs;

public record ReceiptItemDto(
    Guid Id,
    Guid ReceiptId,
    string Name,
    string NameEn,
    decimal Qty,
    string Unit,
    decimal Price,
    string Cat
);

public record ReceiptDto(
    Guid Id,
    Guid UserId,
    Guid? HouseholdId,
    string Store,
    string StoreShort,
    string Category,
    string CategoryEn,
    DateOnly Date,
    TimeOnly Time,
    decimal Total,
    decimal Vat,
    string Payment,
    List<ReceiptItemDto> Items,
    string? ImagePath,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record CreateReceiptRequest(
    string Store,
    string StoreShort,
    string Category,
    string CategoryEn,
    DateOnly Date,
    TimeOnly Time,
    decimal Total,
    decimal Vat,
    string Payment,
    List<CreateReceiptItemRequest> Items,
    string? ImagePath,
    Guid? HouseholdId
);

public record CreateReceiptItemRequest(
    string Name,
    string NameEn,
    decimal Qty,
    string Unit,
    decimal Price,
    string Cat
);

public record UpdateReceiptRequest(
    string Store,
    string StoreShort,
    string Category,
    string CategoryEn,
    DateOnly Date,
    TimeOnly Time,
    decimal Total,
    decimal Vat,
    string Payment,
    List<CreateReceiptItemRequest> Items,
    string? ImagePath
);
