using Microsoft.Extensions.Logging;
using ReceiptVault.Application.DTOs;
using ReceiptVault.Application.Interfaces;
using ReceiptVault.Domain.Entities;

namespace ReceiptVault.Application.Services;

public class ReceiptService(IReceiptRepository receiptRepository, ILogger<ReceiptService> logger)
{
    public async Task<IEnumerable<ReceiptDto>> GetUserReceiptsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var receipts = await receiptRepository.GetByUserIdAsync(userId, cancellationToken);
        return receipts.Select(MapToDto);
    }

    public async Task<ReceiptDto?> GetReceiptByIdAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var receipt = await receiptRepository.GetByIdAsync(id, cancellationToken);

        if (receipt is null)
            return null;

        if (receipt.UserId != userId && receipt.HouseholdId is null)
            return null;

        return MapToDto(receipt);
    }

    public async Task<ReceiptDto> CreateReceiptAsync(Guid userId, CreateReceiptRequest request, CancellationToken cancellationToken = default)
    {
        var receipt = new Receipt
        {
            UserId = userId,
            HouseholdId = request.HouseholdId,
            Store = request.Store,
            StoreShort = request.StoreShort,
            Category = request.Category,
            CategoryEn = request.CategoryEn,
            Date = request.Date,
            Time = request.Time,
            Total = request.Total,
            Vat = request.Vat,
            Payment = request.Payment,
            ImagePath = request.ImagePath,
            Items = request.Items.Select(i => new ReceiptItem
            {
                Name = i.Name,
                NameEn = i.NameEn,
                Qty = i.Qty,
                Unit = i.Unit,
                Price = i.Price,
                Cat = i.Cat
            }).ToList()
        };

        var created = await receiptRepository.AddAsync(receipt, cancellationToken);
        logger.LogInformation("Receipt {ReceiptId} created for user {UserId}", created.Id, userId);
        return MapToDto(created);
    }

    public async Task<ReceiptDto?> UpdateReceiptAsync(Guid id, Guid userId, UpdateReceiptRequest request, CancellationToken cancellationToken = default)
    {
        var belongs = await receiptRepository.BelongsToUserAsync(id, userId, cancellationToken);
        if (!belongs)
            return null;

        var receipt = await receiptRepository.GetByIdAsync(id, cancellationToken);
        if (receipt is null)
            return null;

        receipt.Store = request.Store;
        receipt.StoreShort = request.StoreShort;
        receipt.Category = request.Category;
        receipt.CategoryEn = request.CategoryEn;
        receipt.Date = request.Date;
        receipt.Time = request.Time;
        receipt.Total = request.Total;
        receipt.Vat = request.Vat;
        receipt.Payment = request.Payment;
        receipt.ImagePath = request.ImagePath;
        receipt.UpdatedAt = DateTime.UtcNow;
        receipt.Items = request.Items.Select(i => new ReceiptItem
        {
            ReceiptId = id,
            Name = i.Name,
            NameEn = i.NameEn,
            Qty = i.Qty,
            Unit = i.Unit,
            Price = i.Price,
            Cat = i.Cat
        }).ToList();

        var updated = await receiptRepository.UpdateAsync(receipt, cancellationToken);
        logger.LogInformation("Receipt {ReceiptId} updated by user {UserId}", id, userId);
        return MapToDto(updated);
    }

    public async Task<bool> DeleteReceiptAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var belongs = await receiptRepository.BelongsToUserAsync(id, userId, cancellationToken);
        if (!belongs)
            return false;

        await receiptRepository.DeleteAsync(id, cancellationToken);
        logger.LogInformation("Receipt {ReceiptId} deleted by user {UserId}", id, userId);
        return true;
    }

    public async Task<IEnumerable<ReceiptDto>> GetFilteredReceiptsAsync(
        Guid userId,
        DateOnly? dateFrom,
        DateOnly? dateTo,
        string? category,
        CancellationToken cancellationToken = default)
    {
        var receipts = await receiptRepository.GetFilteredAsync(userId, dateFrom, dateTo, category, cancellationToken);
        return receipts.Select(MapToDto);
    }

    private static ReceiptDto MapToDto(Receipt r) => new(
        r.Id,
        r.UserId,
        r.HouseholdId,
        r.Store,
        r.StoreShort,
        r.Category,
        r.CategoryEn,
        r.Date,
        r.Time,
        r.Total,
        r.Vat,
        r.Payment,
        r.Items.Select(i => new ReceiptItemDto(i.Id, i.ReceiptId, i.Name, i.NameEn, i.Qty, i.Unit, i.Price, i.Cat)).ToList(),
        r.ImagePath,
        r.CreatedAt,
        r.UpdatedAt
    );
}
