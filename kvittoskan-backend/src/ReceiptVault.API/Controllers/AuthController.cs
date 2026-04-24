using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReceiptVault.Application.DTOs;
using ReceiptVault.Application.Services;

namespace ReceiptVault.API.Controllers;

[ApiController]
[Route("api/auth")]
[Produces("application/json")]
public class AuthController(AuthService authService, ILogger<AuthController> logger) : ControllerBase
{
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
            return BadRequest(new { error = "Email is required." });

        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 8)
            return BadRequest(new { error = "Password must be at least 8 characters." });

        if (string.IsNullOrWhiteSpace(request.DisplayName))
            return BadRequest(new { error = "DisplayName is required." });

        try
        {
            var response = await authService.RegisterAsync(request, cancellationToken);
            return CreatedAtAction(nameof(GetMe), response);
        }
        catch (InvalidOperationException ex)
        {
            logger.LogWarning("Registration conflict: {Message}", ex.Message);
            return Conflict(new { error = ex.Message });
        }
    }

    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { error = "Email and password are required." });

        try
        {
            var response = await authService.LoginAsync(request, cancellationToken);
            return Ok(response);
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new { error = "Invalid email or password." });
        }
    }

    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMe(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized();

        var user = await authService.GetUserByIdAsync(userId.Value, cancellationToken);
        if (user is null)
            return NotFound();

        return Ok(user);
    }

    private Guid? GetCurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
               ?? User.FindFirstValue("sub");

        return Guid.TryParse(sub, out var id) ? id : null;
    }
}
