using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Aishwaryam.Application.DTOs.Banking;
using Aishwaryam.Application.Interfaces.Services;

namespace Aishwaryam.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BankingController : ControllerBase
    {
        private readonly IBankingService _bankingService;

        public BankingController(IBankingService bankingService)
        {
            _bankingService = bankingService;
        }

        [HttpPost("add-account")]
        public async Task<IActionResult> AddBankAccount([FromBody] AddBankAccountRequest request)
        {
            if (request.UserId == Guid.Empty || string.IsNullOrEmpty(request.AccountNumber))
                return BadRequest(new { Message = "Invalid bank account request." });

            try
            {
                var response = await _bankingService.AddBankAccountAsync(request);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while adding bank account.", Details = ex.Message });
            }
        }

        [HttpPost("withdraw")]
        public async Task<IActionResult> RequestWithdrawal([FromBody] WithdrawalRequestDto request)
        {
            if (request.UserId == Guid.Empty || request.AmountPaise <= 0)
                return BadRequest(new { Message = "Invalid withdrawal request." });

            request.IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

            try
            {
                var response = await _bankingService.RequestWithdrawalAsync(request);
                if (response.Success)
                    return Ok(response);

                return BadRequest(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while processing withdrawal.", Details = ex.Message });
            }
        }

        [HttpGet("accounts/{userId}")]
        public async Task<IActionResult> GetBankAccounts(Guid userId)
        {
            if (userId == Guid.Empty)
                return BadRequest(new { Message = "Invalid user ID." });

            try
            {
                var response = await _bankingService.GetBankAccountsAsync(userId);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while fetching bank accounts.", Details = ex.Message });
            }
        }
    }
}
