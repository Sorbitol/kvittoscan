using Microsoft.EntityFrameworkCore;
using ReceiptVault.Application.Interfaces;
using ReceiptVault.Domain.Entities;
using ReceiptVault.Infrastructure.Data;

namespace ReceiptVault.Infrastructure.Repositories;

public class ReceiptRepository(AppDbContext dbContext) : IReceiptRepository
{
    public async Task<Receipt?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        await dbContext.Receipts
            .Include(r => r.Items)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

    public async Task<IEnumerable<Receipt>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default) =>
        await dbContext.Receipts
            .Include(r => r.Items)
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.Date)
            .ThenByDescending(r => r.Time)
            .ToListAsync(cancellationToken);

    public async Task<IEnumerable<Receipt>> GetByHouseholdIdAsync(Guid householdId, CancellationToken cancellationToken = default) =>
        await dbContext.Receipts
            .Include(r => r.Items)
            .Where(r => r.HouseholdId == householdId)
            .OrderByDescending(r => r.Date)
            .ThenByDescending(r => r.Time)
            .ToListAsync(cancellationToken);

    public async Task<IEnumerable<Receipt>> GetFilteredAsync(
        Guid userId,
        DateOnly? dateFrom,
        DateOnly? dateTo,
        string? category,
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.Receipts
            .Include(r => r.Items)
            .Where(r => r.UserId == userId);

        if (dateFrom.HasValue)
        {
            var fromDateTime = dateFrom.Value.ToDateTime(TimeOnly.MinValue);
            query = query.Where(r => EF.Property<DateTime>(r, "Date") >= fromDateTime);
        }

        if (dateTo.HasValue)
        {
            var toDateTime = dateTo.Value.ToDateTime(TimeOnly.MaxValue);
            query = query.Where(r => EF.Property<DateTime>(r, "Date") <= toDateTime);
        }

        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(r => r.Category == category || r.CategoryEn == category);

        return await query
            .OrderByDescending(r => r.Date)
            .ThenByDescending(r => r.Time)
            .ToListAsync(cancellationToken);
    }

    public async Task<Receipt> AddAsync(Receipt receipt, CancellationToken cancellationToken = default)
    {
        foreach (var item in receipt.Items)
            item.ReceiptId = receipt.Id;

        dbContext.Receipts.Add(receipt);
        await dbContext.SaveChangesAsync(cancellationToken);
        return receipt;
    }

    public async Task<Receipt> UpdateAsync(Receipt receipt, CancellationToken cancellationToken = default)
    {
        var existing = await dbContext.Receipts
            .Include(r => r.Items)
            .FirstOrDefaultAsync(r => r.Id == receipt.Id, cancellationToken)
            ?? throw new InvalidOperationException($"Receipt {receipt.Id} not found.");

        dbContext.ReceiptItems.RemoveRange(existing.Items);

        existing.Store = receipt.Store;
        existing.StoreShort = receipt.StoreShort;
        existing.Category = receipt.Category;
        existing.CategoryEn = receipt.CategoryEn;
        existing.Date = receipt.Date;
        existing.Time = receipt.Time;
        existing.Total = receipt.Total;
        existing.Vat = receipt.Vat;
        existing.Payment = receipt.Payment;
        existing.ImagePath = receipt.ImagePath;
        existing.UpdatedAt = receipt.UpdatedAt;
        existing.Items = receipt.Items;

        foreach (var item in existing.Items)
            item.ReceiptId = existing.Id;

        await dbContext.SaveChangesAsync(cancellationToken);
        return existing;
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var receipt = await dbContext.Receipts.FindAsync([id], cancellationToken);
        if (receipt is not null)
        {
            dbContext.Receipts.Remove(receipt);
            await dbContext.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default) =>
        await dbContext.Receipts.AnyAsync(r => r.Id == id, cancellationToken);

    public async Task<bool> BelongsToUserAsync(Guid id, Guid userId, CancellationToken cancellationToken = default) =>
        await dbContext.Receipts.AnyAsync(r => r.Id == id && r.UserId == userId, cancellationToken);
}
