using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using ReceiptVault.Application.DTOs;
using ReceiptVault.Application.Interfaces;
using ReceiptVault.Application.Services;
using ReceiptVault.Domain.Entities;

namespace ReceiptVault.Tests.Services;

public class ReceiptServiceTests
{
    private readonly Mock<IReceiptRepository> _repositoryMock;
    private readonly Mock<ILogger<ReceiptService>> _loggerMock;
    private readonly ReceiptService _sut;

    public ReceiptServiceTests()
    {
        _repositoryMock = new Mock<IReceiptRepository>();
        _loggerMock = new Mock<ILogger<ReceiptService>>();
        _sut = new ReceiptService(_repositoryMock.Object, _loggerMock.Object);
    }

    [Fact]
    public async Task GetUserReceiptsAsync_ReturnsAllUserReceipts()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var receipts = new List<Receipt>
        {
            CreateReceipt(userId, "ICA Maxi"),
            CreateReceipt(userId, "Lidl")
        };
        _repositoryMock.Setup(r => r.GetByUserIdAsync(userId, default)).ReturnsAsync(receipts);

        // Act
        var result = (await _sut.GetUserReceiptsAsync(userId)).ToList();

        // Assert
        result.Should().HaveCount(2);
        result[0].Store.Should().Be("ICA Maxi");
        result[1].Store.Should().Be("Lidl");
    }

    [Fact]
    public async Task GetReceiptByIdAsync_WhenReceiptBelongsToUser_ReturnsReceipt()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var receipt = CreateReceipt(userId, "ICA Nära");
        _repositoryMock.Setup(r => r.GetByIdAsync(receipt.Id, default)).ReturnsAsync(receipt);

        // Act
        var result = await _sut.GetReceiptByIdAsync(receipt.Id, userId);

        // Assert
        result.Should().NotBeNull();
        result!.Store.Should().Be("ICA Nära");
        result.UserId.Should().Be(userId);
    }

    [Fact]
    public async Task GetReceiptByIdAsync_WhenReceiptBelongsToDifferentUser_ReturnsNull()
    {
        // Arrange
        var ownerId = Guid.NewGuid();
        var requestingUserId = Guid.NewGuid();
        var receipt = CreateReceipt(ownerId, "ICA Nära");

        _repositoryMock.Setup(r => r.GetByIdAsync(receipt.Id, default)).ReturnsAsync(receipt);

        // Act
        var result = await _sut.GetReceiptByIdAsync(receipt.Id, requestingUserId);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetReceiptByIdAsync_WhenReceiptNotFound_ReturnsNull()
    {
        // Arrange
        _repositoryMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default))
            .ReturnsAsync((Receipt?)null);

        // Act
        var result = await _sut.GetReceiptByIdAsync(Guid.NewGuid(), Guid.NewGuid());

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task CreateReceiptAsync_CreatesAndReturnsReceipt()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var request = new CreateReceiptRequest(
            Store: "Willys",
            StoreShort: "WLY",
            Category: "Mat & Dagligvaror",
            CategoryEn: "Groceries",
            Date: DateOnly.FromDateTime(DateTime.Today),
            Time: TimeOnly.FromDateTime(DateTime.Now),
            Total: 349.50m,
            Vat: 26.25m,
            Payment: "Kort",
            Items: [
                new CreateReceiptItemRequest("Mjölk", "Milk", 2, "st", 13.90m, "Mejeri"),
                new CreateReceiptItemRequest("Bröd", "Bread", 1, "st", 29.90m, "Bröd")
            ],
            ImagePath: null,
            HouseholdId: null
        );

        _repositoryMock.Setup(r => r.AddAsync(It.IsAny<Receipt>(), default))
            .ReturnsAsync((Receipt r, CancellationToken _) => r);

        // Act
        var result = await _sut.CreateReceiptAsync(userId, request);

        // Assert
        result.Should().NotBeNull();
        result.Store.Should().Be("Willys");
        result.Total.Should().Be(349.50m);
        result.UserId.Should().Be(userId);
        result.Items.Should().HaveCount(2);
        _repositoryMock.Verify(r => r.AddAsync(It.IsAny<Receipt>(), default), Times.Once);
    }

    [Fact]
    public async Task UpdateReceiptAsync_WhenNotOwner_ReturnsNull()
    {
        // Arrange
        var receiptId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        _repositoryMock.Setup(r => r.BelongsToUserAsync(receiptId, userId, default)).ReturnsAsync(false);

        var request = new UpdateReceiptRequest(
            "Store", "ST", "Cat", "CatEn",
            DateOnly.FromDateTime(DateTime.Today), TimeOnly.MinValue,
            100m, 10m, "Kort", [], null
        );

        // Act
        var result = await _sut.UpdateReceiptAsync(receiptId, userId, request);

        // Assert
        result.Should().BeNull();
        _repositoryMock.Verify(r => r.UpdateAsync(It.IsAny<Receipt>(), default), Times.Never);
    }

    [Fact]
    public async Task UpdateReceiptAsync_WhenOwner_UpdatesAndReturnsReceipt()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var existing = CreateReceipt(userId, "Old Store");

        _repositoryMock.Setup(r => r.BelongsToUserAsync(existing.Id, userId, default)).ReturnsAsync(true);
        _repositoryMock.Setup(r => r.GetByIdAsync(existing.Id, default)).ReturnsAsync(existing);
        _repositoryMock.Setup(r => r.UpdateAsync(It.IsAny<Receipt>(), default))
            .ReturnsAsync((Receipt r, CancellationToken _) => r);

        var request = new UpdateReceiptRequest(
            "New Store", "NS", "Mat", "Food",
            DateOnly.FromDateTime(DateTime.Today), TimeOnly.MinValue,
            200m, 20m, "Swish", [], null
        );

        // Act
        var result = await _sut.UpdateReceiptAsync(existing.Id, userId, request);

        // Assert
        result.Should().NotBeNull();
        result!.Store.Should().Be("New Store");
        result.Total.Should().Be(200m);
    }

    [Fact]
    public async Task DeleteReceiptAsync_WhenNotOwner_ReturnsFalse()
    {
        // Arrange
        var receiptId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        _repositoryMock.Setup(r => r.BelongsToUserAsync(receiptId, userId, default)).ReturnsAsync(false);

        // Act
        var result = await _sut.DeleteReceiptAsync(receiptId, userId);

        // Assert
        result.Should().BeFalse();
        _repositoryMock.Verify(r => r.DeleteAsync(It.IsAny<Guid>(), default), Times.Never);
    }

    [Fact]
    public async Task DeleteReceiptAsync_WhenOwner_DeletesAndReturnsTrue()
    {
        // Arrange
        var receiptId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        _repositoryMock.Setup(r => r.BelongsToUserAsync(receiptId, userId, default)).ReturnsAsync(true);
        _repositoryMock.Setup(r => r.DeleteAsync(receiptId, default)).Returns(Task.CompletedTask);

        // Act
        var result = await _sut.DeleteReceiptAsync(receiptId, userId);

        // Assert
        result.Should().BeTrue();
        _repositoryMock.Verify(r => r.DeleteAsync(receiptId, default), Times.Once);
    }

    [Fact]
    public async Task GetFilteredReceiptsAsync_PassesFiltersToRepository()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var dateFrom = new DateOnly(2024, 1, 1);
        var dateTo = new DateOnly(2024, 12, 31);
        const string category = "Groceries";

        _repositoryMock.Setup(r => r.GetFilteredAsync(userId, dateFrom, dateTo, category, default))
            .ReturnsAsync([]);

        // Act
        await _sut.GetFilteredReceiptsAsync(userId, dateFrom, dateTo, category);

        // Assert
        _repositoryMock.Verify(r => r.GetFilteredAsync(userId, dateFrom, dateTo, category, default), Times.Once);
    }

    private static Receipt CreateReceipt(Guid userId, string store) => new()
    {
        Id = Guid.NewGuid(),
        UserId = userId,
        Store = store,
        StoreShort = store[..3].ToUpper(),
        Category = "Mat",
        CategoryEn = "Food",
        Date = DateOnly.FromDateTime(DateTime.Today),
        Time = TimeOnly.FromDateTime(DateTime.Now),
        Total = 150m,
        Vat = 15m,
        Payment = "Kort",
        Items = []
    };
}
