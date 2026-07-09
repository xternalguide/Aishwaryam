using System;
using System.IO;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Aishwaryam.Infrastructure.Data;
using Aishwaryam.Domain.Entities;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Aishwaryam.Api.Services
{
    public class ApiErrorLoggingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ApiErrorLoggingMiddleware> _logger;

        public ApiErrorLoggingMiddleware(RequestDelegate next, ILogger<ApiErrorLoggingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // 1. Enable request body buffering so we can read it and still pass it downstream
            context.Request.EnableBuffering();

            // Capture request body string
            string requestBody = "";
            if (context.Request.ContentLength > 0)
            {
                using (var reader = new StreamReader(context.Request.Body, Encoding.UTF8, detectEncodingFromByteOrderMarks: true, bufferSize: 1024, leaveOpen: true))
                {
                    requestBody = await reader.ReadToEndAsync();
                    context.Request.Body.Position = 0; // Reset position
                }
            }

            // Capture response body by intercepting the stream
            var originalResponseBodyStream = context.Response.Body;
            using var responseBodyStream = new MemoryStream();
            context.Response.Body = responseBodyStream;

            Exception? caughtException = null;
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                caughtException = ex;
                context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            }

            // Read response body
            responseBodyStream.Position = 0;
            string responseBody = await new StreamReader(responseBodyStream).ReadToEndAsync();
            responseBodyStream.Position = 0;
            await responseBodyStream.CopyToAsync(originalResponseBodyStream);
            context.Response.Body = originalResponseBodyStream;

            // Resolve DbContext via scoped service provider
            var dbContext = context.RequestServices.GetRequiredService<ApplicationDbContext>();

            var path = context.Request.Path.ToString();
            var method = context.Request.Method;
            var clientIp = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

            // 2. Track token creation on successful auth responses
            if (context.Response.StatusCode == StatusCodes.Status200OK &&
                (path.Contains("/api/Auth/verify-otp", StringComparison.OrdinalIgnoreCase) ||
                 path.Contains("/api/Auth/verify-firebase-token", StringComparison.OrdinalIgnoreCase) ||
                 path.Contains("/api/Auth/verify-mpin", StringComparison.OrdinalIgnoreCase) ||
                 path.Contains("/api/Auth/refresh", StringComparison.OrdinalIgnoreCase)))
            {
                try
                {
                    var responseJson = JsonDocument.Parse(responseBody);
                    if (responseJson.RootElement.TryGetProperty("success", out var successProp) && successProp.GetBoolean())
                    {
                        string? token = null;
                        if (responseJson.RootElement.TryGetProperty("token", out var tokenProp))
                        {
                            token = tokenProp.GetString();
                        }
                        else if (responseJson.RootElement.TryGetProperty("accessToken", out var tokenProp2))
                        {
                            token = tokenProp2.GetString();
                        }

                        Guid? userId = null;
                        if (responseJson.RootElement.TryGetProperty("userId", out var userProp))
                        {
                            userId = userProp.GetGuid();
                        }

                        if (!string.IsNullOrEmpty(token) && userId.HasValue)
                        {
                            var user = await dbContext.Users.FindAsync(userId.Value);
                            var phone = user?.PhoneNumber ?? "unknown";
                            var name = user?.FullName ?? "unknown";

                            var expires = DateTimeOffset.UtcNow.AddDays(30);
                            try
                            {
                                var tokenHandler = new JwtSecurityTokenHandler();
                                if (tokenHandler.CanReadToken(token))
                                {
                                    var jwtToken = tokenHandler.ReadJwtToken(token);
                                    expires = jwtToken.ValidTo;
                                }
                            }
                            catch (Exception ex)
                            {
                                _logger.LogWarning(ex, "Failed to parse JWT token expiration.");
                            }

                            var tokenTracker = new TokenTracker
                            {
                                UserId = userId.Value,
                                PhoneNumber = phone,
                                FullName = name,
                                Token = token,
                                ExpiresAt = expires
                            };

                            dbContext.TokenTrackers.Add(tokenTracker);
                            await dbContext.SaveChangesAsync();
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to parse auth token response for tracking.");
                }
            }

            // 3. Log API Errors (400 or above or Exception)
            if (context.Response.StatusCode >= 400 || caughtException != null)
            {
                try
                {
                    // Serialize headers
                    var headersDict = new System.Collections.Generic.Dictionary<string, string>();
                    foreach (var header in context.Request.Headers)
                    {
                        headersDict[header.Key] = header.Value.ToString();
                    }
                    var headersJson = JsonSerializer.Serialize(headersDict);

                    var errMsg = caughtException?.Message ?? $"API request failed with status code {context.Response.StatusCode}";
                    var stackTrace = caughtException?.StackTrace;

                    var errorLog = new ApiErrorLog
                    {
                        RequestPath = path,
                        Method = method,
                        Headers = headersJson,
                        RequestPayload = requestBody,
                        ResponsePayload = responseBody,
                        ClientIp = clientIp,
                        ErrorMessage = errMsg,
                        StackTrace = stackTrace
                    };

                    dbContext.ApiErrorLogs.Add(errorLog);
                    await dbContext.SaveChangesAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to log API exception to database.");
                }
            }

            // 4. Log Admin Writes (Audit Trail)
            if (path.StartsWith("/api/Admin", StringComparison.OrdinalIgnoreCase) && 
                (method == "POST" || method == "PUT" || method == "DELETE"))
            {
                try
                {
                    var adminEmail = context.User.Identity?.Name ?? 
                                     context.User.FindFirstValue(ClaimTypes.Email) ?? 
                                     context.User.FindFirstValue(ClaimTypes.Name) ?? 
                                     "Admin";

                    var auditLog = new AdminAuditLog
                    {
                        AdminEmail = adminEmail,
                        ActionType = $"{method} {path}",
                        TargetEntityId = "",
                        Notes = requestBody,
                        IpAddress = clientIp
                    };

                    dbContext.AdminAuditLogs.Add(auditLog);
                    await dbContext.SaveChangesAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to log Admin Audit action to database.");
                }
            }

            if (caughtException != null)
            {
                // Set content type and return standard response payload
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(JsonSerializer.Serialize(new {
                    Success = false,
                    Message = caughtException.Message
                }));
            }
        }
    }
}
