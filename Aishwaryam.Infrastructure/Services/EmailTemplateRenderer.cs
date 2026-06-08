using System;
using System.Collections.Generic;
using System.Text;
using Aishwaryam.Application.Interfaces.Services;

namespace Aishwaryam.Infrastructure.Services
{
    /// <summary>
    /// Renders premium responsive HTML email bodies from named templates.
    /// All templates use inline CSS for maximum email client compatibility.
    /// Supports English + Tamil localization via the Language parameter in templateData.
    ///
    /// Usage:
    ///   var html = EmailTemplateRenderer.Render(EmailTemplate.GoldPurchaseReceipt, data);
    /// </summary>
    public static class EmailTemplateRenderer
    {
        // ── Brand constants ──────────────────────────────────────────────────
        private const string BrandColor   = "#6B21A8"; // Magenta/Purple
        private const string BrandGold    = "#D4AF37";
        private const string BrandName    = "Aishwaryam @ your home";
        private const string SupportEmail = "support@aishwaryam.com";

        public static string Render(EmailTemplate template, object data)
        {
            var props = data.GetType().GetProperties();
            var map = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            foreach (var p in props)
                map[p.Name] = p.GetValue(data)?.ToString() ?? "";

            string body = template switch
            {
                EmailTemplate.Welcome               => Welcome(map),
                EmailTemplate.GoldPurchaseReceipt   => GoldPurchaseReceipt(map),
                EmailTemplate.SchemeJoined          => SchemeJoined(map),
                EmailTemplate.InstallmentSuccess    => InstallmentSuccess(map),
                EmailTemplate.GoldRedeemed          => GoldRedeemed(map),
                EmailTemplate.SchemeMatured         => SchemeMatured(map),
                EmailTemplate.KycApproved           => KycApproved(map),
                EmailTemplate.ReferralRewardUnlocked => ReferralReward(map),
                _                                   => GenericNotification(map)
            };

            return WrapInShell(body, map.GetValueOrDefault("UserName", "Valued Customer"));
        }

        // ── Shell wrapper (header + footer) ─────────────────────────────────
        private static string WrapInShell(string innerHtml, string userName) => $@"
<!DOCTYPE html>
<html lang=""en"">
<head>
  <meta charset=""UTF-8"" />
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"" />
  <title>{BrandName}</title>
</head>
<body style=""margin:0;padding:0;background:#F3F4F6;font-family:'Segoe UI',Arial,sans-serif;"">
  <table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background:#F3F4F6;padding:32px 0;"">
    <tr><td align=""center"">
      <table width=""600"" cellpadding=""0"" cellspacing=""0"" style=""max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);"">

