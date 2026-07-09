using Microsoft.EntityFrameworkCore;
using Aishwaryam.Application.Interfaces.Repositories;
using Aishwaryam.Application.Interfaces.Services;
using Aishwaryam.Application.Services;
using Aishwaryam.Infrastructure.Data;
using Aishwaryam.Infrastructure.Repositories;
using Aishwaryam.Infrastructure.Services;
using Aishwaryam.Infrastructure.Jobs;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using Serilog;
using Serilog.Events;

using Aishwaryam.Domain.Entities;
using Aishwaryam.Api.Services;

System.AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .WriteTo.Console(new Serilog.Formatting.Compact.CompactJsonFormatter())
    .WriteTo.File(
        new Serilog.Formatting.Compact.CompactJsonFormatter(),
        "logs/aishwaryam-log-.txt",
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 14)
    .CreateLogger();

var builder = WebApplication.CreateBuilder(args);
builder.Host.UseSerilog();

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options => {
        options.JsonSerializerOptions.MaxDepth = 64;
    });

// Security Configuration: JWT
var jwtKey = builder.Configuration["Jwt:Key"] ?? "Aishwaryam_Super_Secret_Key_For_Digital_Gold_Platform_2026!";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "AishwaryamApi";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtIssuer,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.Zero
    };
});

// Rate Limiting Policy
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Auth Rate Limit: 120 requests per 1 minute per IP (partitioned by IP to prevent global scaling bottlenecks)
    options.AddPolicy("auth_policy", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "global_auth",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                Window = TimeSpan.FromMinutes(1),
                PermitLimit = 120,
                QueueLimit = 0,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                AutoReplenishment = true
            }));

    // General API Rate Limit: 100 requests per minute per IP
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "global",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 100,
                QueueLimit = 0,
                Window = TimeSpan.FromMinutes(1)
            }));
});

// Increase JSON Body size limit for Base64 posters
builder.WebHost.ConfigureKestrel(serverOptions => {
    serverOptions.Limits.MaxRequestBodySize = 10 * 1024 * 1024; // 10MB limit
});

builder.Services.AddOpenApi();
builder.Services.AddScoped<IPaymentFulfillmentService, PaymentFulfillmentService>();
builder.Services.AddScoped<Aishwaryam.Application.Interfaces.Repositories.IUnitOfWork, Aishwaryam.Infrastructure.Repositories.UnitOfWork>();
builder.Services.AddHostedService<Aishwaryam.Infrastructure.BackgroundServices.PaymentReconciliationWorker>();
builder.Services.AddMemoryCache();
builder.Services.AddHttpClient();

// Setup Database Context
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

// Add CORS Policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Dependency Injection: Repositories
builder.Services.AddScoped<IAuthRepository, AuthRepository>();
builder.Services.AddScoped<IWalletLedgerRepository, WalletLedgerRepository>();
builder.Services.AddScoped<IGoldRepository, GoldRepository>();
builder.Services.AddScoped<IKycRepository, KycRepository>();
builder.Services.AddScoped<IBankingRepository, BankingRepository>();
builder.Services.AddScoped<ISchemeRepository, SchemeRepository>();

// Dependency Injection: Services
builder.Services.AddScoped<IGoldService, GoldService>();
builder.Services.AddScoped<IWalletService, WalletService>();
builder.Services.AddScoped<ISmsService, BrevoSmsService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IKycService, KycService>();
builder.Services.AddScoped<IBankingService, BankingService>();
builder.Services.AddScoped<ISchemeService, SchemeService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IKycComplianceService, KycComplianceService>();
builder.Services.AddScoped<IAdminRepository, Aishwaryam.Infrastructure.Repositories.AdminRepository>();
builder.Services.AddScoped<IAdminService, Aishwaryam.Application.Services.AdminService>();
builder.Services.AddScoped<IEmailService, BrevoEmailService>();
builder.Services.AddScoped<INotificationDispatcher, NotificationDispatcher>();
builder.Services.AddScoped<ITranslationService, GoogleTranslationService>();

// Gold Price Provider Chain (priority-ordered fallback)
builder.Services.AddSingleton<IGoldPriceProvider, Aishwaryam.Infrastructure.Services.PriceProviders.TheJewellersAssociationProvider>();
builder.Services.AddSingleton<IGoldPriceProvider, Aishwaryam.Infrastructure.Services.PriceProviders.MetalPriceApiProvider>();
builder.Services.AddSingleton<IGoldPriceProvider, Aishwaryam.Infrastructure.Services.PriceProviders.StaticFallbackProvider>();
builder.Services.AddSingleton<IGoldPriceManager, Aishwaryam.Infrastructure.Services.GoldPriceManager>();
builder.Services.AddScoped<Aishwaryam.Infrastructure.Services.GoldScraperService>();
builder.Services.AddScoped<Aishwaryam.Application.Interfaces.Services.IReceiptPdfGenerator, Aishwaryam.Infrastructure.Services.ReceiptPdfGenerator>();

// Register Hosted Services
builder.Services.AddHostedService<Aishwaryam.Api.Services.SchemeAutoPayService>();
builder.Services.AddHostedService<SchemeMaturityJob>();
builder.Services.AddHostedService<NightlyReconciliationJob>();
builder.Services.AddHostedService<Aishwaryam.Infrastructure.BackgroundServices.GoldRateScraperWorker>();
builder.Services.AddHostedService<Aishwaryam.Api.Services.EventOfferWorker>(); // Daily 9 AM IST: birthday/anniversary offers
builder.Services.AddHostedService<Aishwaryam.Api.Services.DailyErrorEmailJob>();

// Ensure wwwroot exists and WebRootPath is set before building the app to enable static files serving correctly
var wwwrootPath = Path.Combine(builder.Environment.ContentRootPath, "wwwroot");
if (!Directory.Exists(wwwrootPath))
{
    Directory.CreateDirectory(wwwrootPath);
}
if (string.IsNullOrEmpty(builder.Environment.WebRootPath))
{
    builder.Environment.WebRootPath = wwwrootPath;
}

