using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Aishwaryam.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSchemeBonusRedemptionLedger : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "entity_id",
                table: "user_notifications",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "user_notifications",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "email_logs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    to_email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    to_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    subject = table.Column<string>(type: "text", nullable: false),
                    template_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "PENDING"),
                    provider_message_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    error_message = table.Column<string>(type: "text", nullable: true),
                    retry_count = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    sent_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_email_logs", x => x.id);
                    table.ForeignKey(
                        name: "FK_email_logs_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "scheme_bonus_tiers",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    scheme_master_id = table.Column<Guid>(type: "uuid", nullable: false),
                    start_day = table.Column<int>(type: "integer", nullable: false),
                    end_day = table.Column<int>(type: "integer", nullable: false),
                    bonus_percentage = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_scheme_bonus_tiers", x => x.id);
                    table.ForeignKey(
                        name: "FK_scheme_bonus_tiers_schemes_master_scheme_master_id",
                        column: x => x.scheme_master_id,
                        principalTable: "schemes_master",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "scheme_investments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_scheme_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    transaction_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "INSTALLMENT"),
                    installment_number = table.Column<long>(type: "bigint", nullable: false),
                    amount_paise = table.Column<long>(type: "bigint", nullable: false),
                    base_amount_paise = table.Column<long>(type: "bigint", nullable: false),
                    gst_amount_paise = table.Column<long>(type: "bigint", nullable: false),
                    gold_weight_mg = table.Column<long>(type: "bigint", nullable: false),
                    price_per_gm_paise = table.Column<long>(type: "bigint", nullable: false),
                    bonus_percentage = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false, defaultValue: 0m),
                    bonus_amount_paise = table.Column<long>(type: "bigint", nullable: false, defaultValue: 0L),
                    bonus_gold_mg = table.Column<long>(type: "bigint", nullable: false, defaultValue: 0L),
                    razorpay_payment_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "COMPLETED"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_scheme_investments", x => x.id);
                    table.ForeignKey(
                        name: "FK_scheme_investments_user_schemes_user_scheme_id",
                        column: x => x.user_scheme_id,
                        principalTable: "user_schemes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_scheme_investments_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "scheme_redemptions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_scheme_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    redemption_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    gold_weight_mg = table.Column<long>(type: "bigint", nullable: false),
                    price_per_gm_paise = table.Column<long>(type: "bigint", nullable: false),
                    total_amount_paise = table.Column<long>(type: "bigint", nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "PENDING"),
                    address = table.Column<string>(type: "text", nullable: true),
                    admin_notes = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_scheme_redemptions", x => x.id);
                    table.ForeignKey(
                        name: "FK_scheme_redemptions_user_schemes_user_scheme_id",
                        column: x => x.user_scheme_id,
                        principalTable: "user_schemes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_scheme_redemptions_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "redemption_status_history",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    scheme_redemption_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    change_reason = table.Column<string>(type: "text", nullable: true),
                    changed_by_admin_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_redemption_status_history", x => x.id);
                    table.ForeignKey(
                        name: "FK_redemption_status_history_scheme_redemptions_scheme_redempt~",
                        column: x => x.scheme_redemption_id,
                        principalTable: "scheme_redemptions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_email_logs_user_id",
                table: "email_logs",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_redemption_status_history_scheme_redemption_id",
                table: "redemption_status_history",
                column: "scheme_redemption_id");

            migrationBuilder.CreateIndex(
                name: "IX_scheme_bonus_tiers_scheme_master_id",
                table: "scheme_bonus_tiers",
                column: "scheme_master_id");

            migrationBuilder.CreateIndex(
                name: "IX_scheme_investments_razorpay_payment_id",
                table: "scheme_investments",
                column: "razorpay_payment_id");

            migrationBuilder.CreateIndex(
                name: "IX_scheme_investments_user_id",
                table: "scheme_investments",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_scheme_investments_user_scheme_id",
                table: "scheme_investments",
                column: "user_scheme_id");

            migrationBuilder.CreateIndex(
                name: "IX_scheme_redemptions_user_id",
                table: "scheme_redemptions",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_scheme_redemptions_user_scheme_id",
                table: "scheme_redemptions",
                column: "user_scheme_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "email_logs");

            migrationBuilder.DropTable(
                name: "redemption_status_history");

            migrationBuilder.DropTable(
                name: "scheme_bonus_tiers");

            migrationBuilder.DropTable(
                name: "scheme_investments");

            migrationBuilder.DropTable(
                name: "scheme_redemptions");

            migrationBuilder.DropColumn(
                name: "entity_id",
                table: "user_notifications");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "user_notifications");
        }
    }
}
