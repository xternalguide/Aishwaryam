namespace Aishwaryam.Api.Controllers
{
    public class AdminPriceOverrideRequest
    {
        public decimal Price24KPerGram { get; set; }
        public string? Note { get; set; }
        public int DurationHours { get; set; } = 1;
    }
}
