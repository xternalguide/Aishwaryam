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

    // Auth Rate Limit: 120 requests per 1 minute per IP (increased for testing and release flexibility)
    options.AddFixedWindowLimiter("auth_policy", opt =>
    {
        opt.Window = TimeSpan.FromMinutes(1);
        opt.PermitLimit = 120;
        opt.QueueLimit = 0;
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
    });

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
builder.Services.AddScoped<ISmsService, Fast2SmsService>();
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
builder.Services.AddSingleton<IGoldPriceProvider, Aishwaryam.Infrastructure.Services.PriceProviders.MetalPriceApiProvider>();
builder.Services.AddSingleton<IGoldPriceProvider, Aishwaryam.Infrastructure.Services.PriceProviders.StaticFallbackProvider>();
builder.Services.AddSingleton<IGoldPriceManager, Aishwaryam.Infrastructure.Services.GoldPriceManager>();
builder.Services.AddScoped<Aishwaryam.Infrastructure.Services.GoldScraperService>();

// Register Hosted Services
builder.Services.AddHostedService<Aishwaryam.Api.Services.SchemeAutoPayService>();
builder.Services.AddHostedService<SchemeMaturityJob>();
builder.Services.AddHostedService<NightlyReconciliationJob>();
builder.Services.AddHostedService<Aishwaryam.Infrastructure.BackgroundServices.GoldRateScraperWorker>();
builder.Services.AddHostedService<Aishwaryam.Api.Services.EventOfferWorker>(); // Daily 9 AM IST: birthday/anniversary offers

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

    TryExec(@"CREATE TABLE IF NOT EXISTS user_claimed_offers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        offer_id uuid NOT NULL,
        user_id uuid NOT NULL,
        claimed_at timestamptz DEFAULT CURRENT_TIMESTAMP
    );", "user_claimed_offers");

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

    // ── ALTER TABLE: financial tables optimistic concurrency ─────────────────
    TryExec("ALTER TABLE gold_holdings ADD COLUMN IF NOT EXISTS row_version bytea;", "gold_holdings.row_version");
    TryExec("ALTER TABLE wallets ADD COLUMN IF NOT EXISTS row_version bytea;", "wallets.row_version");

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

// Security ordering is critical
app.UseCors("AllowAll");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

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