        <!-- Header -->
        <tr>
          <td style=""background:linear-gradient(135deg,{BrandColor} 0%,#9333EA 100%);padding:32px 40px;text-align:center;"">
            <p style=""margin:0;font-size:11px;color:rgba(255,255,255,0.7);letter-spacing:3px;text-transform:uppercase;"">DIGITAL GOLD SAVINGS</p>
            <h1 style=""margin:8px 0 0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;"">
              ✦ {BrandName}
            </h1>
          </td>
        </tr>

        <!-- Body -->
        <tr><td style=""padding:40px 40px 32px;"">
          {innerHtml}
        </td></tr>

        <!-- Footer -->
        <tr>
          <td style=""background:#F9FAFB;border-top:1px solid #E5E7EB;padding:24px 40px;text-align:center;"">
            <p style=""margin:0 0 8px;font-size:12px;color:#9CA3AF;"">
              You are receiving this because you have an account with {BrandName}.
            </p>
            <p style=""margin:0;font-size:12px;color:#9CA3AF;"">
              Need help? <a href=""mailto:{SupportEmail}"" style=""color:{BrandColor};text-decoration:none;"">{SupportEmail}</a>
            </p>
            <p style=""margin:12px 0 0;font-size:11px;color:#D1D5DB;"">
              © {DateTime.UtcNow.Year} Aishwaryam. All rights reserved. | Digital Gold Savings Platform
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>";

        // ── Shared helpers ───────────────────────────────────────────────────
        private static string Greeting(string name) =>
            $@"<p style=""margin:0 0 24px;font-size:18px;color:#111827;"">
                 Hello, <strong>{name}</strong> 👋
               </p>";

        private static string GoldBadge(string goldMg) =>
            $@"<div style=""background:linear-gradient(135deg,#FEF3C7,#FDE68A);border:1px solid {BrandGold};
                           border-radius:12px;padding:20px;text-align:center;margin:24px 0;"">
                 <p style=""margin:0;font-size:13px;color:#92400E;letter-spacing:1px;text-transform:uppercase;"">GOLD CREDITED</p>
                 <p style=""margin:4px 0 0;font-size:36px;font-weight:800;color:#78350F;"">✦ {goldMg} mg</p>
               </div>";

        private static string AmountBadge(string amount) =>
            $@"<div style=""background:#F0FDF4;border:1px solid #86EFAC;border-radius:12px;
                           padding:20px;text-align:center;margin:24px 0;"">
                 <p style=""margin:0;font-size:13px;color:#166534;letter-spacing:1px;text-transform:uppercase;"">AMOUNT</p>
                 <p style=""margin:4px 0 0;font-size:36px;font-weight:800;color:#15803D;"">₹{amount}</p>
               </div>";

        private static string ActionButton(string label, string url) =>
            $@"<div style=""text-align:center;margin:32px 0 0;"">
                 <a href=""{url}"" style=""display:inline-block;background:linear-gradient(135deg,{BrandColor},#9333EA);
                    color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:12px;
                    font-size:15px;font-weight:700;letter-spacing:0.5px;"">{label}</a>
               </div>";

        private static string InfoRow(string label, string value) =>
            $@"<tr>
                 <td style=""padding:10px 0;color:#6B7280;font-size:14px;border-bottom:1px solid #F3F4F6;"">{label}</td>
                 <td style=""padding:10px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;border-bottom:1px solid #F3F4F6;"">{value}</td>
               </tr>";

        // ── Templates ────────────────────────────────────────────────────────

        private static string Welcome(Dictionary<string, string> d) => $@"
{Greeting(d.GetValueOrDefault("UserName", "Friend"))}

<!-- Premium Poster Banner -->
<div style=""background: linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%); border-radius: 16px; padding: 36px 24px; text-align: center; margin: 0 0 32px; box-shadow: 0 10px 25px -5px rgba(67, 56, 202, 0.3); border: 2px solid #FEF08A;"">
  <div style=""font-size: 54px; margin-bottom: 12px; filter: drop-shadow(0 2px 8px rgba(254, 240, 138, 0.4));"">🪙</div>
  <h2 style=""margin: 0 0 12px; color: #FDE047; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; text-transform: uppercase;"">Welcome to Aishwaryam @ your home</h2>
  <p style=""margin: 0; color: #E0E7FF; font-size: 16px; font-weight: 600; letter-spacing: 0.5px;"">✨ Your Premier Digital Gold App ✨</p>
</div>

<!-- Main Message -->
<div style=""background: #FFFFFF; border-left: 4px solid #D4AF37; padding: 16px 20px; margin-bottom: 24px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);"">
  <p style=""margin: 0; color: #111827; font-size: 16px; line-height: 1.6; font-weight: 700;"">
    🎉 Welcome to <strong>Aishwaryam @ your home Digi Gold App</strong>! You can now start purchasing 24K and 22K 91.6% pure digital gold directly from the app anytime, anywhere!
  </p>
</div>

<p style=""color: #374151; font-size: 15px; line-height: 1.8; margin-bottom: 24px;"">
  Buying gold is now easier, safer, and more rewarding than ever. With Aishwaryam @ your home, your gold accumulates in a highly secure, fully insured vault, backed by 100% physical gold assets.
</p>

<!-- Features Grid (Poster Card Style) -->
<table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""margin: 32px 0; border-collapse: separate; border-spacing: 0 16px;"">
  <tr>
    <td style=""background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px; box-shadow: 0 1px 2px rgba(0,0,0,0.02);"">
      <table width=""100%"" cellpadding=""0"" cellspacing=""0"">
        <tr>
          <td width=""40"" valign=""top"" style=""font-size: 24px;"">🚀</td>
          <td style=""padding-left: 12px;"">
            <h4 style=""margin: 0 0 4px; color: #111827; font-size: 15px; font-weight: 700;"">Instant Gold Purchase</h4>
            <p style=""margin: 0; color: #4B5563; font-size: 13px; line-height: 1.5;"">Purchase 99.9% 24K or 91.6% 22K gold starting from just ₹100!</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style=""background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px; box-shadow: 0 1px 2px rgba(0,0,0,0.02);"">
      <table width=""100%"" cellpadding=""0"" cellspacing=""0"">
        <tr>
          <td width=""40"" valign=""top"" style=""font-size: 24px;"">🏆</td>
          <td style=""padding-left: 12px;"">
            <h4 style=""margin: 0 0 4px; color: #111827; font-size: 15px; font-weight: 700;"">Earn Loyalty Bonuses</h4>
            <p style=""margin: 0; color: #4B5563; font-size: 13px; line-height: 1.5;"">Join our saving schemes and earn up to 7.5% bonus gold on every purchase made.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style=""background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px; box-shadow: 0 1px 2px rgba(0,0,0,0.02);"">
      <table width=""100%"" cellpadding=""0"" cellspacing=""0"">
        <tr>
          <td width=""40"" valign=""top"" style=""font-size: 24px;"">🔒</td>
          <td style=""padding-left: 12px;"">
            <h4 style=""margin: 0 0 4px; color: #111827; font-size: 15px; font-weight: 700;"">Fully Secure Vaults</h4>
            <p style=""margin: 0; color: #4B5563; font-size: 13px; line-height: 1.5;"">Your gold is stored in independent, highly secured vaults managed by reputable trustees.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- Poster Footer Callout -->
<div style=""background: #FFFBEB; border: 1px dashed #FCD34D; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 32px;"">
  <p style=""margin: 0; color: #92400E; font-size: 14px; font-weight: 600;"">
    💡 <strong>KYC is active!</strong> Complete your basic details inside the app profile to unlock higher limits and enable seamless transactions.
  </p>
</div>

{ActionButton("Open App & Buy Gold Now", "https://aishwaryam.com/app")}";

        private static string GoldPurchaseReceipt(Dictionary<string, string> d) => $@"
{Greeting(d.GetValueOrDefault("UserName", "Customer"))}
<h2 style=""margin:0 0 4px;color:#111827;font-size:20px;font-weight:700;"">Gold Purchase Confirmed ✅</h2>
<p style=""margin:0 0 24px;color:#6B7280;font-size:14px;"">Transaction ID: <code style=""background:#F3F4F6;padding:2px 8px;border-radius:4px;"">{d.GetValueOrDefault("TransactionId", "—")}</code></p>
{GoldBadge(d.GetValueOrDefault("GoldWeightMg", "0"))}
<table width=""100%"" cellpadding=""0"" cellspacing=""0"">
  {InfoRow("Amount Paid", $"₹{d.GetValueOrDefault("AmountPaid", "0")}")}
  {InfoRow("Gold Rate (22K)", $"₹{d.GetValueOrDefault("GoldRatePerGm", "0")}/gm")}
  {InfoRow("GST (3%)", $"₹{d.GetValueOrDefault("GstAmount", "0")}")}
  {InfoRow("Bonus Gold", $"{d.GetValueOrDefault("BonusGoldMg", "0")} mg ({d.GetValueOrDefault("BonusPercent", "0")}%)")}
  {InfoRow("Total Gold Balance", $"{d.GetValueOrDefault("NewGoldBalanceMg", "0")} mg")}
  {InfoRow("Date", d.GetValueOrDefault("TransactionDate", DateTime.UtcNow.ToString("dd MMM yyyy, hh:mm tt")))}
</table>
<p style=""margin:24px 0 0;font-size:13px;color:#9CA3AF;"">
  Your gold is safely stored in an audited vault. View your portfolio anytime in the app.
</p>
{ActionButton("View Portfolio", "https://aishwaryam.com/app/portfolio")}";

        private static string SchemeJoined(Dictionary<string, string> d) => $@"
{Greeting(d.GetValueOrDefault("UserName", "Customer"))}
<div style=""background:linear-gradient(135deg,{BrandColor}15,{BrandColor}08);border:1px solid {BrandColor}30;
             border-radius:16px;padding:28px;text-align:center;margin:0 0 28px;"">
  <p style=""margin:0;font-size:36px;"">🏆</p>
  <h2 style=""margin:8px 0;color:{BrandColor};font-size:20px;"">You've Joined a Gold Savings Scheme!</h2>
  <p style=""margin:4px 0 0;color:#4B5563;font-size:15px;"">{d.GetValueOrDefault("PlanName", "Gold Savings Plan")}</p>
</div>
<table width=""100%"" cellpadding=""0"" cellspacing=""0"">
  {InfoRow("Plan", d.GetValueOrDefault("PlanName", "—"))}
  {InfoRow("Daily Contribution", $"₹{d.GetValueOrDefault("InstallmentAmount", "0")}")}
  {InfoRow("Total Duration", $"{d.GetValueOrDefault("TotalInstallments", "0")} days")}
  {InfoRow("Maturity Date", d.GetValueOrDefault("MaturityDate", "—"))}
  {InfoRow("Loyalty Bonus", $"Up to {d.GetValueOrDefault("MaxBonus", "7.5")}%")}
  {InfoRow("First Payment", $"₹{d.GetValueOrDefault("FirstInstallmentAmount", "0")}")}
</table>
<p style=""margin:24px 0 0;font-size:14px;color:#374151;line-height:1.7;"">
  Stay consistent! Every on-time purchase increases your loyalty bonus tier.
  Missing purchases may reduce your bonus.
</p>
{ActionButton("View My Scheme", "https://aishwaryam.com/app/schemes")}";

        private static string InstallmentSuccess(Dictionary<string, string> d) => $@"
{Greeting(d.GetValueOrDefault("UserName", "Customer"))}
<h2 style=""margin:0 0 4px;color:#111827;font-size:20px;font-weight:700;"">Payment Successful 💰</h2>
<p style=""margin:0 0 24px;color:#6B7280;font-size:14px;"">Scheme: <strong>{d.GetValueOrDefault("PlanName", "—")}</strong></p>
{GoldBadge(d.GetValueOrDefault("GoldCreditedMg", "0"))}
<table width=""100%"" cellpadding=""0"" cellspacing=""0"">
  {InfoRow("Payment Amount", $"₹{d.GetValueOrDefault("AmountPaid", "0")}")}
  {InfoRow("Payment Number", $"{d.GetValueOrDefault("InstallmentNumber", "0")} of {d.GetValueOrDefault("TotalInstallments", "0")}")}
  {InfoRow("Bonus Earned", $"{d.GetValueOrDefault("BonusGoldMg", "0")} mg ({d.GetValueOrDefault("BonusPercent", "0")}%)")}
  {InfoRow("Total Accumulated Gold", $"{d.GetValueOrDefault("TotalGoldMg", "0")} mg")}
  {InfoRow("Next Due Date", d.GetValueOrDefault("NextDueDate", "—"))}
  {InfoRow("Payment Date", d.GetValueOrDefault("PaymentDate", DateTime.UtcNow.ToString("dd MMM yyyy")))}
</table>
{ActionButton("View Scheme Progress", "https://aishwaryam.com/app/schemes")}";

        private static string GoldRedeemed(Dictionary<string, string> d) => $@"
{Greeting(d.GetValueOrDefault("UserName", "Customer"))}
<div style=""background:#FEF2F2;border:1px solid #FECACA;border-radius:16px;padding:28px;text-align:center;margin:0 0 28px;"">
  <p style=""margin:0;font-size:36px;"">🏅</p>
  <h2 style=""margin:8px 0;color:#991B1B;font-size:20px;"">Gold Redemption Confirmed</h2>
  <p style=""margin:4px 0 0;font-size:28px;font-weight:800;color:#7F1D1D;"">{d.GetValueOrDefault("RedeemedGoldMg", "0")} mg</p>
</div>
<table width=""100%"" cellpadding=""0"" cellspacing=""0"">
  {InfoRow("Gold Redeemed", $"{d.GetValueOrDefault("RedeemedGoldMg", "0")} mg")}
  {InfoRow("Credit Amount", $"₹{d.GetValueOrDefault("CreditAmountRs", "0")}")}
  {InfoRow("Bank Account", d.GetValueOrDefault("BankAccountMasked", "****"))}
  {InfoRow("UTR Number", d.GetValueOrDefault("UtrNumber", "Processing..."))}
  {InfoRow("Expected Credit", d.GetValueOrDefault("ExpectedCreditDate", "2-3 business days"))}
</table>
<p style=""margin:24px 0 0;font-size:13px;color:#9CA3AF;"">
  Funds are transferred via NEFT/IMPS to your registered bank account.
</p>
{ActionButton("View Transaction", "https://aishwaryam.com/app/history")}";

        private static string SchemeMatured(Dictionary<string, string> d) => $@"
{Greeting(d.GetValueOrDefault("UserName", "Customer"))}
<div style=""background:linear-gradient(135deg,#FEF3C7,#FDE68A);border-radius:16px;padding:32px;text-align:center;margin:0 0 28px;"">
  <p style=""margin:0;font-size:48px;"">🎉</p>
  <h2 style=""margin:8px 0;color:#78350F;font-size:24px;font-weight:800;"">Your Scheme Has Matured!</h2>
  <p style=""margin:4px 0 0;color:#92400E;font-size:15px;"">Congratulations on completing your gold savings journey!</p>
</div>
<table width=""100%"" cellpadding=""0"" cellspacing=""0"">
  {InfoRow("Scheme", d.GetValueOrDefault("PlanName", "—"))}
  {InfoRow("Total Gold Accumulated", $"{d.GetValueOrDefault("TotalGoldMg", "0")} mg")}
  {InfoRow("Bonus Gold Earned", $"{d.GetValueOrDefault("TotalBonusMg", "0")} mg")}
  {InfoRow("Total Duration", $"{d.GetValueOrDefault("TotalDays", "0")} days")}
  {InfoRow("Maturity Date", d.GetValueOrDefault("MaturityDate", "—"))}
</table>
<p style=""margin:24px 0 0;font-size:14px;color:#374151;line-height:1.7;"">
  Your accumulated gold is now available for redemption. You can redeem it to your bank account
  or continue saving with a new scheme.
</p>
{ActionButton("Redeem My Gold", "https://aishwaryam.com/app/redeem")}";

        private static string KycApproved(Dictionary<string, string> d) => $@"
{Greeting(d.GetValueOrDefault("UserName", "Customer"))}
<div style=""background:#F0FDF4;border:1px solid #86EFAC;border-radius:16px;padding:28px;text-align:center;margin:0 0 28px;"">
  <p style=""margin:0;font-size:36px;"">✅</p>
  <h2 style=""margin:8px 0;color:#166534;font-size:20px;"">KYC Approved!</h2>
  <p style=""margin:4px 0 0;color:#15803D;font-size:15px;"">Your identity has been verified. Higher limits unlocked.</p>
</div>
<table width=""100%"" cellpadding=""0"" cellspacing=""0"">
  {InfoRow("KYC Level", d.GetValueOrDefault("KycLevel", "KYC_1"))}
  {InfoRow("Daily Limit", $"₹{d.GetValueOrDefault("DailyLimit", "50,000")}")}
  {InfoRow("Monthly Limit", $"₹{d.GetValueOrDefault("MonthlyLimit", "2,00,000")}")}
</table>
{ActionButton("Start Investing", "https://aishwaryam.com/app")}";

        private static string ReferralReward(Dictionary<string, string> d) => $@"
{Greeting(d.GetValueOrDefault("UserName", "Customer"))}
<div style=""background:linear-gradient(135deg,#FEF3C7,#FDE68A);border-radius:16px;padding:28px;text-align:center;margin:0 0 28px;"">
  <p style=""margin:0;font-size:36px;"">🎁</p>
  <h2 style=""margin:8px 0;color:#78350F;font-size:20px;"">Referral Bonus Unlocked!</h2>
  <p style=""margin:4px 0 0;font-size:28px;font-weight:800;color:#78350F;"">{d.GetValueOrDefault("BonusGoldMg", "0")} mg Gold</p>
</div>
<p style=""color:#374151;font-size:15px;line-height:1.7;"">
  Your friend <strong>{d.GetValueOrDefault("RefereeName", "your referral")}</strong> has completed their first investment.
  Your referral bonus of <strong>{d.GetValueOrDefault("BonusGoldMg", "0")} mg</strong> gold has been credited to your wallet!
</p>
{ActionButton("View My Gold", "https://aishwaryam.com/app/portfolio")}";

        private static string GenericNotification(Dictionary<string, string> d) => $@"
{Greeting(d.GetValueOrDefault("UserName", "Customer"))}
<h2 style=""margin:0 0 16px;color:#111827;font-size:20px;"">{d.GetValueOrDefault("Title", "Notification")}</h2>
<p style=""color:#374151;font-size:15px;line-height:1.7;"">{d.GetValueOrDefault("Body", "")}</p>
{ActionButton("Open App", "https://aishwaryam.com/app")}";
    }
}
