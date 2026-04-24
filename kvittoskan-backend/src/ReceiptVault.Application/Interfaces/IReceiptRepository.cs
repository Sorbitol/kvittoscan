using ReceiptVault.Domain.Entities;

namespace ReceiptVault.Application.Interfaces;

public interface IReceiptRepository
{
    Task<Receipt?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IEnumerable<Receipt>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<IEnumerable<Receipt>> GetByHouseholdIdAsync(Guid householdId, CancellationToken cancellationToken = default);
    Task<IEnumerable<Receipt>> GetFilteredAsync(
        Guid userId,
        DateOnly? dateFrom,
        DateOnly? dateTo,
        string? category,
        CancellationToken cancellationToken = default);
    Task<Receipt> AddAsync(Receipt receipt, CancellationToken cancellationToken = default);
    Task<Receipt> UpdateAsync(Receipt receipt, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> BelongsToUserAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
}
