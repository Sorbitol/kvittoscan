using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using ReceiptVault.API.Controllers;
using ReceiptVault.Application.DTOs;
using ReceiptVault.Application.Services;
using ReceiptVault.Application.Interfaces;

namespace ReceiptVault.Tests.Controllers;

public class ReceiptsControllerTests
{
    private readonly Mock<IReceiptRepository> _repositoryMock;
    private readonly Mock<ILogger<ReceiptService>> _serviceLoggerMock;
    private readonly Mock<ILogger<ReceiptsController>> _controllerLoggerMock;
    private readonly ReceiptsController _sut;
    private readonly Guid _userId;

    public ReceiptsControllerTests()
    {
        _repositoryMock = new Mock<IReceiptRepository>();
        _serviceLoggerMock = new Mock<ILogger<ReceiptService>>();
        _controllerLoggerMock = new Mock<ILogger<ReceiptsController>>();

        var receiptService = new ReceiptService(_repositoryMock.Object, _serviceLoggerMock.Object);
        _sut = new ReceiptsController(receiptService, _controllerLoggerMock.Object);

        _userId = Guid.NewGuid();
        SetupAuthenticatedUser(_userId);
    }

    [Fact]
    public async Task GetAll_ReturnsOkWithReceipts()
    {
        // Arrange
        var receipts = new List<ReceiptVault.Domain.Entities.Receipt>
        {
            CreateDomainReceipt(_userId, "ICA Maxi"),
            CreateDomainReceipt(_userId, "Lidl")
        };

        _repositoryMock.Setup(r => r.GetByUserIdAsync(_userId, default)).ReturnsAsync(receipts);

        // Act
        var result = await _sut.GetAll(null, null, null, default);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var ok = (OkObjectResult)result;
        var items = (ok.Value as IEnumerable<ReceiptDto>)!.ToList();
        items.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetAll_WithFilters_CallsFilteredQuery()
    {
        // Arrange
        var dateFrom = new DateOnly(2024, 1, 1);
        var dateTo = new DateOnly(2024, 12, 31);
        const string category = "Mat";

        _repositoryMock.Setup(r => r.GetFilteredAsync(_userId, dateFrom, dateTo, category, default))
            .ReturnsAsync([]);

        // Act
        var result = await _sut.GetAll(dateFrom, dateTo, category, default);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        _repositoryMock.Verify(r => r.GetFilteredAsync(_userId, dateFrom, dateTo, category, default), Times.Once);
    }

    [Fact]
    public async Task GetById_WhenReceiptExists_ReturnsOk()
    {
        // Arrange
        var receipt = CreateDomainReceipt(_userId, "COOP");
        _repositoryMock.Setup(r => r.GetByIdAsync(receipt.Id, default)).ReturnsAsync(receipt);

        // Act
        var result = await _sut.GetById(receipt.Id, default);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var ok = (OkObjectResult)result;
        var dto = ok.Value as ReceiptDto;
        dto!.Store.Should().Be("COOP");
    }

    [Fact]
    public async Task GetById_WhenReceiptNotFound_ReturnsNotFound()
    {
        // Arrange
        _repositoryMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default))
            .ReturnsAsync((ReceiptVault.Domain.Entities.Receipt?)null);

        // Act
        var result = await _sut.GetById(Guid.NewGuid(), default);

        // Assert
        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Create_WithValidRequest_ReturnsCreated()
    {
        // Arrange
        var request = new CreateReceiptRequest(
            "Willys", "WLY", "Mat", "Food",
            DateOnly.FromDateTime(DateTime.Today), TimeOnly.MinValue,
            199.90m, 20m, "Kort", [], null, null
        );

        _repositoryMock.Setup(r => r.AddAsync(It.IsAny<ReceiptVault.Domain.Entities.Receipt>(), default))
            .ReturnsAsync((ReceiptVault.Domain.Entities.Receipt r, CancellationToken _) => r);

        // Act
        var result = await _sut.Create(request, default);

        // Assert
        result.Should().BeOfType<CreatedAtActionResult>();
        var created = (CreatedAtActionResult)result;
        created.StatusCode.Should().Be(201);
        var dto = created.Value as ReceiptDto;
        dto!.Store.Should().Be("Willys");
    }

    [Fact]
    public async Task Create_WithMissingStore_ReturnsBadRequest()
    {
        // Arrange
        var request = new CreateReceiptRequest(
            "", "WLY", "Mat", "Food",
            DateOnly.FromDateTime(DateTime.Today), TimeOnly.MinValue,
            100m, 10m, "Kort", [], null, null
        );

        // Act
        var result = await _sut.Create(request, default);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Delete_WhenOwner_ReturnsNoContent()
    {
        // Arrange
        var receiptId = Guid.NewGuid();
        _repositoryMock.Setup(r => r.BelongsToUserAsync(receiptId, _userId, default)).ReturnsAsync(true);
        _repositoryMock.Setup(r => r.DeleteAsync(receiptId, default)).Returns(Task.CompletedTask);

        // Act
        var result = await _sut.Delete(receiptId, default);

        // Assert
        result.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task Delete_WhenNotOwner_ReturnsNotFound()
    {
        // Arrange
        var receiptId = Guid.NewGuid();
        _repositoryMock.Setup(r => r.BelongsToUserAsync(receiptId, _userId, default)).ReturnsAsync(false);

        // Act
        var result = await _sut.Delete(receiptId, default);

        // Assert
        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Update_WhenNotOwner_ReturnsNotFound()
    {
        // Arrange
        var receiptId = Guid.NewGuid();
        _repositoryMock.Setup(r => r.BelongsToUserAsync(receiptId, _userId, default)).ReturnsAsync(false);

        var request = new UpdateReceiptRequest(
            "Store", "ST", "Cat", "CatEn",
            DateOnly.FromDateTime(DateTime.Today), TimeOnly.MinValue,
            100m, 10m, "Kort", [], null
        );

        // Act
        var result = await _sut.Update(receiptId, request, default);

        // Assert
        result.Should().BeOfType<NotFoundResult>();
    }

    private void SetupAuthenticatedUser(Guid userId)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new("sub", userId.ToString())
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _sut.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = claimsPrincipal
            }
        };
    }

    private static ReceiptVault.Domain.Entities.Receipt CreateDomainReceipt(Guid userId, string store) => new()
    {
        Id = Guid.NewGuid(),
        UserId = userId,
        Store = store,
        StoreShort = store[..Math.Min(3, store.Length)].ToUpper(),
        Category = "Mat",
        CategoryEn = "Food",
        Date = DateOnly.FromDateTime(DateTime.Today),
        Time = TimeOnly.FromDateTime(DateTime.Now),
        Total = 250m,
        Vat = 25m,
        Payment = "Kort",
        Items = []
    };
}
