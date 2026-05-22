using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Aishwaryam.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSchemeLoyaltyBonusFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<long>(
                name: "RedeemedGoldMg",
                table: "user_schemes",
                type: "bigint",
                nullable: false,
                defaultValue: 0L,
                oldClrType: typeof(long),
                oldType: "bigint");

            migrationBuilder.AddColumn<long>(
                name: "bonus_amount_paise",
                table: "gold_transactions",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "bonus_gold_mg",
                table: "gold_transactions",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "bonus_amount_paise",
                table: "gold_transactions");

            migrationBuilder.DropColumn(
                name: "bonus_gold_mg",
                table: "gold_transactions");

            migrationBuilder.AlterColumn<long>(
                name: "RedeemedGoldMg",
                table: "user_schemes",
                type: "bigint",
                nullable: false,
                oldClrType: typeof(long),
                oldType: "bigint",
                oldDefaultValue: 0L);
        }
    }
}
