using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Aishwaryam.Infrastructure.Data;
using Aishwaryam.Domain.Entities;
using System.Collections.Generic;

namespace Aishwaryam.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AddressController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AddressController(ApplicationDbContext context)
        {
            _context = context;
        }

        private static readonly Dictionary<string, Dictionary<string, string[]>> PinCodeMapping = new()
        {
            {
                "Tamil Nadu", new Dictionary<string, string[]>
                {
                    { "Chennai", new[] { "600" } },
                    { "Coimbatore", new[] { "641" } },
                    { "Madurai", new[] { "625" } },
                    { "Salem", new[] { "636" } },
                    { "Trichy", new[] { "620" } },
                    { "Tirunelveli", new[] { "627" } }
                }
            },
            {
                "Puducherry", new Dictionary<string, string[]>
                {
                    { "Puducherry", new[] { "605" } },
                    { "Karaikal", new[] { "609" } }
                }
            },
            {
                "Kerala", new Dictionary<string, string[]>
                {
                    { "Kochi", new[] { "682" } },
                    { "Thiruvananthapuram", new[] { "695" } }
                }
            },
            {
                "Karnataka", new Dictionary<string, string[]>
                {
                    { "Bengaluru", new[] { "560" } },
                    { "Mysuru", new[] { "570" } }
                }
            }
        };

        private static bool ValidatePinCode(string state, string city, string pincode)
        {
            if (string.IsNullOrWhiteSpace(pincode) || pincode.Length != 6 || !pincode.All(char.IsDigit))
            {
                return false;
            }

            if (!PinCodeMapping.TryGetValue(state, out var cities))
            {
                return false;
            }

            if (!cities.TryGetValue(city, out var prefixes))
            {
                return false;
            }

            return prefixes.Any(prefix => pincode.StartsWith(prefix));
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserAddresses(Guid userId)
        {
            var addresses = await _context.Addresses
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.IsDefault)
                .ThenByDescending(a => a.CreatedAt)
                .ToListAsync();
            return Ok(addresses);
        }

        [HttpPost("add")]
        public async Task<IActionResult> AddAddress([FromBody] AddAddressRequest request)
        {
            // Verify address limit
            var count = await _context.Addresses.CountAsync(a => a.UserId == request.UserId);
            if (count >= 3)
            {
                return BadRequest(new { Message = "Maximum limit of 3 addresses reached. Please delete an address before adding a new one." });
            }

            // Validate State, City, PIN code
            if (!ValidatePinCode(request.State, request.City, request.Pincode))
            {
                return BadRequest(new { Message = $"Invalid PIN code '{request.Pincode}' for the selected state '{request.State}' and city '{request.City}'." });
            }

            var address = new Address
            {
                Id = Guid.NewGuid(),
                UserId = request.UserId,
                State = request.State,
                City = request.City,
                StreetAddress = request.StreetAddress,
                Pincode = request.Pincode,
                IsDefault = request.IsDefault || count == 0, // Make default if requested or if it's the first one
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };

            if (address.IsDefault)
            {
                // Unset default from existing addresses
                var defaults = await _context.Addresses.Where(a => a.UserId == request.UserId && a.IsDefault).ToListAsync();
                foreach (var def in defaults)
                {
                    def.IsDefault = false;
                }
            }

            _context.Addresses.Add(address);
            await _context.SaveChangesAsync();

            return Ok(address);
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdateAddress(Guid id, [FromBody] UpdateAddressRequest request)
        {
            var address = await _context.Addresses.FindAsync(id);
            if (address == null) return NotFound(new { Message = "Address not found." });

            // Validate State, City, PIN code
            if (!ValidatePinCode(request.State, request.City, request.Pincode))
            {
                return BadRequest(new { Message = $"Invalid PIN code '{request.Pincode}' for the selected state '{request.State}' and city '{request.City}'." });
            }

            address.State = request.State;
            address.City = request.City;
            address.StreetAddress = request.StreetAddress;
            address.Pincode = request.Pincode;
            address.UpdatedAt = DateTimeOffset.UtcNow;

            if (request.IsDefault && !address.IsDefault)
            {
                address.IsDefault = true;
                // Unset default from others
                var defaults = await _context.Addresses.Where(a => a.UserId == address.UserId && a.Id != id && a.IsDefault).ToListAsync();
                foreach (var def in defaults)
                {
                    def.IsDefault = false;
                }
            }

            await _context.SaveChangesAsync();
            return Ok(address);
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> DeleteAddress(Guid id)
        {
            var address = await _context.Addresses.FindAsync(id);
            if (address == null) return NotFound(new { Message = "Address not found." });

            bool wasDefault = address.IsDefault;
            var userId = address.UserId;

            _context.Addresses.Remove(address);
            await _context.SaveChangesAsync();

            // If we deleted the default address, make another one default
            if (wasDefault)
            {
                var nextAddress = await _context.Addresses
                    .Where(a => a.UserId == userId)
                    .OrderByDescending(a => a.CreatedAt)
                    .FirstOrDefaultAsync();
                
                if (nextAddress != null)
                {
                    nextAddress.IsDefault = true;
                    await _context.SaveChangesAsync();
                }
            }

            return Ok(new { Message = "Address deleted successfully.", Success = true });
        }

        [HttpPut("set-default/{id}")]
        public async Task<IActionResult> SetDefault(Guid id)
        {
            var address = await _context.Addresses.FindAsync(id);
            if (address == null) return NotFound(new { Message = "Address not found." });

            var userId = address.UserId;
            var allAddresses = await _context.Addresses.Where(a => a.UserId == userId).ToListAsync();

            foreach (var addr in allAddresses)
            {
                addr.IsDefault = (addr.Id == id);
            }

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Address set as default successfully.", Success = true });
        }
    }

    public class AddAddressRequest
    {
        public Guid UserId { get; set; }
        public string State { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string StreetAddress { get; set; } = string.Empty;
        public string Pincode { get; set; } = string.Empty;
        public bool IsDefault { get; set; }
    }

    public class UpdateAddressRequest
    {
        public string State { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string StreetAddress { get; set; } = string.Empty;
        public string Pincode { get; set; } = string.Empty;
        public bool IsDefault { get; set; }
    }
}
