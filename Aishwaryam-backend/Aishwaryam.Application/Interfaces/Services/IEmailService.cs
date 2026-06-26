using System.Threading.Tasks;

namespace Aishwaryam.Application.Interfaces.Services
{
    /// <summary>
    /// Transactional email service abstraction.
    /// Implement with Brevo, Resend, or any SMTP provider.
    /// Keys are injected via configuration (Email:ApiKey, Email:FromAddress, Email:FromName).
    /// </summary>
    public interface IEmailService
    {
        /// <summary>Send a transactional email using a pre-rendered HTML body.</summary>
        Task<bool> SendAsync(string toEmail, string toName, string subject, string htmlBody);

        /// <summary>Send using a named template key — delegates to EmailTemplateRenderer.</summary>
        Task<bool> SendTemplatedAsync(string toEmail, string toName, EmailTemplate template, object templateData);
    }

    /// <summary>Named email template keys — maps to HTML template files or inline strings.</summary>
    public enum EmailTemplate
    {
        Welcome,
        GoldPurchaseReceipt,
        SchemeJoined,
        InstallmentSuccess,
        GoldRedeemed,
        SchemeMatured,
        KycApproved,
        ReferralRewardUnlocked,
        GoldPriceAlert,
        GenericNotification
    }
}