var app = builder.Build();

// ── Initialize Firebase Admin SDK ──────────────────────────────────────────
try
{
    var firebaseCredentialPath = builder.Configuration["Firebase:ServiceAccountPath"];
    var firebaseServiceAccountJson = builder.Configuration["Firebase:ServiceAccountJson"];
    GoogleCredential credential;

    if (!string.IsNullOrEmpty(firebaseServiceAccountJson))
    {
        credential = GoogleCredential.FromJson(firebaseServiceAccountJson);
    }
    else if (!string.IsNullOrEmpty(firebaseCredentialPath) && File.Exists(firebaseCredentialPath))
    {
        await using var stream = new FileStream(firebaseCredentialPath, FileMode.Open, FileAccess.Read);
        credential = GoogleCredential.FromStream(stream);
    }
    else
    {
        credential = GoogleCredential.GetApplicationDefault();
    }

    if (FirebaseApp.DefaultInstance == null)
    {
        FirebaseApp.Create(new AppOptions
        {
            Credential = credential,
            ProjectId = builder.Configuration["Firebase:ProjectId"] ?? "aishwaryam-71892"
        });
    }
}
catch (Exception ex)
{
    Console.WriteLine($"[WARNING] Firebase Admin SDK init failed: {ex.Message}");
    Console.WriteLine("[WARNING] Add Firebase:ServiceAccountPath or Firebase:ServiceAccountJson in configuration to enable Firebase Phone Auth.");
}
// ────────────────────────────────────────────────────────────────────────────

// Global API Error Logging and Token Tracking Middleware
app.UseMiddleware<ApiErrorLoggingMiddleware>();

// Custom Security Headers Middleware
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    context.Response.Headers.Append("Content-Security-Policy", "default-src 'self'; frame-ancestors 'none';");
    await next();
});

