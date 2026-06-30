using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Aishwaryam.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOffersMinGramsAndBanner : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "banner_url",
                table: "promotional_offers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "min_purchase_gold_mg",
                table: "promotional_offers",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "banner_url",
                table: "promotional_offers");

            migrationBuilder.DropColumn(
                name: "min_purchase_gold_mg",
                table: "promotional_offers");
        }
    }
}
