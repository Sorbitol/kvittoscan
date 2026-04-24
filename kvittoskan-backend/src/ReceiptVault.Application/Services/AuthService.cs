using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Cryptography.KeyDerivation;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using ReceiptVault.Application.DTOs;
using ReceiptVault.Application.Interfaces;
using ReceiptVault.Domain.Entities;

namespace ReceiptVault.Application.Services;

public class AuthService(
    IUserRepository userRepository,
    IConfiguration configuration,
    ILogger<AuthService> logger)
{
    private readonly JwtSettings _jwtSettings = configuration.GetSection("JwtSettings").Get<JwtSettings>()
        ?? throw new InvalidOperationException("JwtSettings not configured.");

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        if (await userRepository.ExistsByEmailAsync(request.Email, cancellationToken))
            throw new InvalidOperationException($"A user with email '{request.Email}' already exists.");

        var salt = GenerateSalt();
        var passwordHash = HashPassword(request.Password, salt);
        var initial = string.IsNullOrWhiteSpace(request.DisplayName)
            ? request.Email[0].ToString().ToUpper()
            : request.DisplayName[0].ToString().ToUpper();

        var user = new User
        {
            Email = request.Email.ToLowerInvariant(),
            PasswordHash = $"{Convert.ToBase64String(salt)}:{passwordHash}",
            DisplayName = request.DisplayName,
            Initial = initial
        };

        var created = await userRepository.AddAsync(user, cancellationToken);
        logger.LogInformation("User {UserId} registered with email {Email}", created.Id, created.Email);

        return GenerateAuthResponse(created);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetByEmailAsync(request.Email.ToLowerInvariant(), cancellationToken)
            ?? throw new UnauthorizedAccessException("Invalid email or password.");

        if (!VerifyPassword(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid email or password.");

        logger.LogInformation("User {UserId} logged in", user.Id);
        return GenerateAuthResponse(user);
    }

    public async Task<UserDto?> GetUserByIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetByIdAsync(userId, cancellationToken);
        return user is null ? null : MapToUserDto(user);
    }

    private AuthResponse GenerateAuthResponse(User user)
    {
        var expiresAt = DateTime.UtcNow.AddHours(_jwtSettings.ExpiresInHours);
        var accessToken = GenerateJwtToken(user, expiresAt);
        var refreshToken = GenerateRefreshToken();

        return new AuthResponse(
            accessToken,
            refreshToken,
            expiresAt,
            MapToUserDto(user)
        );
    }

    private string GenerateJwtToken(User user, DateTime expiresAt)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim("displayName", user.DisplayName),
            new Claim("initial", user.Initial),
        };

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: expiresAt,
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string GenerateRefreshToken()
    {
        var bytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes);
    }

    private static byte[] GenerateSalt()
    {
        var salt = new byte[16];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(salt);
        return salt;
    }

    private static string HashPassword(string password, byte[] salt) =>
        Convert.ToBase64String(KeyDerivation.Pbkdf2(
            password: password,
            salt: salt,
            prf: KeyDerivationPrf.HMACSHA256,
            iterationCount: 100_000,
            numBytesRequested: 32
        ));

    private static bool VerifyPassword(string password, string storedHash)
    {
        var parts = storedHash.Split(':');
        if (parts.Length != 2)
            return false;

        var salt = Convert.FromBase64String(parts[0]);
        var expectedHash = parts[1];
        var actualHash = HashPassword(password, salt);
        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(actualHash),
            Encoding.UTF8.GetBytes(expectedHash)
        );
    }

    private static UserDto MapToUserDto(User user) => new(
        user.Id,
        user.Email,
        user.DisplayName,
        user.Initial,
        user.HouseholdId
    );
}

internal record JwtSettings
{
    public string SecretKey { get; init; } = string.Empty;
    public string Issuer { get; init; } = string.Empty;
    public string Audience { get; init; } = string.Empty;
    public int ExpiresInHours { get; init; } = 24;
}
