using Microsoft.EntityFrameworkCore;
using ReceiptVault.Application.Interfaces;
using ReceiptVault.Domain.Entities;
using ReceiptVault.Infrastructure.Data;

namespace ReceiptVault.Infrastructure.Repositories;

public class UserRepository(AppDbContext dbContext) : IUserRepository
{
    public async Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        await dbContext.Users
            .Include(u => u.Household)
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);

    public async Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default) =>
        await dbContext.Users
            .Include(u => u.Household)
            .FirstOrDefaultAsync(u => u.Email == email, cancellationToken);

    public async Task<bool> ExistsByEmailAsync(string email, CancellationToken cancellationToken = default) =>
        await dbContext.Users.AnyAsync(u => u.Email == email, cancellationToken);

    public async Task<User> AddAsync(User user, CancellationToken cancellationToken = default)
    {
        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync(cancellationToken);
        return user;
    }

    public async Task<User> UpdateAsync(User user, CancellationToken cancellationToken = default)
    {
        dbContext.Users.Update(user);
        await dbContext.SaveChangesAsync(cancellationToken);
        return user;
    }
}
