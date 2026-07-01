using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Aishwaryam.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUserOnboardingFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "app_configs",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    support_email = table.Column<string>(type: "text", nullable: false),
                    support_phone = table.Column<string>(type: "text", nullable: false),
                    terms_url = table.Column<string>(type: "text", nullable: false),
                    privacy_url = table.Column<string>(type: "text", nullable: false),
                    faq_json = table.Column<string>(type: "jsonb", nullable: false),
                    referral_bonus_msg = table.Column<string>(type: "text", nullable: false),
                    primary_color_hex = table.Column<string>(type: "text", nullable: false),
                    secondary_color_hex = table.Column<string>(type: "text", nullable: false),
                    festival_banner_url = table.Column<string>(type: "text", nullable: false),
                    is_referral_enabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    is_autosave_enabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_app_configs", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "gold_price_logs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    buy_price_paise = table.Column<long>(type: "bigint", nullable: false),
                    sell_price_paise = table.Column<long>(type: "bigint", nullable: false),
                    is_admin_override = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    admin_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_gold_price_logs", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "otp_logs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    phone_number = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: false),
                    otp_hash = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    ip_address = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: false),
                    expires_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    is_used = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_otp_logs", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    phone_number = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: false),
                    email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    full_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    kyc_level = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "BASIC"),
                    mpin_hash = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    biometric_enabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    referral_code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    date_of_birth = table.Column<DateTime>(type: "date", nullable: true),
                    nominee_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "auth_sessions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    refresh_token = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                    device_fingerprint = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    ip_address = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: false),
                    user_agent = table.Column<string>(type: "text", nullable: true),
                    expires_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    is_revoked = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_auth_sessions", x => x.id);
                    table.ForeignKey(
                        name: "FK_auth_sessions_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "bank_accounts",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    account_number_encrypted = table.Column<string>(type: "text", nullable: false),
                    ifsc_code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    bank_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    is_verified = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_bank_accounts", x => x.id);
                    table.ForeignKey(
                        name: "FK_bank_accounts_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "gold_holdings",
                columns: table => new
                {
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    gold_balance_mg = table.Column<long>(type: "bigint", nullable: false, defaultValue: 0L),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_gold_holdings", x => x.user_id);
                    table.ForeignKey(
                        name: "FK_gold_holdings_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "gold_transactions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    transaction_type = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    gold_weight_mg = table.Column<long>(type: "bigint", nullable: false),
                    price_per_gm_paise = table.Column<long>(type: "bigint", nullable: false),
                    total_amount_paise = table.Column<long>(type: "bigint", nullable: false),
                    ip_address = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: false),
                    device_fingerprint = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_gold_transactions", x => x.id);
                    table.ForeignKey(
                        name: "FK_gold_transactions_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "kyc_documents",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    document_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    document_url = table.Column<string>(type: "text", nullable: false),
                    uploaded_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_kyc_documents", x => x.id);
                    table.ForeignKey(
                        name: "FK_kyc_documents_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "wallet_ledger",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    transaction_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    amount_paise = table.Column<long>(type: "bigint", nullable: false),
                    reference_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    ip_address = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: false),
                    device_fingerprint = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_wallet_ledger", x => x.id);
                    table.ForeignKey(
                        name: "FK_wallet_ledger_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "wallets",
                columns: table => new
                {
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    inr_balance_paise = table.Column<long>(type: "bigint", nullable: false, defaultValue: 0L),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_wallets", x => x.user_id);
                    table.ForeignKey(
                        name: "FK_wallets_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "withdrawal_requests",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    bank_account_id = table.Column<Guid>(type: "uuid", nullable: false),
                    amount_paise = table.Column<long>(type: "bigint", nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "PENDING"),
                    utr_number = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    admin_notes = table.Column<string>(type: "text", nullable: true),
                    ip_address = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_withdrawal_requests", x => x.id);
                    table.ForeignKey(
                        name: "FK_withdrawal_requests_bank_accounts_bank_account_id",
                        column: x => x.bank_account_id,
                        principalTable: "bank_accounts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_withdrawal_requests_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_auth_sessions_user_id",
                table: "auth_sessions",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_bank_accounts_user_id",
                table: "bank_accounts",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_gold_transactions_user_id",
                table: "gold_transactions",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_kyc_documents_user_id",
                table: "kyc_documents",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_users_email",
                table: "users",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_phone_number",
                table: "users",
                column: "phone_number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_wallet_ledger_user_id",
                table: "wallet_ledger",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_withdrawal_requests_bank_account_id",
                table: "withdrawal_requests",
                column: "bank_account_id");

            migrationBuilder.CreateIndex(
                name: "IX_withdrawal_requests_user_id",
                table: "withdrawal_requests",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "app_configs");

            migrationBuilder.DropTable(
                name: "auth_sessions");

            migrationBuilder.DropTable(
                name: "gold_holdings");

            migrationBuilder.DropTable(
                name: "gold_price_logs");

            migrationBuilder.DropTable(
                name: "gold_transactions");

            migrationBuilder.DropTable(
                name: "kyc_documents");

            migrationBuilder.DropTable(
                name: "otp_logs");

            migrationBuilder.DropTable(
                name: "wallet_ledger");

            migrationBuilder.DropTable(
                name: "wallets");

            migrationBuilder.DropTable(
                name: "withdrawal_requests");

            migrationBuilder.DropTable(
                name: "bank_accounts");

            migrationBuilder.DropTable(
                name: "users");
        }
    }
}
