namespace ReceiptVault.Application.DTOs;

public record LoginRequest(
    string Email,
    string Password
);

public record RegisterRequest(
    string Email,
    string Password,
    string DisplayName
);

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt,
    UserDto User
);

public record UserDto(
    Guid Id,
    string Email,
    string DisplayName,
    string Initial,
    Guid? HouseholdId
);
