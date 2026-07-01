using Aishwaryam.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Aishwaryam.Infrastructure.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public static long LastDbChangeTimestamp { get; set; } = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        public override int SaveChanges()
        {
            LastDbChangeTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            return base.SaveChanges();
        }

        public override int SaveChanges(bool acceptAllChangesOnSuccess)
        {
            LastDbChangeTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            return base.SaveChanges(acceptAllChangesOnSuccess);
        }

        public override System.Threading.Tasks.Task<int> SaveChangesAsync(System.Threading.CancellationToken cancellationToken = default)
        {
            LastDbChangeTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            return base.SaveChangesAsync(cancellationToken);
        }

        public override System.Threading.Tasks.Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, System.Threading.CancellationToken cancellationToken = default)
        {
            LastDbChangeTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
        }

        // Auth
        public DbSet<User> Users { get; set; }
        public DbSet<Address> Addresses { get; set; }
        public DbSet<AuthSession> AuthSessions { get; set; }
        public DbSet<OtpLog> OtpLogs { get; set; }
        
        // Settings & CMS
        public DbSet<AppConfig> AppConfigs { get; set; }
        public DbSet<AppBanner> AppBanners { get; set; }

        // Wallet
        public DbSet<Wallet> Wallets { get; set; }
        public DbSet<WalletLedger> WalletLedgers { get; set; }

        // Gold
        public DbSet<GoldHolding> GoldHoldings { get; set; }
        public DbSet<GoldTransaction> GoldTransactions { get; set; }
        public DbSet<GoldPriceLog> GoldPriceLogs { get; set; }

        // KYC & Withdrawals
        public DbSet<KycDocument> KycDocuments { get; set; }
        public DbSet<BankAccount> BankAccounts { get; set; }
        public DbSet<WithdrawalRequest> WithdrawalRequests { get; set; }

        // Schemes & Subscriptions
        public DbSet<UserScheme> UserSchemes { get; set; }
        public DbSet<AdminAlert> AdminAlerts { get; set; }
        public DbSet<ReferralEvent> ReferralEvents { get; set; }
        public DbSet<SchemeMaster> SchemesMaster { get; set; }
        public DbSet<PlatformAuditLog> PlatformAuditLogs { get; set; }
        public DbSet<PromotionalOffer> PromotionalOffers { get; set; }
        public DbSet<UserClaimedOffer> UserClaimedOffers { get; set; }
        public DbSet<UserNotification> UserNotifications { get; set; }
        public DbSet<UserDevice> UserDevices { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<IdempotencyKey> IdempotencyKeys { get; set; }
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<GoldPriceSnapshot> GoldPriceSnapshots { get; set; }
        public DbSet<WebhookEventLog> WebhookEventLogs { get; set; }
        public DbSet<EmailLog> EmailLogs { get; set; }
        public DbSet<SchemeBonusTier> SchemeBonusTiers { get; set; }
        public DbSet<SchemeInvestment> SchemeInvestments { get; set; }
        public DbSet<SchemeRedemption> SchemeRedemptions { get; set; }
        public DbSet<RedemptionStatusHistory> RedemptionStatusHistories { get; set; }
        public DbSet<ChatbotLog> ChatbotLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Schemes Master
            modelBuilder.Entity<SchemeMaster>(entity =>
            {
                entity.ToTable("schemes_master");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
                entity.Property(e => e.PlanName).HasColumnName("plan_name").IsRequired().HasMaxLength(100);
                entity.Property(e => e.Description).HasColumnName("description");
                entity.Property(e => e.InstallmentAmountPaise).HasColumnName("installment_amount_paise").IsRequired();
                entity.Property(e => e.TotalInstallments).HasColumnName("total_installments").IsRequired();
                entity.Property(e => e.Frequency).HasColumnName("frequency").HasDefaultValue("Daily").HasMaxLength(20);
                entity.Property(e => e.BonusConfigJson).HasColumnName("bonus_config_json");
                entity.Property(e => e.CustomSectionsJson).HasColumnName("custom_sections_json");
                entity.Property(e => e.RazorpayPlanId).HasColumnName("razorpay_plan_id");
                entity.Property(e => e.PosterImageBase64).HasColumnName("poster_image_base64");
                entity.Property(e => e.PaymentRulesJson).HasColumnName("payment_rules_json");
                entity.Property(e => e.KeywordsJson).HasColumnName("keywords_json");
                entity.Property(e => e.IsActive).HasColumnName("is_active").HasDefaultValue(true);
                entity.Property(e => e.DurationUnit).HasColumnName("duration_unit").HasMaxLength(20).HasDefaultValue("Days");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            });

            // Configure snake_case table names and column names mapping
            
            // Users
            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("users");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
                entity.Property(e => e.PhoneNumber).HasColumnName("phone_number").IsRequired().HasMaxLength(15);
                entity.Property(e => e.Email).HasColumnName("email").HasMaxLength(255);
                entity.Property(e => e.FullName).HasColumnName("full_name").HasMaxLength(100);
                entity.Property(e => e.IsActive).HasColumnName("is_active").HasDefaultValue(true);
                entity.Property(e => e.KycLevel).HasColumnName("kyc_level").HasMaxLength(20).HasDefaultValue("BASIC");
                entity.Property(e => e.MpinHash).HasColumnName("mpin_hash").HasMaxLength(255);
                entity.Property(e => e.BiometricEnabled).HasColumnName("biometric_enabled").HasDefaultValue(false);
                entity.Property(e => e.ReferralCode).HasColumnName("referral_code").HasMaxLength(50);
                entity.Property(e => e.DateOfBirth).HasColumnName("date_of_birth").HasColumnType("date");
                entity.Property(e => e.WeddingAnniversaryDate).HasColumnName("wedding_anniversary_date").HasColumnType("date");
                entity.Property(e => e.NomineeName).HasColumnName("nominee_name").HasMaxLength(100);
                entity.Property(e => e.NomineePhoneNumber).HasColumnName("nominee_phone_number").HasMaxLength(20);
                entity.Property(e => e.NomineeRelationship).HasColumnName("nominee_relationship").HasMaxLength(50);
                entity.Property(e => e.ProfilePictureBase64).HasColumnName("profile_picture_base64");
                entity.Property(e => e.Gender).HasColumnName("gender").HasMaxLength(20);
                entity.Property(e => e.PreferredLanguage).HasColumnName("preferred_language").HasMaxLength(10).HasDefaultValue("en");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
                
                entity.HasIndex(e => e.PhoneNumber).IsUnique();
                entity.HasIndex(e => e.Email).IsUnique();
            });

            // Addresses
            modelBuilder.Entity<Address>(entity =>
            {
                entity.ToTable("user_addresses");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.State).HasColumnName("state").IsRequired().HasMaxLength(100);
                entity.Property(e => e.City).HasColumnName("city").IsRequired().HasMaxLength(100);
                entity.Property(e => e.StreetAddress).HasColumnName("street_address").IsRequired();
                entity.Property(e => e.Pincode).HasColumnName("pincode").IsRequired().HasMaxLength(20);
                entity.Property(e => e.IsDefault).HasColumnName("is_default").HasDefaultValue(false);
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(d => d.User)
                    .WithMany()
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // AuthSessions
            modelBuilder.Entity<AuthSession>(entity =>
            {
                entity.ToTable("auth_sessions");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.RefreshToken).HasColumnName("refresh_token").IsRequired().HasMaxLength(512);
                entity.Property(e => e.DeviceFingerprint).HasColumnName("device_fingerprint").IsRequired().HasMaxLength(255);
                entity.Property(e => e.IpAddress).HasColumnName("ip_address").IsRequired().HasMaxLength(45);
                entity.Property(e => e.UserAgent).HasColumnName("user_agent");
                entity.Property(e => e.ExpiresAt).HasColumnName("expires_at").IsRequired();
                entity.Property(e => e.IsRevoked).HasColumnName("is_revoked").HasDefaultValue(false);
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(d => d.User)
                    .WithMany()
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // OtpLogs
            modelBuilder.Entity<OtpLog>(entity =>
            {
                entity.ToTable("otp_logs");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
                entity.Property(e => e.PhoneNumber).HasColumnName("phone_number").IsRequired().HasMaxLength(15);
                entity.Property(e => e.OtpHash).HasColumnName("otp_hash").IsRequired().HasMaxLength(255);
                entity.Property(e => e.IpAddress).HasColumnName("ip_address").IsRequired().HasMaxLength(45);
                entity.Property(e => e.ExpiresAt).HasColumnName("expires_at").IsRequired();
                entity.Property(e => e.IsUsed).HasColumnName("is_used").HasDefaultValue(false);
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            });

            // Wallets
            modelBuilder.Entity<Wallet>(entity =>
            {
                entity.ToTable("wallets");
                entity.HasKey(e => e.UserId);
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.InrBalancePaise).HasColumnName("inr_balance_paise").HasDefaultValue(0);
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.RowVersion).HasColumnName("row_version").IsRowVersion().IsConcurrencyToken();

                entity.HasOne(d => d.User)
                    .WithOne()
                    .HasForeignKey<Wallet>(d => d.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // WalletLedger
            modelBuilder.Entity<WalletLedger>(entity =>
            {
                entity.ToTable("wallet_ledger");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.TransactionType).HasColumnName("transaction_type").IsRequired().HasMaxLength(20);
                entity.Property(e => e.AmountPaise).HasColumnName("amount_paise").IsRequired();
                entity.Property(e => e.ReferenceId).HasColumnName("reference_id").IsRequired().HasMaxLength(100);
                entity.Property(e => e.Description).HasColumnName("description");
                entity.Property(e => e.IpAddress).HasColumnName("ip_address").IsRequired().HasMaxLength(45);
                entity.Property(e => e.DeviceFingerprint).HasColumnName("device_fingerprint").IsRequired().HasMaxLength(255);
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(d => d.User)
                    .WithMany()
                    .HasForeignKey(d => d.UserId);
            });

            // GoldHoldings
            modelBuilder.Entity<GoldHolding>(entity =>
            {
                entity.ToTable("gold_holdings");
                entity.HasKey(e => e.UserId);
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.GoldBalanceMg).HasColumnName("gold_balance_mg").HasDefaultValue(0);
                entity.Property(e => e.BonusGoldBalanceMg).HasColumnName("bonus_gold_balance_mg").HasDefaultValue(0L);
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.RowVersion).HasColumnName("row_version").IsRowVersion().IsConcurrencyToken();

                entity.HasOne(d => d.User)
                    .WithOne()
                    .HasForeignKey<GoldHolding>(d => d.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // GoldTransactions
            modelBuilder.Entity<GoldTransaction>(entity =>
            {
                entity.ToTable("gold_transactions");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.TransactionType).HasColumnName("transaction_type").IsRequired().HasMaxLength(10);
                entity.Property(e => e.GoldWeightMg).HasColumnName("gold_weight_mg").IsRequired();
                entity.Property(e => e.PricePerGmPaise).HasColumnName("price_per_gm_paise").IsRequired();
                entity.Property(e => e.TotalAmountPaise).HasColumnName("total_amount_paise").IsRequired();
                entity.Property(e => e.IpAddress).HasColumnName("ip_address").IsRequired().HasMaxLength(45);
                entity.Property(e => e.DeviceFingerprint).HasColumnName("device_fingerprint").IsRequired().HasMaxLength(255);
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.RateSource).HasColumnName("rate_source").HasMaxLength(50).HasDefaultValue("LIVE_FEED");
                entity.Property(e => e.RateTimestamp).HasColumnName("rate_timestamp").HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.UserSchemeId).HasColumnName("UserSchemeId");
                entity.Property(e => e.RazorpayPaymentId).HasColumnName("RazorpayPaymentId");
                entity.Property(e => e.BonusAmountPaise).HasColumnName("bonus_amount_paise").HasDefaultValue(0L);
                entity.Property(e => e.BonusGoldMg).HasColumnName("bonus_gold_mg").HasDefaultValue(0L);

                entity.HasOne(d => d.User)
                    .WithMany()
                    .HasForeignKey(d => d.UserId);
            });

            // GoldPriceLogs
            modelBuilder.Entity<GoldPriceLog>(entity =>
            {
                entity.ToTable("gold_price_logs");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
                entity.Property(e => e.BuyPricePaise).HasColumnName("buy_price_paise").IsRequired();
                entity.Property(e => e.SellPricePaise).HasColumnName("sell_price_paise").IsRequired();
                entity.Property(e => e.IsAdminOverride).HasColumnName("is_admin_override").HasDefaultValue(false);
                entity.Property(e => e.AdminId).HasColumnName("admin_id");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            });

            // KycDocuments
            modelBuilder.Entity<KycDocument>(entity =>
            {
                entity.ToTable("kyc_documents");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.DocumentType).HasColumnName("document_type").IsRequired().HasMaxLength(50);
                entity.Property(e => e.DocumentNumber).HasColumnName("document_number");
                entity.Property(e => e.DocumentUrl).HasColumnName("document_url").IsRequired();
                entity.Property(e => e.Status).HasColumnName("status").HasDefaultValue("UNDER_REVIEW");
                entity.Property(e => e.RejectionReason).HasColumnName("rejection_reason");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.UploadedAt).HasColumnName("uploaded_at").HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(d => d.User)
                    .WithMany()
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // BankAccounts
            modelBuilder.Entity<BankAccount>(entity =>
            {
                entity.ToTable("bank_accounts");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.AccountNumberEncrypted).HasColumnName("account_number_encrypted").IsRequired();
                entity.Property(e => e.IfscCode).HasColumnName("ifsc_code").IsRequired().HasMaxLength(20);
                entity.Property(e => e.BankName).HasColumnName("bank_name").HasMaxLength(100);
                entity.Property(e => e.IsVerified).HasColumnName("is_verified").HasDefaultValue(false);
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(d => d.User)
                    .WithMany()
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // WithdrawalRequests
            modelBuilder.Entity<WithdrawalRequest>(entity =>
            {
                entity.ToTable("withdrawal_requests");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.BankAccountId).HasColumnName("bank_account_id");
                entity.Property(e => e.AmountPaise).HasColumnName("amount_paise").IsRequired();
                entity.Property(e => e.Status).HasColumnName("status").HasDefaultValue("PENDING").HasMaxLength(20);
                entity.Property(e => e.UtrNumber).HasColumnName("utr_number").HasMaxLength(100);
                entity.Property(e => e.AdminNotes).HasColumnName("admin_notes");
                entity.Property(e => e.IpAddress).HasColumnName("ip_address").IsRequired().HasMaxLength(45);
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(d => d.User)
                    .WithMany()
                    .HasForeignKey(d => d.UserId);

                entity.HasOne(d => d.BankAccount)
                    .WithMany()
                    .HasForeignKey(d => d.BankAccountId);
            });

            // AppConfigs
            modelBuilder.Entity<AppConfig>(entity =>
            {
                entity.ToTable("app_configs");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id").HasMaxLength(50);
                entity.Property(e => e.SupportEmail).HasColumnName("support_email");
                entity.Property(e => e.SupportPhone).HasColumnName("support_phone");
                entity.Property(e => e.TermsAndConditionsUrl).HasColumnName("terms_url");
                entity.Property(e => e.PrivacyPolicyUrl).HasColumnName("privacy_url");
                entity.Property(e => e.FaqJson).HasColumnName("faq_json").HasColumnType("jsonb");
                entity.Property(e => e.ReferralBonusMsg).HasColumnName("referral_bonus_msg");
                entity.Property(e => e.PrimaryColorHex).HasColumnName("primary_color_hex");
                entity.Property(e => e.SecondaryColorHex).HasColumnName("secondary_color_hex");
                entity.Property(e => e.FestivalBannerUrl).HasColumnName("festival_banner_url");
                entity.Property(e => e.IsReferralEnabled).HasColumnName("is_referral_enabled").HasDefaultValue(true);
                entity.Property(e => e.IsAutoSaveEnabled).HasColumnName("is_autosave_enabled").HasDefaultValue(true);
                entity.Property(e => e.ReferrerRewardMg).HasColumnName("referrer_reward_mg").HasDefaultValue(100L);
                entity.Property(e => e.RefereeRewardMg).HasColumnName("referee_reward_mg").HasDefaultValue(50L);
                entity.Property(e => e.IsDailyPriceNotificationEnabled).HasColumnName("is_daily_price_notification_enabled").HasDefaultValue(false);
                entity.Property(e => e.LastDailyPriceNotificationSent).HasColumnName("last_daily_price_notification_sent");
                
                // Receipt Config Column Mappings
                entity.Property(e => e.ReceiptCompanyName).HasColumnName("receipt_company_name").HasDefaultValue("AISHWARYAM @ YOUR HOME");
                entity.Property(e => e.ReceiptSubtitle).HasColumnName("receipt_subtitle").HasDefaultValue("Official Digital Gold Savings Investment Receipt");
                entity.Property(e => e.ReceiptCorpName).HasColumnName("receipt_corp_name").HasDefaultValue("Aishwaryam @ Home Private Limited");
                entity.Property(e => e.ReceiptAddress1).HasColumnName("receipt_address1").HasDefaultValue("45, Palace Road, Vasanth Nagar,");
                entity.Property(e => e.ReceiptAddress2).HasColumnName("receipt_address2").HasDefaultValue("Chennai, Tamil Nadu - 600001");
                entity.Property(e => e.ReceiptPhone).HasColumnName("receipt_phone").HasDefaultValue("+91 94430 00000");
                entity.Property(e => e.ReceiptEmail).HasColumnName("receipt_email").HasDefaultValue("support@aishwaryam.com");
                entity.Property(e => e.ReceiptColorPrimary).HasColumnName("receipt_color_primary").HasDefaultValue("#6B21A8");
                entity.Property(e => e.ReceiptColorSecondary).HasColumnName("receipt_color_secondary").HasDefaultValue("#D4AF37");
                entity.Property(e => e.ReceiptDisclaimerGold).HasColumnName("receipt_disclaimer_gold").HasDefaultValue("* Gold credited is subject to the terms and rules of the locked scheme plan.");
                entity.Property(e => e.ReceiptDisclaimerSilver).HasColumnName("receipt_disclaimer_silver").HasDefaultValue("* Silver credited is subject to the terms and rules of the locked scheme plan.");
                entity.Property(e => e.ReceiptRegisteredOffice).HasColumnName("receipt_registered_office").HasDefaultValue("Registered Office: No. 123, Gandhi Road, Chennai, Tamil Nadu - 600001");

                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            });

            // AppBanners (Admin-driven carousel)
            modelBuilder.Entity<AppBanner>(entity =>
            {
                entity.ToTable("app_banners");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
                entity.Property(e => e.Title).HasColumnName("title").IsRequired().HasMaxLength(200);
                entity.Property(e => e.ImageBase64).HasColumnName("image_base64").IsRequired().HasColumnType("text");
                entity.Property(e => e.TapActionUrl).HasColumnName("tap_action_url").HasMaxLength(500);
                entity.Property(e => e.IsActive).HasColumnName("is_active").HasDefaultValue(true);
                entity.Property(e => e.DisplayOrder).HasColumnName("display_order").HasDefaultValue(0);
                entity.Property(e => e.Location).HasColumnName("location").HasDefaultValue("DASHBOARD").HasMaxLength(50);
                entity.Property(e => e.ExpiresAt).HasColumnName("expires_at");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.CreatedByAdminId).HasColumnName("created_by_admin_id").HasMaxLength(100);
            });

            // UserSchemes
            modelBuilder.Entity<UserScheme>(entity =>
            {
                entity.ToTable("user_schemes");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.PlanName).HasColumnName("plan_name").IsRequired().HasMaxLength(100);
                entity.Property(e => e.AutoPayEnabled).HasColumnName("auto_pay_enabled").HasDefaultValue(false);
                entity.Property(e => e.RazorpaySubscriptionId).HasColumnName("razorpay_subscription_id");
                entity.Property(e => e.PaymentFrequency).HasColumnName("payment_frequency").IsRequired().HasMaxLength(20);
                entity.Property(e => e.InstallmentAmountPaise).HasColumnName("installment_amount_paise").IsRequired();
                entity.Property(e => e.InstallmentsPaid).HasColumnName("installments_paid").HasDefaultValue(0);
                entity.Property(e => e.TotalInstallments).HasColumnName("total_installments").IsRequired();
                entity.Property(e => e.NextDueDate).HasColumnName("next_due_date").IsRequired();
                entity.Property(e => e.AccumulatedGoldMg).HasColumnName("accumulated_gold_mg").HasDefaultValue(0);
                entity.Property(e => e.Status).HasColumnName("status").HasDefaultValue("Active").HasMaxLength(20);
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.MaturityDate).HasColumnName("MaturityDate").IsRequired();
                entity.Property(e => e.RedeemedGoldMg).HasColumnName("RedeemedGoldMg").HasDefaultValue(0);
                entity.Property(e => e.SchemeMasterId).HasColumnName("scheme_master_id");
                entity.Property(e => e.SubmittedFormDetails).HasColumnName("submitted_form_details");
                entity.Property(e => e.IsJoinFormCompleted).HasColumnName("is_join_form_completed").HasDefaultValue(false);
                entity.Property(e => e.FormSubmittedAt).HasColumnName("form_submitted_at");

                entity.HasOne(d => d.User)
                    .WithMany()
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(d => d.SchemeMaster)
                    .WithMany()
                    .HasForeignKey(d => d.SchemeMasterId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // AdminAlerts
            modelBuilder.Entity<AdminAlert>(entity =>
            {
                entity.ToTable("admin_alerts");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.AlertType).HasColumnName("alert_type").IsRequired().HasMaxLength(50);
                entity.Property(e => e.Message).HasColumnName("message").IsRequired();
                entity.Property(e => e.IsResolved).HasColumnName("is_resolved").HasDefaultValue(false);
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(d => d.User)
                    .WithMany()
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ReferralEvents
            modelBuilder.Entity<ReferralEvent>(entity =>
            {
                entity.ToTable("referral_events");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
                entity.Property(e => e.ReferrerUserId).HasColumnName("referrer_user_id");
                entity.Property(e => e.RefereeUserId).HasColumnName("referee_user_id");
                entity.Property(e => e.RewardStatus).HasColumnName("reward_status").HasDefaultValue("Pending").HasMaxLength(20);
                entity.Property(e => e.BonusAwardedMg).HasColumnName("bonus_awarded_mg").HasDefaultValue(0);
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(d => d.ReferrerUser)
                    .WithMany()
                    .HasForeignKey(d => d.ReferrerUserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(d => d.RefereeUser)
                    .WithMany()
                    .HasForeignKey(d => d.RefereeUserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // PlatformAuditLogs
            modelBuilder.Entity<PlatformAuditLog>(entity =>
            {
                entity.ToTable("platform_audit_logs");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.Action).HasColumnName("action").IsRequired().HasMaxLength(100);
                entity.Property(e => e.Details).HasColumnName("details");
                entity.Property(e => e.IpAddress).HasColumnName("ip_address").HasMaxLength(45);
                entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(20).HasDefaultValue("SUCCESS");
                entity.Property(e => e.ErrorMessage).HasColumnName("error_message");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            });

            // UserNotifications
            modelBuilder.Entity<UserNotification>(entity =>
            {
                entity.ToTable("user_notifications");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.Title).HasColumnName("title").IsRequired();
                entity.Property(e => e.Message).HasColumnName("message").IsRequired();
                entity.Property(e => e.Type).HasColumnName("type").HasDefaultValue("GENERAL");
                entity.Property(e => e.IsRead).HasColumnName("is_read").HasDefaultValue(false);
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            });

            // Payments
            modelBuilder.Entity<Payment>(entity =>
            {
                entity.ToTable("payments");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.ProviderOrderId).HasColumnName("provider_order_id").IsRequired().HasMaxLength(100);
                entity.Property(e => e.ProviderPaymentId).HasColumnName("provider_payment_id").HasMaxLength(100);
                entity.Property(e => e.AmountPaise).HasColumnName("amount_paise").IsRequired();
                entity.Property(e => e.UserSchemeId).HasColumnName("user_scheme_id");
                entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(20).HasDefaultValue("PENDING");
                entity.Property(e => e.IpAddress).HasColumnName("ip_address").HasMaxLength(45);
                entity.Property(e => e.DeviceFingerprint).HasColumnName("device_fingerprint").HasMaxLength(255);
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(d => d.User)
                    .WithMany()
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // IdempotencyKeys
            modelBuilder.Entity<IdempotencyKey>(entity =>
            {
                entity.ToTable("idempotency_keys");
                entity.HasKey(e => e.Key);
                entity.Property(e => e.Key).HasColumnName("key").HasMaxLength(100);
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.Endpoint).HasColumnName("endpoint").IsRequired().HasMaxLength(100);
                entity.Property(e => e.ResponseBody).HasColumnName("response_body").HasColumnType("jsonb");
                entity.Property(e => e.ResponseStatus).HasColumnName("response_status").IsRequired();
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            });

            // Invoices
            modelBuilder.Entity<Invoice>(entity =>
            {
                entity.ToTable("invoices");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
                entity.Property(e => e.TransactionId).HasColumnName("transaction_id");
                entity.Property(e => e.BaseAmountPaise).HasColumnName("base_amount_paise").IsRequired();
                entity.Property(e => e.GstAmountPaise).HasColumnName("gst_amount_paise").IsRequired();
                entity.Property(e => e.TotalAmountPaise).HasColumnName("total_amount_paise").IsRequired();
                entity.Property(e => e.BonusPercentage).HasColumnName("bonus_percentage").HasDefaultValue(0);
                entity.Property(e => e.BonusAmountPaise).HasColumnName("bonus_amount_paise").HasDefaultValue(0);
                entity.Property(e => e.BonusGoldMg).HasColumnName("bonus_gold_mg").HasDefaultValue(0);
                entity.Property(e => e.SchemeDayNumber).HasColumnName("scheme_day_number").HasDefaultValue(0);
                entity.Property(e => e.InvoicePdfUrl).HasColumnName("invoice_pdf_url");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(d => d.Transaction)
                    .WithOne(t => t.Invoice)
                    .HasForeignKey<Invoice>(d => d.TransactionId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // UserDevices
            modelBuilder.Entity<UserDevice>(entity =>
            {
                entity.ToTable("user_devices");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
                entity.Property(e => e.UserId).HasColumnName("user_id").IsRequired(false);
                entity.Property(e => e.FcmToken).HasColumnName("fcm_token").IsRequired();
                entity.Property(e => e.DeviceType).HasColumnName("device_type").HasMaxLength(20).HasDefaultValue("ANDROID");
                entity.Property(e => e.IsActive).HasColumnName("is_active").HasDefaultValue(true);
                entity.Property(e => e.LastUsedAt).HasColumnName("last_used_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(d => d.User)
                    .WithMany()
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => e.FcmToken).IsUnique();
            });

            // WebhookEventLogs — idempotency store for Razorpay events
            modelBuilder.Entity<WebhookEventLog>(entity =>
            {
                entity.ToTable("webhook_event_logs");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
                entity.Property(e => e.RazorpayEventId).HasColumnName("razorpay_event_id").IsRequired().HasMaxLength(100);
                entity.Property(e => e.EventType).HasColumnName("event_type").IsRequired().HasMaxLength(60);
                entity.Property(e => e.RazorpayPaymentId).HasColumnName("razorpay_payment_id").HasMaxLength(100);
                entity.Property(e => e.RazorpaySubscriptionId).HasColumnName("razorpay_subscription_id").HasMaxLength(100);
                entity.Property(e => e.SignatureReceived).HasColumnName("signature_received").HasMaxLength(200);
                entity.Property(e => e.WasProcessed).HasColumnName("was_processed").HasDefaultValue(true);
                entity.Property(e => e.ProcessingError).HasColumnName("processing_error");
                entity.Property(e => e.ProcessedAt).HasColumnName("processed_at").HasDefaultValueSql("CURRENT_TIMESTAMP");

                // Core idempotency constraint — DB will reject duplicate event IDs
                entity.HasIndex(e => e.RazorpayEventId).IsUnique();
            });

            // GoldPriceSnapshots
            modelBuilder.Entity<GoldPriceSnapshot>(entity =>
            {
                entity.ToTable("gold_price_snapshots");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
                entity.Property(e => e.Price24KPerGram).HasColumnName("price_24k_per_gram").IsRequired();
                entity.Property(e => e.Price22KPerGram).HasColumnName("price_22k_per_gram").IsRequired();
                entity.Property(e => e.PriceSilverPerGram).HasColumnName("price_silver_per_gram").IsRequired().HasDefaultValue(0m);
                entity.Property(e => e.BuyPricePerGram).HasColumnName("buy_price_per_gram").IsRequired();
                entity.Property(e => e.SellPricePerGram).HasColumnName("sell_price_per_gram").IsRequired();
                entity.Property(e => e.Source).HasColumnName("source").IsRequired().HasMaxLength(50);
                entity.Property(e => e.AdminNote).HasColumnName("admin_note");
                entity.Property(e => e.IsAdminOverride).HasColumnName("is_admin_override").HasDefaultValue(false);
                entity.Property(e => e.FetchedAt).HasColumnName("fetched_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.ExpiresAt).HasColumnName("expires_at");
            });
            // EmailLogs
            modelBuilder.Entity<EmailLog>(entity =>
            {
                entity.ToTable("email_logs");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.ToEmail).HasColumnName("to_email").IsRequired().HasMaxLength(255);
                entity.Property(e => e.ToName).HasColumnName("to_name").HasMaxLength(100);
                entity.Property(e => e.Subject).HasColumnName("subject").IsRequired();
                entity.Property(e => e.TemplateName).HasColumnName("template_name").IsRequired().HasMaxLength(100);
                entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(20).HasDefaultValue("PENDING");
                entity.Property(e => e.ProviderMessageId).HasColumnName("provider_message_id").HasMaxLength(100);
                entity.Property(e => e.ErrorMessage).HasColumnName("error_message");
                entity.Property(e => e.RetryCount).HasColumnName("retry_count").HasDefaultValue(0);
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.SentAt).HasColumnName("sent_at");

                entity.HasOne(d => d.User)
                    .WithMany()
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // SchemeBonusTier
            modelBuilder.Entity<SchemeBonusTier>(entity =>
            {
                entity.ToTable("scheme_bonus_tiers");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
                entity.Property(e => e.SchemeMasterId).HasColumnName("scheme_master_id");
                entity.Property(e => e.StartDay).HasColumnName("start_day").IsRequired();
                entity.Property(e => e.EndDay).HasColumnName("end_day").IsRequired();
                entity.Property(e => e.BonusPercentage).HasColumnName("bonus_percentage").HasPrecision(5, 2).IsRequired();
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(e => e.SchemeMaster)
                    .WithMany()
                    .HasForeignKey(e => e.SchemeMasterId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // SchemeInvestment
            modelBuilder.Entity<SchemeInvestment>(entity =>
            {
                entity.ToTable("scheme_investments");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
                entity.Property(e => e.UserSchemeId).HasColumnName("user_scheme_id");
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.TransactionType).HasColumnName("transaction_type").HasMaxLength(20).HasDefaultValue("INSTALLMENT");
                entity.Property(e => e.InstallmentNumber).HasColumnName("installment_number").IsRequired();
                entity.Property(e => e.AmountPaise).HasColumnName("amount_paise").IsRequired();
                entity.Property(e => e.BaseAmountPaise).HasColumnName("base_amount_paise").IsRequired();
                entity.Property(e => e.GstAmountPaise).HasColumnName("gst_amount_paise").IsRequired();
                entity.Property(e => e.GoldWeightMg).HasColumnName("gold_weight_mg").IsRequired();
                entity.Property(e => e.PricePerGmPaise).HasColumnName("price_per_gm_paise").IsRequired();
                entity.Property(e => e.BonusPercentage).HasColumnName("bonus_percentage").HasPrecision(5, 2).HasDefaultValue(0);
                entity.Property(e => e.BonusAmountPaise).HasColumnName("bonus_amount_paise").HasDefaultValue(0);
                entity.Property(e => e.BonusGoldMg).HasColumnName("bonus_gold_mg").HasDefaultValue(0);
                entity.Property(e => e.RazorpayPaymentId).HasColumnName("razorpay_payment_id").HasMaxLength(100);
                entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(20).HasDefaultValue("COMPLETED");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(e => e.UserScheme)
                    .WithMany()
                    .HasForeignKey(e => e.UserSchemeId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => e.UserSchemeId);
                entity.HasIndex(e => e.RazorpayPaymentId);
            });

            // SchemeRedemption
            modelBuilder.Entity<SchemeRedemption>(entity =>
            {
                entity.ToTable("scheme_redemptions");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
                entity.Property(e => e.UserSchemeId).HasColumnName("user_scheme_id");
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.RedemptionType).HasColumnName("redemption_type").HasMaxLength(20).IsRequired();
                entity.Property(e => e.GoldWeightMg).HasColumnName("gold_weight_mg").IsRequired();
                entity.Property(e => e.PricePerGmPaise).HasColumnName("price_per_gm_paise").IsRequired();
                entity.Property(e => e.TotalAmountPaise).HasColumnName("total_amount_paise").IsRequired();
                entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(20).HasDefaultValue("PENDING");
                entity.Property(e => e.Address).HasColumnName("address");
                entity.Property(e => e.AdminNotes).HasColumnName("admin_notes");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(e => e.UserScheme)
                    .WithMany()
                    .HasForeignKey(e => e.UserSchemeId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => e.UserSchemeId);
            });

            // RedemptionStatusHistory
            modelBuilder.Entity<RedemptionStatusHistory>(entity =>
            {
                entity.ToTable("redemption_status_history");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
                entity.Property(e => e.SchemeRedemptionId).HasColumnName("scheme_redemption_id");
                entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(20).IsRequired();
                entity.Property(e => e.ChangeReason).HasColumnName("change_reason");
                entity.Property(e => e.ChangedByAdminId).HasColumnName("changed_by_admin_id").HasMaxLength(100);
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(e => e.SchemeRedemption)
                    .WithMany()
                    .HasForeignKey(e => e.SchemeRedemptionId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => e.SchemeRedemptionId);
            });

            // ChatbotLogs
            modelBuilder.Entity<ChatbotLog>(entity =>
            {
                entity.ToTable("chatbot_logs");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.UserMessage).HasColumnName("user_message").IsRequired();
                entity.Property(e => e.BotResponse).HasColumnName("bot_response").IsRequired();
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(d => d.User)
                    .WithMany()
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}
