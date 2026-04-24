using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using ReceiptVault.Application.DTOs;
using ReceiptVault.Application.Interfaces;
using ReceiptVault.Application.Services;
using ReceiptVault.Domain.Entities;

namespace ReceiptVault.Tests.Services;

public class AuthServiceTests
{
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly Mock<ILogger<AuthService>> _loggerMock;
    private readonly AuthService _sut;

    public AuthServiceTests()
    {
        _userRepositoryMock = new Mock<IUserRepository>();
        _loggerMock = new Mock<ILogger<AuthService>>();

        var inMemorySettings = new Dictionary<string, string?>
        {
            ["JwtSettings:SecretKey"] = "test-secret-key-that-is-long-enough-for-hmac-sha256-signing",
            ["JwtSettings:Issuer"] = "kvittoskan-test",
            ["JwtSettings:Audience"] = "kvittoskan-test-app",
            ["JwtSettings:ExpiresInHours"] = "24"
        };

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();

        _sut = new AuthService(_userRepositoryMock.Object, configuration, _loggerMock.Object);
    }

    [Fact]
    public async Task RegisterAsync_WithNewEmail_CreatesUserAndReturnsTokens()
    {
        // Arrange
        _userRepositoryMock.Setup(r => r.ExistsByEmailAsync("test@example.com", default)).ReturnsAsync(false);
        _userRepositoryMock.Setup(r => r.AddAsync(It.IsAny<User>(), default))
            .ReturnsAsync((User u, CancellationToken _) => u);

        var request = new RegisterRequest("test@example.com", "Password123!", "Test User");

        // Act
        var result = await _sut.RegisterAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.AccessToken.Should().NotBeNullOrEmpty();
        result.RefreshToken.Should().NotBeNullOrEmpty();
        result.ExpiresAt.Should().BeAfter(DateTime.UtcNow);
        result.User.Email.Should().Be("test@example.com");
        result.User.DisplayName.Should().Be("Test User");
        result.User.Initial.Should().Be("T");
    }

    [Fact]
    public async Task RegisterAsync_WithExistingEmail_ThrowsInvalidOperationException()
    {
        // Arrange
        _userRepositoryMock.Setup(r => r.ExistsByEmailAsync("existing@example.com", default)).ReturnsAsync(true);
        var request = new RegisterRequest("existing@example.com", "Password123!", "Test User");

        // Act
        var act = async () => await _sut.RegisterAsync(request);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*existing@example.com*");
    }

    [Fact]
    public async Task LoginAsync_WithValidCredentials_ReturnsTokens()
    {
        // Arrange
        var salt = Convert.ToBase64String(new byte[16]);
        // We need to create a valid password hash for "Password123!"
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "user@example.com",
            DisplayName = "User",
            Initial = "U",
            PasswordHash = BuildPasswordHash("Password123!")
        };

        _userRepositoryMock.Setup(r => r.GetByEmailAsync("user@example.com", default)).ReturnsAsync(user);

        var request = new LoginRequest("user@example.com", "Password123!");

        // Act
        var result = await _sut.LoginAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.AccessToken.Should().NotBeNullOrEmpty();
        result.User.Email.Should().Be("user@example.com");
    }

    [Fact]
    public async Task LoginAsync_WithWrongPassword_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "user@example.com",
            DisplayName = "User",
            Initial = "U",
            PasswordHash = BuildPasswordHash("CorrectPassword!")
        };

        _userRepositoryMock.Setup(r => r.GetByEmailAsync("user@example.com", default)).ReturnsAsync(user);

        var request = new LoginRequest("user@example.com", "WrongPassword!");

        // Act
        var act = async () => await _sut.LoginAsync(request);

        // Assert
        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task LoginAsync_WithNonExistentUser_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        _userRepositoryMock.Setup(r => r.GetByEmailAsync(It.IsAny<string>(), default))
            .ReturnsAsync((User?)null);

        var request = new LoginRequest("nobody@example.com", "Password123!");

        // Act
        var act = async () => await _sut.LoginAsync(request);

        // Assert
        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task GetUserByIdAsync_WhenUserExists_ReturnsUserDto()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "user@example.com",
            DisplayName = "User",
            Initial = "U",
            PasswordHash = "irrelevant"
        };

        _userRepositoryMock.Setup(r => r.GetByIdAsync(userId, default)).ReturnsAsync(user);

        // Act
        var result = await _sut.GetUserByIdAsync(userId);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(userId);
        result.Email.Should().Be("user@example.com");
    }

    [Fact]
    public async Task GetUserByIdAsync_WhenUserNotFound_ReturnsNull()
    {
        // Arrange
        _userRepositoryMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default))
            .ReturnsAsync((User?)null);

        // Act
        var result = await _sut.GetUserByIdAsync(Guid.NewGuid());

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task RegisterAsync_EmailIsStoredLowercase()
    {
        // Arrange
        _userRepositoryMock.Setup(r => r.ExistsByEmailAsync(It.IsAny<string>(), default)).ReturnsAsync(false);

        User? capturedUser = null;
        _userRepositoryMock.Setup(r => r.AddAsync(It.IsAny<User>(), default))
            .Callback<User, CancellationToken>((u, _) => capturedUser = u)
            .ReturnsAsync((User u, CancellationToken _) => u);

        var request = new RegisterRequest("TEST@EXAMPLE.COM", "Password123!", "Test");

        // Act
        await _sut.RegisterAsync(request);

        // Assert
        capturedUser.Should().NotBeNull();
        capturedUser!.Email.Should().Be("test@example.com");
    }

    private static string BuildPasswordHash(string password)
    {
        var salt = new byte[16];
        using var rng = System.Security.Cryptography.RandomNumberGenerator.Create();
        rng.GetBytes(salt);

        var hash = Microsoft.AspNetCore.Cryptography.KeyDerivation.KeyDerivation.Pbkdf2(
            password: password,
            salt: salt,
            prf: Microsoft.AspNetCore.Cryptography.KeyDerivation.KeyDerivationPrf.HMACSHA256,
            iterationCount: 100_000,
            numBytesRequested: 32
        );

        return $"{Convert.ToBase64String(salt)}:{Convert.ToBase64String(hash)}";
    }
}