// ── Ensure Database Tables & Columns Exist ───────────────────────────────────
// Each migration runs in its own try-catch so one failure never blocks the rest.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

    void TryExec(string sql, string label)
    {
        try
        {
            db.Database.ExecuteSqlRaw(sql);
            Console.WriteLine($"[DB-INIT] OK: {label}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[DB-INIT] WARN ({label}): {ex.Message}");
        }
    }

    // ── Core tables ──────────────────────────────────────────────────────────
    TryExec(@"CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        phone_number varchar(15) UNIQUE NOT NULL,
        email varchar(255) UNIQUE,
        full_name varchar(100),
        is_active boolean DEFAULT true,
        kyc_level varchar(20) DEFAULT 'BASIC',
        mpin_hash varchar(255),
        biometric_enabled boolean DEFAULT false,
        referral_code varchar(50),
        date_of_birth date,
        nominee_name varchar(100),
        created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
    );", "users");

    TryExec(@"CREATE TABLE IF NOT EXISTS user_notifications (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid REFERENCES users(id) ON DELETE CASCADE,
        title text NOT NULL,
        message text NOT NULL,
        type varchar(50) DEFAULT 'GENERAL',
        is_read boolean DEFAULT false,
        created_at timestamptz DEFAULT CURRENT_TIMESTAMP
    );", "user_notifications");

    TryExec(@"CREATE TABLE IF NOT EXISTS app_banners (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        title varchar(200) NOT NULL,
        image_base64 text NOT NULL,
        tap_action_url varchar(500),
        is_active boolean DEFAULT true,
        display_order integer DEFAULT 0,
        created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
        created_by_admin_id varchar(100)
    );", "app_banners");

    TryExec(@"CREATE TABLE IF NOT EXISTS schemes_master (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        plan_name varchar(100) NOT NULL,
        description text,
        installment_amount_paise bigint NOT NULL,
        total_installments integer NOT NULL,
        frequency varchar(20) DEFAULT 'Daily',
        bonus_config_json text,
        custom_sections_json text,
        is_active boolean DEFAULT true,
        created_at timestamptz DEFAULT CURRENT_TIMESTAMP
    );", "schemes_master");

    TryExec(@"CREATE TABLE IF NOT EXISTS user_schemes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid REFERENCES users(id) ON DELETE CASCADE,
        plan_name varchar(100) NOT NULL,
        auto_pay_enabled boolean DEFAULT false,
        payment_frequency varchar(20) NOT NULL,
        installment_amount_paise bigint NOT NULL,
        installments_paid integer DEFAULT 0,
        total_installments integer NOT NULL,
        next_due_date timestamptz NOT NULL,
        accumulated_gold_mg integer DEFAULT 0,
        status varchar(20) DEFAULT 'Active',
        created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
    );", "user_schemes");

    TryExec(@"CREATE TABLE IF NOT EXISTS gold_transactions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid REFERENCES users(id) ON DELETE CASCADE,
        transaction_type varchar(10) NOT NULL,
        gold_weight_mg integer NOT NULL,
        price_per_gm_paise bigint NOT NULL,
        total_amount_paise bigint NOT NULL,
        ip_address varchar(45) NOT NULL,
        device_fingerprint varchar(255) NOT NULL,
        created_at timestamptz DEFAULT CURRENT_TIMESTAMP
    );", "gold_transactions");

    TryExec(@"CREATE TABLE IF NOT EXISTS platform_audit_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid,
        action varchar(100) NOT NULL,
        details text,
        ip_address varchar(45),
        status varchar(20) DEFAULT 'SUCCESS',
        error_message text,
        created_at timestamptz DEFAULT CURRENT_TIMESTAMP
    );", "platform_audit_logs");

    TryExec(@"CREATE TABLE IF NOT EXISTS promotional_offers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        title varchar(200) NOT NULL,
        description text,
        target_user_id uuid,
        bonus_worth_paise bigint NOT NULL DEFAULT 0,
        expires_at timestamptz NOT NULL,
        is_active boolean DEFAULT true,
        created_at timestamptz DEFAULT CURRENT_TIMESTAMP
    );", "promotional_offers");

    TryExec("ALTER TABLE promotional_offers ADD COLUMN IF NOT EXISTS offer_type varchar(50) DEFAULT 'FLASH_SALE';", "promotional_offers.offer_type");
    TryExec("ALTER TABLE promotional_offers ADD COLUMN IF NOT EXISTS bonus_percent numeric(5,2) DEFAULT 0;", "promotional_offers.bonus_percent");
    TryExec("ALTER TABLE promotional_offers ADD COLUMN IF NOT EXISTS min_purchase_amount_paise bigint DEFAULT 0;", "promotional_offers.min_purchase_amount_paise");
    TryExec("ALTER TABLE promotional_offers ADD COLUMN IF NOT EXISTS duration_hours integer DEFAULT 24;", "promotional_offers.duration_hours");

    TryExec(@"CREATE TABLE IF NOT EXISTS user_claimed_offers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        offer_id uuid NOT NULL,
        user_id uuid NOT NULL,
        claimed_at timestamptz DEFAULT CURRENT_TIMESTAMP
    );", "user_claimed_offers");

    TryExec(@"CREATE TABLE IF NOT EXISTS referral_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        referrer_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        referee_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reward_status varchar(20) DEFAULT 'Pending' NOT NULL,
        bonus_awarded_mg bigint DEFAULT 0 NOT NULL,
        created_at timestamptz DEFAULT CURRENT_TIMESTAMP
    );", "referral_events");

    TryExec(@"CREATE TABLE IF NOT EXISTS user_devices (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid REFERENCES users(id) ON DELETE CASCADE,
        fcm_token text UNIQUE NOT NULL,
        device_type varchar(20) DEFAULT 'ANDROID',
        is_active boolean DEFAULT true,
        last_used_at timestamptz DEFAULT CURRENT_TIMESTAMP,
        created_at timestamptz DEFAULT CURRENT_TIMESTAMP
    );", "user_devices");

    TryExec(@"CREATE TABLE IF NOT EXISTS gold_price_snapshots (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        price_24k_per_gram numeric(14,4) NOT NULL,
        price_22k_per_gram numeric(14,4) NOT NULL,
        price_silver_per_gram numeric(14,4) DEFAULT 0 NOT NULL,
        buy_price_per_gram numeric(14,4) NOT NULL,
        sell_price_per_gram numeric(14,4) NOT NULL,
        source varchar(50) NOT NULL,
        admin_note text,
        is_admin_override boolean DEFAULT false,
        fetched_at timestamptz DEFAULT CURRENT_TIMESTAMP,
        expires_at timestamptz
    );", "gold_price_snapshots");

    TryExec(@"CREATE TABLE IF NOT EXISTS admin_audit_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        admin_email varchar(255) NOT NULL,
        action_type varchar(100) NOT NULL,
        target_entity_id varchar(100),
        notes text NOT NULL,
        ip_address varchar(45),
        created_at timestamptz DEFAULT CURRENT_TIMESTAMP
    );", "admin_audit_logs");

    TryExec(@"CREATE TABLE IF NOT EXISTS api_error_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        request_path varchar(255) NOT NULL,
        method varchar(10) NOT NULL,
        headers text NOT NULL,
        request_payload text,
        response_payload text,
        client_ip varchar(45) NOT NULL,
        error_message text NOT NULL,
        stack_trace text,
        created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
    );", "api_error_logs");

    TryExec(@"CREATE TABLE IF NOT EXISTS token_trackers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL,
        phone_number varchar(15) NOT NULL,
        full_name varchar(100),
        token text NOT NULL,
        created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
        expires_at timestamptz NOT NULL,
        is_revoked boolean DEFAULT false NOT NULL
    );", "token_trackers");

    TryExec(@"CREATE TABLE IF NOT EXISTS super_admin_settings (
        key varchar(100) PRIMARY KEY,
        value text NOT NULL,
        updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
    );", "super_admin_settings");

    TryExec(@"INSERT INTO super_admin_settings (key, value)
        VALUES ('alert_emails', '[\""support@aishwaryamgold.com\""]')
        ON CONFLICT (key) DO NOTHING;", "seed_super_admin_settings");

    TryExec(@"CREATE TABLE IF NOT EXISTS webhook_event_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        razorpay_event_id varchar(100) NOT NULL,
        event_type varchar(60) NOT NULL,
        razorpay_payment_id varchar(100),
        razorpay_subscription_id varchar(100),
        signature_received varchar(200),
        was_processed boolean DEFAULT true,
        processing_error text,
        processed_at timestamptz DEFAULT CURRENT_TIMESTAMP
    );", "webhook_event_logs");

    TryExec("CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_event_id ON webhook_event_logs(razorpay_event_id);",
        "idx_webhook_event_id");

    // ── CRITICAL: email_logs (required for welcome email flow) ───────────────
    TryExec(@"CREATE TABLE IF NOT EXISTS email_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        to_email varchar(255) NOT NULL,
        to_name varchar(100),
        subject text NOT NULL,
        template_name varchar(100) NOT NULL,
        status varchar(20) DEFAULT 'PENDING',
        provider_message_id varchar(100),
        error_message text,
        retry_count integer DEFAULT 0,
        created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
        sent_at timestamptz
    );", "email_logs");

    // ── app_configs table ───────────────────────────────────────────────────
    TryExec(@"CREATE TABLE IF NOT EXISTS app_configs (
        id varchar(50) PRIMARY KEY,
        support_email text NOT NULL,
        support_phone text NOT NULL,
        terms_url text NOT NULL,
        privacy_url text NOT NULL,
        faq_json jsonb NOT NULL,
        referral_bonus_msg text NOT NULL,
        primary_color_hex text NOT NULL,
        secondary_color_hex text NOT NULL,
        festival_banner_url text NOT NULL,
        is_referral_enabled boolean DEFAULT true NOT NULL,
        is_autosave_enabled boolean DEFAULT true NOT NULL,
        referrer_reward_mg bigint DEFAULT 100 NOT NULL,
        referee_reward_mg bigint DEFAULT 50 NOT NULL,
        updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
    );", "app_configs");

    TryExec(@"INSERT INTO app_configs (id, support_email, support_phone, terms_url, privacy_url, faq_json, referral_bonus_msg, primary_color_hex, secondary_color_hex, festival_banner_url, is_referral_enabled, is_autosave_enabled, referrer_reward_mg, referee_reward_mg)
        VALUES ('global_config', 'support@aishwaryamgold.com', '+91-9876543210', 'https://aishwaryamgold.com/terms', 'https://aishwaryamgold.com/privacy', '[{""q"":""How to buy gold?"",""a"":""Go to Market tab and buy.""}]', 'Invite friends and earn 1mg of 24K Gold!', '#4A0E4E', '#E8A83A', 'https://images.unsplash.com/photo-1610652492500-ded49ceeb378?auto=format&fit=crop&q=80&w=800', true, true, 100, 50)
        ON CONFLICT (id) DO NOTHING;", "seed_app_configs");

    // Overwrite default placeholder URLs with the scraped Pothys terms/privacy contents
    TryExec(@"UPDATE app_configs 
        SET terms_url = 'Aishwaryam Swarna Mahal - DiGiGOLD Saving Scheme Terms & Conditions

1. Scheme Overview
- Name: DiGiGOLD Purchase Plan
- Minimum Investment: ₹100 per installment. Subsequent payments can be made for any amount starting from ₹100.
- Tenure: The scheme tenure is 300 days from the date of the first payment. No further accumulation is allowed after 300 days.
- Maturity: The maturity period is 330 days from the date of the first payment. The lock-in period is a minimum of 330 days.

2. Benefits & Bonus Structure
An instant GOLD weight bonus is calculated and added to the member''s account based on the date of each payment:
- 0 to 75 days: 7% instant GOLD weight bonus (e.g., Rs. 10,000 paid yields Rs. 700 worth of bonus gold).
- 76 to 150 days: 5% instant GOLD weight bonus (e.g., Rs. 6,000 paid yields Rs. 300 worth of bonus gold).
- 151 to 225 days: 3% instant GOLD weight bonus (e.g., Rs. 7,000 paid yields Rs. 210 worth of bonus gold).
- 226 to 300 days: 1% instant GOLD weight bonus (e.g., Rs. 12,000 paid yields Rs. 120 worth of bonus gold).
Note: Accumulated instant bonus benefits are redeemable only upon successful completion of 330 days.

3. Redemption Policy
- The accumulated gold weight can be redeemed after 330 days at any Aishwaryam Swarna Mahal store.
- The gold weight can be used to purchase Gold, Platinum, Diamond Jewellery, Silver Articles, Gift items, or Coins.
- No cash refunds are permitted under any circumstances.

4. Pre-closure
- If the account is closed prior to the 330-day maturity period, members can redeem their accumulated gold weight but will not receive any accumulated bonus gold benefits.

5. Taxes & Other Charges
- Members shall bear all GST and other government levies applicable at the time of invoice/redemption.
- Value Addition (V.A.) charges, stone charges, and other making charges are applicable as per store rules and must be borne by the customer.'
        WHERE id = 'global_config' AND (terms_url = 'https://aishwaryamgold.com/terms' OR terms_url = '');", "update_default_terms");

    TryExec(@"UPDATE app_configs 
        SET privacy_url = 'Aishwaryam Swarna Mahal - DiGiGOLD Saving Scheme Privacy Policy

1. Information Collection
We collect personal information necessary to manage your DiGiGOLD account, including your Name, Mobile Number, Email, Date of Birth, PAN Card details, and Bank Account details.

2. Usage of Information
Your information is used solely to verify your identity, process payments, manage your gold savings account, send transactions and promotional notifications, and process redemption requests at our stores.

3. Security of Data
We employ industry-standard security measures to safeguard your personal and financial information. All data transmitted between the app and our servers is encrypted.

4. Data Sharing
We do not sell or share your personal data with third parties, except as required by law or to process financial transactions through verified payment gateways (e.g., Razorpay).

5. User Rights
You can view and update your personal details in the Profile section of the app. For account deletion or data queries, please contact our support team at support@aishwaryamgold.com.'
        WHERE id = 'global_config' AND (privacy_url = 'https://aishwaryamgold.com/privacy' OR privacy_url = '');", "update_default_privacy");

    // ── ALTER TABLE: financial tables optimistic concurrency ─────────────────
    TryExec("ALTER TABLE gold_holdings ADD COLUMN IF NOT EXISTS row_version bytea;", "gold_holdings.row_version");
    TryExec("ALTER TABLE wallets ADD COLUMN IF NOT EXISTS row_version bytea;", "wallets.row_version");
    TryExec("ALTER TABLE app_configs ADD COLUMN IF NOT EXISTS referrer_reward_mg bigint DEFAULT 100 NOT NULL;", "app_configs.referrer_reward_mg");
    TryExec("ALTER TABLE app_configs ADD COLUMN IF NOT EXISTS referee_reward_mg bigint DEFAULT 50 NOT NULL;", "app_configs.referee_reward_mg");
    TryExec("ALTER TABLE gold_price_snapshots ADD COLUMN IF NOT EXISTS price_silver_per_gram numeric(14,4) DEFAULT 0 NOT NULL;", "gold_price_snapshots.price_silver_per_gram");

    // ── Festival Theme Management System Tables ────────────────────────────────
    TryExec(@"CREATE TABLE IF NOT EXISTS festival_themes (
        id varchar(50) PRIMARY KEY,
        name varchar(100) NOT NULL,
        description text,
        primary_color_hex varchar(7) NOT NULL,
        secondary_color_hex varchar(7) NOT NULL,
        status_bar_color_hex varchar(7) NOT NULL,
        splash_bg_color_hex varchar(7) NOT NULL,
        splash_illustration_url text,
        login_illustration_url text,
        home_illustration_url text,
        sidebar_illustration_url text,
        welcome_banner_url text,
        decorations_json text,
        lottie_animations_json text,
        start_date timestamp with time zone,
        end_date timestamp with time zone,
        is_recurring boolean DEFAULT false NOT NULL,
        start_month integer,
        start_day integer,
        end_month integer,
        end_day integer,
        is_system_default boolean DEFAULT false NOT NULL,
        created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
    );", "festival_themes");

    TryExec(@"INSERT INTO festival_themes (id, name, description, primary_color_hex, secondary_color_hex, status_bar_color_hex, splash_bg_color_hex, is_system_default) 
        VALUES ('default', 'Default Theme', 'Aishwaryam default color scheme and illustrations', '#4A0E4E', '#E8A83A', '#4A0E4E', '#FFFFFF', true)
        ON CONFLICT (id) DO NOTHING;", "seed_default_theme");

    // Force update old database seeded green configurations to default brand purple
    TryExec("UPDATE app_configs SET primary_color_hex = '#4A0E4E' WHERE primary_color_hex = '#01211A';", "update_config_primary_color");
    TryExec("UPDATE festival_themes SET primary_color_hex = '#4A0E4E' WHERE id = 'default' AND primary_color_hex = '#01211A';", "update_theme_primary_color");

    TryExec(@"INSERT INTO festival_themes (id, name, description, primary_color_hex, secondary_color_hex, status_bar_color_hex, splash_bg_color_hex, is_recurring, start_month, start_day, end_month, end_day, is_system_default) 
        VALUES ('pongal', 'Pongal Theme', 'Harvest festival theme with traditional Tamil decorations, sugarcanes and kolam art', '#D35400', '#F1C40F', '#D35400', '#FDF2E9', true, 1, 13, 1, 17, false)
        ON CONFLICT (id) DO NOTHING;", "seed_pongal_theme");

    TryExec(@"INSERT INTO festival_themes (id, name, description, primary_color_hex, secondary_color_hex, status_bar_color_hex, splash_bg_color_hex, is_recurring, start_month, start_day, end_month, end_day, is_system_default) 
        VALUES ('deepavali', 'Deepavali Theme', 'Festival of lights theme with diyas, crackers and golden sparkle graphics', '#7D3C98', '#F39C12', '#7D3C98', '#F5EEF8', true, 11, 10, 11, 16, false)
        ON CONFLICT (id) DO NOTHING;", "seed_deepavali_theme");

    TryExec(@"INSERT INTO festival_themes (id, name, description, primary_color_hex, secondary_color_hex, status_bar_color_hex, splash_bg_color_hex, is_recurring, start_month, start_day, end_month, end_day, is_system_default) 
        VALUES ('christmas', 'Christmas Theme', 'Winter festive theme with Christmas trees, ornaments, bells and snowflakes', '#1E8449', '#C0392B', '#1E8449', '#EAECEE', true, 12, 23, 12, 26, false)
        ON CONFLICT (id) DO NOTHING;", "seed_christmas_theme");

    TryExec("ALTER TABLE app_configs ADD COLUMN IF NOT EXISTS active_theme_id varchar(50) DEFAULT 'default' NOT NULL;", "app_configs.active_theme_id");

    // ── ALTER TABLE: gold_transactions idempotency & new columns ─────────────
    TryExec("ALTER TABLE gold_transactions ADD COLUMN IF NOT EXISTS razorpay_payment_id varchar(100);",
        "gold_transactions.razorpay_payment_id");
    TryExec(@"CREATE UNIQUE INDEX IF NOT EXISTS idx_gold_tx_razorpay_payment
        ON gold_transactions(razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL;",
        "idx_gold_tx_razorpay_payment");
    TryExec(@"ALTER TABLE gold_transactions ADD COLUMN IF NOT EXISTS ""UserSchemeId"" uuid;",
        "gold_transactions.UserSchemeId");
    TryExec(@"ALTER TABLE gold_transactions ADD COLUMN IF NOT EXISTS ""RazorpayPaymentId"" text;",
        "gold_transactions.RazorpayPaymentId");
    TryExec("ALTER TABLE gold_transactions ADD COLUMN IF NOT EXISTS rate_source varchar(50) DEFAULT 'LIVE_FEED';",
        "gold_transactions.rate_source");
    TryExec("ALTER TABLE gold_transactions ADD COLUMN IF NOT EXISTS rate_timestamp timestamp with time zone DEFAULT NOW();",
        "gold_transactions.rate_timestamp");
    TryExec("ALTER TABLE gold_transactions ADD COLUMN IF NOT EXISTS bonus_amount_paise bigint DEFAULT 0;",
        "gold_transactions.bonus_amount_paise");
    TryExec("ALTER TABLE gold_transactions ADD COLUMN IF NOT EXISTS bonus_gold_mg bigint DEFAULT 0;",
        "gold_transactions.bonus_gold_mg");
    // Fix NULLs that crash EF Core non-nullable mapping
    TryExec("UPDATE gold_transactions SET bonus_amount_paise = 0 WHERE bonus_amount_paise IS NULL;",
        "gold_transactions.bonus_amount_paise.fixnull");
    TryExec("UPDATE gold_transactions SET bonus_gold_mg = 0 WHERE bonus_gold_mg IS NULL;",
        "gold_transactions.bonus_gold_mg.fixnull");

    // ── ALTER TABLE: schemes_master columns ───────────────────────────────────
    TryExec("ALTER TABLE schemes_master ADD COLUMN IF NOT EXISTS bonus_config_json text;",
        "schemes_master.bonus_config_json");
    TryExec("ALTER TABLE schemes_master ADD COLUMN IF NOT EXISTS custom_sections_json text;",
        "schemes_master.custom_sections_json");
    TryExec("ALTER TABLE schemes_master ADD COLUMN IF NOT EXISTS razorpay_plan_id text;",
        "schemes_master.razorpay_plan_id");
    TryExec("ALTER TABLE schemes_master ADD COLUMN IF NOT EXISTS poster_image_base64 text;",
        "schemes_master.poster_image_base64");
    TryExec("ALTER TABLE schemes_master ADD COLUMN IF NOT EXISTS payment_rules_json text;",
        "schemes_master.payment_rules_json");
    TryExec("ALTER TABLE schemes_master ADD COLUMN IF NOT EXISTS keywords_json text;",
        "schemes_master.keywords_json");

    // ── ALTER TABLE: user_schemes columns ─────────────────────────────────────
    TryExec("ALTER TABLE user_schemes ADD COLUMN IF NOT EXISTS razorpay_subscription_id text;",
        "user_schemes.razorpay_subscription_id");
    TryExec(@"ALTER TABLE user_schemes ADD COLUMN IF NOT EXISTS ""MaturityDate"" timestamp with time zone DEFAULT NOW();",
        "user_schemes.MaturityDate");
    TryExec(@"ALTER TABLE user_schemes ADD COLUMN IF NOT EXISTS ""RedeemedGoldMg"" bigint DEFAULT 0;",
        "user_schemes.RedeemedGoldMg");
    TryExec(@"ALTER TABLE user_schemes ALTER COLUMN ""RedeemedGoldMg"" SET DEFAULT 0;",
        "user_schemes.RedeemedGoldMg.setdefault");
    // Fix NULLs that crash EF Core non-nullable mapping
    TryExec(@"UPDATE user_schemes SET ""RedeemedGoldMg"" = 0 WHERE ""RedeemedGoldMg"" IS NULL;",
        "user_schemes.RedeemedGoldMg.fixnull");

    // ── ALTER TABLE: user_notifications columns ───────────────────────────────
    TryExec("ALTER TABLE user_notifications ADD COLUMN IF NOT EXISTS entity_id text;",
        "user_notifications.entity_id");
    TryExec("ALTER TABLE user_notifications ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;",
        "user_notifications.is_deleted");

    // ── New tables for Scheme Bonus, Investments and Redemptions ─────────────
    TryExec(@"CREATE TABLE IF NOT EXISTS scheme_bonus_tiers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        scheme_master_id uuid NOT NULL REFERENCES schemes_master(id) ON DELETE CASCADE,
        start_day integer NOT NULL,
        end_day integer NOT NULL,
        bonus_percentage numeric(5,2) NOT NULL,
        created_at timestamptz DEFAULT CURRENT_TIMESTAMP
    );", "scheme_bonus_tiers");

    TryExec(@"CREATE TABLE IF NOT EXISTS scheme_investments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_scheme_id uuid NOT NULL REFERENCES user_schemes(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        transaction_type varchar(20) NOT NULL DEFAULT 'INSTALLMENT',
        installment_number bigint NOT NULL,
        amount_paise bigint NOT NULL,
        base_amount_paise bigint NOT NULL,
        gst_amount_paise bigint NOT NULL,
        gold_weight_mg bigint NOT NULL,
        price_per_gm_paise bigint NOT NULL,
        bonus_percentage numeric(5,2) NOT NULL DEFAULT 0,
        bonus_amount_paise bigint NOT NULL DEFAULT 0,
        bonus_gold_mg bigint NOT NULL DEFAULT 0,
        razorpay_payment_id varchar(100),
        status varchar(20) NOT NULL DEFAULT 'COMPLETED',
        created_at timestamptz DEFAULT CURRENT_TIMESTAMP
    );", "scheme_investments");

    TryExec(@"CREATE TABLE IF NOT EXISTS scheme_redemptions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_scheme_id uuid NOT NULL REFERENCES user_schemes(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        redemption_type varchar(20) NOT NULL,
        gold_weight_mg bigint NOT NULL,
        price_per_gm_paise bigint NOT NULL,
        total_amount_paise bigint NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'PENDING',
        address text,
        admin_notes text,
        created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
    );", "scheme_redemptions");

    TryExec(@"CREATE TABLE IF NOT EXISTS redemption_status_history (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        scheme_redemption_id uuid NOT NULL REFERENCES scheme_redemptions(id) ON DELETE CASCADE,
        status varchar(20) NOT NULL,
        change_reason text,
        changed_by_admin_id varchar(100),
        created_at timestamptz DEFAULT CURRENT_TIMESTAMP
    );", "redemption_status_history");

    TryExec("CREATE INDEX IF NOT EXISTS \"IX_scheme_bonus_tiers_scheme_master_id\" ON scheme_bonus_tiers(scheme_master_id);", "IX_scheme_bonus_tiers_scheme_master_id");
    TryExec("CREATE INDEX IF NOT EXISTS \"IX_scheme_investments_razorpay_payment_id\" ON scheme_investments(razorpay_payment_id);", "IX_scheme_investments_razorpay_payment_id");
    TryExec("CREATE INDEX IF NOT EXISTS \"IX_scheme_investments_user_id\" ON scheme_investments(user_id);", "IX_scheme_investments_user_id");
    TryExec("CREATE INDEX IF NOT EXISTS \"IX_scheme_investments_user_scheme_id\" ON scheme_investments(user_scheme_id);", "IX_scheme_investments_user_scheme_id");
    TryExec("CREATE INDEX IF NOT EXISTS \"IX_scheme_redemptions_user_id\" ON scheme_redemptions(user_id);", "IX_scheme_redemptions_user_id");
    TryExec("CREATE INDEX IF NOT EXISTS \"IX_scheme_redemptions_user_scheme_id\" ON scheme_redemptions(user_scheme_id);", "IX_scheme_redemptions_user_scheme_id");
    TryExec("CREATE INDEX IF NOT EXISTS \"IX_redemption_status_history_scheme_redemption_id\" ON redemption_status_history(scheme_redemption_id);", "IX_redemption_status_history_scheme_redemption_id");

    TryExec(@"CREATE TABLE IF NOT EXISTS chatbot_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid REFERENCES users(id) ON DELETE CASCADE,
        user_message text NOT NULL,
        bot_response text NOT NULL,
        created_at timestamptz DEFAULT CURRENT_TIMESTAMP
    );", "chatbot_logs");

    Console.WriteLine("[DB-INIT] All database migrations completed.");
}
// ─────────────────────────────────────────────────────────────────────────────

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

// Security ordering is critical
app.UseCors("AllowAll");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

try
{
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<Aishwaryam.Infrastructure.Data.ApplicationDbContext>();
        
        var uniquePlanNames = await db.UserSchemes.Select(us => us.PlanName).Distinct().ToListAsync();
        Console.WriteLine("---------------------------------------------");
        Console.WriteLine("[DB-INFO] UNIQUE PLAN NAMES IN USER SCHEMES: " + string.Join(", ", uniquePlanNames));
        Console.WriteLine("---------------------------------------------");

        // Remove old schemes ONLY if they are not part of our 3 core seeded schemes
        var coreNames = new[] { 
            "Aishwaryam Swarna Varshini Gold Scheme", 
            "Aishwaryam Rajadha Varshini Silver Scheme", 
            "Aishwaryam Flex Saving Plan" 
        };
        var allSchemes = await db.SchemesMaster.ToListAsync();
        var obsoleteSchemes = allSchemes.Where(s => !coreNames.Contains(s.PlanName)).ToList();
        if (obsoleteSchemes.Any())
        {
            db.SchemesMaster.RemoveRange(obsoleteSchemes);
            await db.SaveChangesAsync();
            allSchemes = await db.SchemesMaster.ToListAsync();
        }

        var goldScheme = allSchemes.FirstOrDefault(s => s.Id == Guid.Parse("11111111-1111-1111-1111-111111111111"));
        if (goldScheme == null)
        {
            goldScheme = new SchemeMaster
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                PlanName = "Aishwaryam Swarna Varshini Gold Scheme",
                Description = "A monthly gold savings plan to save systematically over 11 months with zero wastage and zero making charges.",
                InstallmentAmountPaise = 100000,
                TotalInstallments = 11,
                Frequency = "Monthly",
                IsActive = true,
                DurationUnit = "Months",
                PosterImageBase64 = "/gold_scheme_banner.png",
                KeywordsJson = "[\"11 Months Plan\", \"7.5% Bonus Gold\", \"Min. ₹1000/mo\", \"Zero Wastage\"]",
                BonusConfigJson = "[{\"StartDay\":0,\"EndDay\":330,\"BonusPercentage\":7.5}]",
                PaymentRulesJson = "{\"minAmountPaise\":100000,\"maxAmountPaise\":5000000,\"multiplePerDay\":false,\"earlyExitAfterDays\":180,\"rating\":4.9}",
                CustomSectionsJson = "[\r\n  {\r\n    \"title\": \"A to Z Scheme Overview\",\r\n    \"content\": \"• **Maturity & Duration:** This is an 11-month (330 days) systematic gold saving scheme.\\n• **Minimum Investment:** Pay a minimum fixed monthly installment of ₹1,000. Higher installment options are available.\\n• **Gold Accumulation:** Gold weight is credited daily/monthly based on prevailing gold market prices on your payment days.\\n• **Withdrawal Mode:** At maturity, redeem your accumulated gold grams for beautiful physical jewelry with 100% discount on Value Added (V.A.) making charges up to 18%, or collect gold coins.\\n• **Maturity Bonus:** Receive a special loyalty bonus of 7.5% extra gold weight automatically added upon completing all 11 installments.\",\r\n    \"type\": 0\r\n  },\r\n  {\r\n    \"title\": \"Redemption & Wastage Benefits\",\r\n    \"content\": \"• **Zero Wastage:** Get up to 18% making charges and value addition (V.A.) charges completely waived off when purchasing gold jewelry at maturity.\\n• **Flexible Choice:** Purchase jewelry, gold coins, or silver articles at any Aishwaryam Swarna Mahal branch.\\n• **No Cash Refunds:** The accumulated gold weight must be redeemed as physical metal only; no cash refunds are allowed.\",\r\n    \"type\": 1\r\n  }\r\n]"
            };
            db.SchemesMaster.Add(goldScheme);
            await db.SaveChangesAsync();
            Console.WriteLine("[SEED] Recovered Aishwaryam Swarna Varshini Gold Scheme.");
        }

        var silverScheme = allSchemes.FirstOrDefault(s => s.Id == Guid.Parse("22222222-2222-2222-2222-222222222222"));
        if (silverScheme == null)
        {
            silverScheme = new SchemeMaster
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                PlanName = "Aishwaryam Rajadha Varshini Silver Scheme",
                Description = "Systematic silver saving plan to accumulate pure silver articles and coins over 11 months with special loyalty bonus.",
                InstallmentAmountPaise = 50000,
                TotalInstallments = 11,
                Frequency = "Monthly",
                IsActive = true,
                DurationUnit = "Months",
                PosterImageBase64 = "/silver_scheme_banner.png",
                KeywordsJson = "[\"11 Months Plan\", \"7.5% Bonus Silver\", \"Min. ₹500/mo\", \"Pure Silver Articles\"]",
                BonusConfigJson = "[{\"StartDay\":0,\"EndDay\":330,\"BonusPercentage\":7.5}]",
                PaymentRulesJson = "{\"minAmountPaise\":50000,\"maxAmountPaise\":10000000,\"multiplePerDay\":false,\"earlyExitAfterDays\":180,\"rating\":4.8}",
                CustomSectionsJson = "[\r\n  {\r\n    \"title\": \"A to Z Scheme Overview\",\r\n    \"content\": \"• **Maturity & Duration:** This is an 11-month (330 days) systematic silver saving scheme.\\n• **Minimum Investment:** Pay a minimum fixed monthly installment of ₹500. Higher options are available.\\n• **Silver Accumulation:** Silver weight is credited daily/monthly based on prevailing market rates on payment days.\\n• **Withdrawal Mode:** At maturity, redeem your accumulated silver grams for physical silver articles, utensils, or pure silver coins.\\n• **Maturity Bonus:** Receive a special loyalty bonus of 7.5% extra silver weight automatically added upon completing all 11 installments.\",\r\n    \"type\": 0\r\n  },\r\n  {\r\n    \"title\": \"Redemption Benefits\",\r\n    \"content\": \"• **Special Wastage Discounts:** Avail exclusive making charge discounts on premium silver articles and coins at maturity.\\n• **No Cash Refunds:** The accumulated silver weight must be redeemed as physical silver only; no cash refunds are allowed.\",\r\n    \"type\": 1\r\n  }\r\n]"
            };
            db.SchemesMaster.Add(silverScheme);
            await db.SaveChangesAsync();
            Console.WriteLine("[SEED] Recovered Aishwaryam Rajadha Varshini Silver Scheme.");
        }

        var flexScheme = allSchemes.FirstOrDefault(s => s.Id == Guid.Parse("33333333-3333-3333-3333-333333333333"));
        if (flexScheme == null)
        {
            flexScheme = new SchemeMaster
            {
                Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                PlanName = "Aishwaryam Flex Saving Plan",
                Description = "Flexible gold savings plan starting from ₹100. Save at your convenience and redeem as pure gold jewelry or coins at maturity.",
                InstallmentAmountPaise = 10000,
                TotalInstallments = 11,
                Frequency = "Flexible",
                IsActive = true,
                DurationUnit = "Months",
                PosterImageBase64 = "/gold_scheme_banner.png",
                KeywordsJson = "[\"Flexible Plan\", \"7.5% Bonus Gold\", \"Min. ₹100/mo\", \"Save Any Time\"]",
                BonusConfigJson = "[{\"StartDay\":0,\"EndDay\":330,\"BonusPercentage\":7.5}]",
                PaymentRulesJson = "{\"minAmountPaise\":10000,\"maxAmountPaise\":5000000,\"multiplePerDay\":true,\"earlyExitAfterDays\":180,\"rating\":4.9}",
                CustomSectionsJson = "[\r\n  {\r\n    \"title\": \"Flexible Overview\",\r\n    \"content\": \"• **Maturity & Duration:** This is an 11-month flexible gold saving scheme.\\n• **Minimum Investment:** Pay a minimum fixed monthly installment of ₹100. Higher options are available.\\n• **Gold Accumulation:** Gold weight is credited based on prevailing gold market prices on your payment days.\\n• **Withdrawal Mode:** At maturity, redeem your accumulated gold grams for beautiful physical jewelry with 100% discount on Value Added (V.A.) making charges up to 18%, or collect gold coins.\\n• **Maturity Bonus:** Receive a special loyalty bonus of 7.5% extra gold weight automatically added upon completing all 11 installments.\",\r\n    \"type\": 0\r\n  }\r\n]"
            };
            db.SchemesMaster.Add(flexScheme);
            await db.SaveChangesAsync();
            Console.WriteLine("[SEED] Recovered Aishwaryam Flex Saving Plan.");
        }

        var masterSchemes = await db.SchemesMaster.ToListAsync();
        bool updatedMaster = false;
        foreach (var m in masterSchemes)
        {
            if (!string.IsNullOrEmpty(m.BonusConfigJson))
            {
                try
                {
                    var tiers = System.Text.Json.JsonSerializer.Deserialize<List<Aishwaryam.Domain.Entities.SchemeBonusTier>>(m.BonusConfigJson);
                    if (tiers != null)
                    {
                        var invalidTiers = tiers.Where(t => t.StartDay <= 0 || t.EndDay <= 0 || t.EndDay < t.StartDay).ToList();
                        if (invalidTiers.Any())
                        {
                            var validTiers = tiers.Where(t => t.StartDay > 0 && t.EndDay >= t.StartDay).ToList();
                            m.BonusConfigJson = System.Text.Json.JsonSerializer.Serialize(validTiers);
                            db.SchemesMaster.Update(m);
                            updatedMaster = true;
                        }
                    }
                }
                catch {}
            }
        }
        var dbTiers = await db.SchemeBonusTiers.Where(t => t.StartDay <= 0 || t.EndDay <= 0 || t.EndDay < t.StartDay).ToListAsync();
        if (dbTiers.Any())
        {
            db.SchemeBonusTiers.RemoveRange(dbTiers);
            updatedMaster = true;
        }
        if (updatedMaster)
        {
            await db.SaveChangesAsync();
            Console.WriteLine("[SELF-HEAL] Corrected invalid Day 0 scheme bonus tiers in database.");
        }
    }
}
catch (Exception ex)
{
    Console.WriteLine($"[SELF-HEAL] Failed to self-heal database bonus tiers: {ex.Message}");
}

// SELF-HEAL: Ensure promotional_offers table has banner_url and min_purchase_gold_mg columns
try
{
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        await db.Database.ExecuteSqlRawAsync("ALTER TABLE promotional_offers ADD COLUMN IF NOT EXISTS banner_url text;");
        await db.Database.ExecuteSqlRawAsync("ALTER TABLE promotional_offers ADD COLUMN IF NOT EXISTS min_purchase_gold_mg bigint NOT NULL DEFAULT 0;");
        Console.WriteLine("[SELF-HEAL] Verified promotional_offers schema columns are present.");
    }
}
catch (Exception ex)
{
    Console.WriteLine($"[SELF-HEAL] Failed to verify promotional_offers columns: {ex.Message}");
}

try
{
    Log.Information("Starting Aishwaryam Digital Gold API Host...");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Aishwaryam Digital Gold API Host terminated unexpectedly.");
}
finally
{
    Log.CloseAndFlush();
}
