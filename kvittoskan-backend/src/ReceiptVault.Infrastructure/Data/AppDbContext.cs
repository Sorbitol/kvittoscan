using Microsoft.EntityFrameworkCore;
using ReceiptVault.Domain.Entities;

namespace ReceiptVault.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Receipt> Receipts => Set<Receipt>();
    public DbSet<ReceiptItem> ReceiptItems => Set<ReceiptItem>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Household> Households => Set<Household>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Receipt>(entity =>
        {
            entity.HasKey(r => r.Id);
            entity.Property(r => r.Id).ValueGeneratedNever();
            entity.Property(r => r.Store).IsRequired().HasMaxLength(200);
            entity.Property(r => r.StoreShort).HasMaxLength(50);
            entity.Property(r => r.Category).HasMaxLength(100);
            entity.Property(r => r.CategoryEn).HasMaxLength(100);
            entity.Property(r => r.Payment).HasMaxLength(50);
            entity.Property(r => r.ImagePath).HasMaxLength(500);
            entity.Property(r => r.Total).HasColumnType("decimal(18,2)");
            entity.Property(r => r.Vat).HasColumnType("decimal(18,2)");

            entity.Property(r => r.Date)
                .HasConversion(
                    d => d.ToDateTime(TimeOnly.MinValue),
                    d => DateOnly.FromDateTime(d));

            entity.Property(r => r.Time)
                .HasConversion(
                    t => t.ToTimeSpan(),
                    t => TimeOnly.FromTimeSpan(t));

            entity.HasOne(r => r.User)
                .WithMany(u => u.Receipts)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(r => r.Household)
                .WithMany(h => h.Receipts)
                .HasForeignKey(r => r.HouseholdId)
                .OnDelete(DeleteBehavior.SetNull)
                .IsRequired(false);

            entity.HasIndex(r => r.UserId);
            entity.HasIndex(r => r.HouseholdId);
            entity.HasIndex(r => r.Date);
            entity.HasIndex(r => r.Category);
        });

        modelBuilder.Entity<ReceiptItem>(entity =>
        {
            entity.HasKey(i => i.Id);
            entity.Property(i => i.Id).ValueGeneratedNever();
            entity.Property(i => i.Name).IsRequired().HasMaxLength(200);
            entity.Property(i => i.NameEn).HasMaxLength(200);
            entity.Property(i => i.Unit).HasMaxLength(20);
            entity.Property(i => i.Cat).HasMaxLength(100);
            entity.Property(i => i.Price).HasColumnType("decimal(18,2)");
            entity.Property(i => i.Qty).HasColumnType("decimal(10,3)");

            entity.HasOne(i => i.Receipt)
                .WithMany(r => r.Items)
                .HasForeignKey(i => i.ReceiptId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(i => i.ReceiptId);
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.Property(u => u.Id).ValueGeneratedNever();
            entity.Property(u => u.Email).IsRequired().HasMaxLength(256);
            entity.Property(u => u.PasswordHash).IsRequired();
            entity.Property(u => u.DisplayName).HasMaxLength(100);
            entity.Property(u => u.Initial).HasMaxLength(5);

            entity.HasOne(u => u.Household)
                .WithMany(h => h.Members)
                .HasForeignKey(u => u.HouseholdId)
                .OnDelete(DeleteBehavior.SetNull)
                .IsRequired(false);

            entity.HasIndex(u => u.Email).IsUnique();
        });

        modelBuilder.Entity<Household>(entity =>
        {
            entity.HasKey(h => h.Id);
            entity.Property(h => h.Id).ValueGeneratedNever();
            entity.Property(h => h.Name).IsRequired().HasMaxLength(100);
        });
    }
}
