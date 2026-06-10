using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Aishwaryam.Application.Interfaces.Services;
using Aishwaryam.Domain.Entities;
using Aishwaryam.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Aishwaryam.Infrastructure.Services
{
    public class ReceiptPdfGenerator : IReceiptPdfGenerator
    {
        private readonly ApplicationDbContext _context;
        private readonly IHostEnvironment _env;

        public ReceiptPdfGenerator(ApplicationDbContext context, IHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        public async Task<byte[]> GenerateReceiptPdfAsync(Guid transactionId)
        {
            // Fetch transaction with invoice and user
            var tx = await _context.GoldTransactions
                .Include(t => t.Invoice)
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.Id == transactionId);

            if (tx == null)
            {
                throw new KeyNotFoundException($"Transaction with ID {transactionId} not found.");
            }

            string schemePlanName = "";
            if (tx.UserSchemeId.HasValue)
            {
                var scheme = await _context.UserSchemes.FirstOrDefaultAsync(s => s.Id == tx.UserSchemeId.Value);
                if (scheme != null)
                {
                    schemePlanName = scheme.PlanName;
                }
            }

            bool isSilver = !string.IsNullOrEmpty(schemePlanName) && schemePlanName.Contains("silver", StringComparison.OrdinalIgnoreCase);

            // Ensure QuestPDF license type is set
            QuestPDF.Settings.License = LicenseType.Community;

            var logoPath = Path.Combine(_env.ContentRootPath, "wwwroot", "logo.png");
            bool logoExists = File.Exists(logoPath);

            byte[] pdfBytes = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(1.5f, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(10).FontFamily(Fonts.Arial));

                    // Header section
                    page.Header().Column(header =>
                    {
                        header.Item().Row(row =>
                        {
                            if (logoExists)
                            {
                                row.ConstantItem(45).PaddingRight(10).AlignMiddle().Image(logoPath);
                            }

                            row.RelativeItem().Column(col =>
                            {
                                col.Item().Text("AISHWARYAM SWARNA MAHAL").FontSize(16).Bold().FontColor("#6B21A8");
                                col.Item().Text("Aishwaryam @ your home").FontSize(9).Italic().FontColor("#D4AF37");
                            });

                            row.ConstantItem(160).AlignRight().Column(col =>
                            {
                                col.Item().Text("TRANSACTION RECEIPT").FontSize(11).Bold().FontColor("#4B5563");
                                col.Item().Text($"Receipt No: {tx.Id.ToString()[..8].ToUpper()}").FontSize(8.5f).FontColor("#6B7280");
                            });
                        });
                        
                        header.Item().PaddingVertical(8).LineHorizontal(1.5f).LineColor("#6B21A8");
                    });

                    // Content section
                    page.Content().PaddingVertical(10).Column(col =>
                    {
                        col.Spacing(12);

                        // Card: Customer & Transaction Metadata
                        col.Item().Background("#F9FAFB").Border(0.5f).BorderColor("#E5E7EB").Padding(12).Row(row =>
                        {
                            row.RelativeItem().Column(userCol =>
                            {
                                userCol.Item().Text("CUSTOMER DETAILS").FontSize(8.5f).Bold().FontColor("#6B21A8");
                                userCol.Item().PaddingTop(3).Text($"Name: {tx.User?.FullName ?? "Customer"}").FontSize(9).FontColor("#1F2937");
                                userCol.Item().Text($"Mobile: {tx.User?.PhoneNumber ?? "N/A"}").FontSize(9).FontColor("#1F2937");
                                userCol.Item().Text($"Email: {tx.User?.Email ?? "N/A"}").FontSize(9).FontColor("#1F2937");
                            });

                            row.ConstantItem(15);
                            row.ConstantItem(1).Background("#E5E7EB");
                            row.ConstantItem(15);

                            row.RelativeItem().Column(txCol =>
                            {
                                txCol.Item().Text("TRANSACTION SUMMARY").FontSize(8.5f).Bold().FontColor("#6B21A8");
                                txCol.Item().PaddingTop(3).Text($"Date & Time: {tx.CreatedAt.LocalDateTime.ToString("dd MMM yyyy, hh:mm tt")}").FontSize(9).FontColor("#1F2937");
                                txCol.Item().Text($"Payment Reference: {tx.RazorpayPaymentId ?? "N/A"}").FontSize(9).FontColor("#1F2937");
                                txCol.Item().Text(x => {
                                    x.Span("Status: ").FontSize(9).FontColor("#1F2937");
                                    x.Span("COMPLETED").FontSize(9).Bold().FontColor("#10B981");
                                });
                                if (!string.IsNullOrEmpty(schemePlanName))
                                {
                                    txCol.Item().Text($"Linked Plan: {schemePlanName}").FontSize(9).Bold().FontColor("#D4AF37");
                                }
                            });
                        });

                        // Items Table
                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.ConstantColumn(30);
                                columns.RelativeColumn(3);
                                columns.RelativeColumn(2);
                                columns.RelativeColumn(2);
                            });

                            // Header
                            table.Header(header =>
                            {
                                header.Cell().Background("#6B21A8").Padding(6).Text("S.No").Bold().FontColor(Colors.White).FontSize(9);
                                header.Cell().Background("#6B21A8").Padding(6).Text("Description").Bold().FontColor(Colors.White).FontSize(9);
                                header.Cell().Background("#6B21A8").Padding(6).AlignRight().Text("Rate (per gm)").Bold().FontColor(Colors.White).FontSize(9);
                                header.Cell().Background("#6B21A8").Padding(6).AlignRight().Text("Amount").Bold().FontColor(Colors.White).FontSize(9);
                            });

                            // Row 1: Base Purchase
                            string assetName = isSilver ? "DigiSilver Purchase" : "DigiGold (22K) Purchase";
                            
                            table.Cell().BorderBottom(0.5f).BorderColor("#E5E7EB").Padding(6).Text("1").FontSize(9);
                            table.Cell().BorderBottom(0.5f).BorderColor("#E5E7EB").Padding(6).Column(c =>
                            {
                                c.Item().Text(assetName).FontSize(9).Bold();
                                c.Item().Text($"Weight Credited: {tx.GoldWeightMg / 1000.0:F4} g").FontSize(8).FontColor("#6B7280");
                            });
                            table.Cell().BorderBottom(0.5f).BorderColor("#E5E7EB").Padding(6).AlignRight().Text($"₹{(tx.PricePerGmPaise / 100.0):F2}").FontSize(9);
                            table.Cell().BorderBottom(0.5f).BorderColor("#E5E7EB").Padding(6).AlignRight().Text($"₹{((tx.Invoice?.BaseAmountPaise ?? (tx.TotalAmountPaise * 100 / 103)) / 100.0):F2}").FontSize(9);

                            // Row 2: GST
                            table.Cell().BorderBottom(0.5f).BorderColor("#E5E7EB").Padding(6).Text("2").FontSize(9);
                            table.Cell().BorderBottom(0.5f).BorderColor("#E5E7EB").Padding(6).Text("GST (3%)").FontSize(9);
                            table.Cell().BorderBottom(0.5f).BorderColor("#E5E7EB").Padding(6).AlignRight().Text("-").FontSize(9);
                            table.Cell().BorderBottom(0.5f).BorderColor("#E5E7EB").Padding(6).AlignRight().Text($"₹{((tx.Invoice?.GstAmountPaise ?? (tx.TotalAmountPaise - (tx.TotalAmountPaise * 100 / 103))) / 100.0):F2}").FontSize(9);
                        });

                        // Financial Summary Block
                        col.Item().AlignRight().Width(220).Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn(3);
                                columns.RelativeColumn(2);
                            });

                            table.Cell().Padding(4).Text("Total Amount Paid:").Bold().FontSize(10).FontColor("#1F2937");
                            table.Cell().Padding(4).AlignRight().Text($"₹{(tx.TotalAmountPaise / 100.0):F2}").Bold().FontSize(10).FontColor("#6B21A8");
                            
                            if (tx.BonusGoldMg > 0)
                            {
                                string bonusLabel = isSilver ? "Bonus Silver Credited:" : "Bonus Gold Credited:";
                                table.Cell().Padding(4).Text(bonusLabel).FontSize(9).FontColor("#10B981");
                                table.Cell().Padding(4).AlignRight().Text($"+{tx.BonusGoldMg / 1000.0:F4} g").FontSize(9).FontColor("#10B981").Bold();
                            }
                        });

                        // Important info callout
                        col.Item().PaddingTop(15).Background("#FFFBEB").Padding(10).Border(0.5f).BorderColor("#FCD34D").BorderLeft(3f).BorderColor("#D4AF37").Column(noteCol =>
                        {
                            noteCol.Spacing(4);
                            noteCol.Item().Text("IMPORTANT TERMS & DETAILS").FontSize(8.5f).Bold().FontColor("#92400E");
                            if (isSilver)
                            {
                                noteCol.Item().Text("• Accumulated Silver weight will be stored in highly secure physical silver-backed vaults and can be redeemed for physical silver articles or gold jewelry at maturity.").FontSize(8).FontColor("#78350F");
                            }
                            else
                            {
                                noteCol.Item().Text("• Accumulated Gold weight will be stored in highly secure physical gold-backed vaults and can be redeemed for physical gold jewelry or coins at maturity.").FontSize(8).FontColor("#78350F");
                            }
                            noteCol.Item().Text("• Loyalty bonuses, percentages, and events are credited instantly to your portfolio ledger according to your selected scheme.").FontSize(8).FontColor("#78350F");
                        });
                    });

                    // Footer section
                    page.Footer().Column(footer =>
                    {
                        footer.Item().LineHorizontal(0.5f).LineColor("#E5E7EB");
                        footer.Item().PaddingVertical(5).Row(row =>
                        {
                            row.RelativeItem().Column(contactCol =>
                            {
                                contactCol.Item().Text("Aishwaryam Swarna Mahal (Aishwaryam @ your home)").FontSize(8).Bold().FontColor("#4B5563");
                                contactCol.Item().Text("Registered Office: No. 123, Gandhi Road, Chennai, Tamil Nadu - 600001").FontSize(7.5f).FontColor("#6B7280");
                                contactCol.Item().Text("Support Desk: +91-9876543210 | Email: support@aishwaryamgold.com").FontSize(7.5f).FontColor("#6B7280");
                            });

                            row.ConstantItem(80).AlignRight().AlignBottom().Text(x =>
                            {
                                x.Span("Page ").FontSize(8).FontColor("#9CA3AF");
                                x.CurrentPageNumber().FontSize(8).FontColor("#9CA3AF");
                            });
                        });
                    });
                });
            })
            .GeneratePdf();

            return pdfBytes;
        }
    }
}
