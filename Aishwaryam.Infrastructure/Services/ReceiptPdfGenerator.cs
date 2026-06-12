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

            // Calculation variables matching standard layout values
            double pricePerGm = tx.PricePerGmPaise / 100.0;
            double baseAmount = (tx.Invoice?.BaseAmountPaise ?? (tx.TotalAmountPaise * 100 / 103)) / 100.0;
            double gstAmount = (tx.Invoice?.GstAmountPaise ?? (tx.TotalAmountPaise - (tx.TotalAmountPaise * 100 / 103))) / 100.0;
            double bonusAmount = (tx.Invoice?.BonusAmountPaise ?? tx.BonusAmountPaise) / 100.0;

            double baseWeightG = tx.GoldWeightMg / 1000.0;
            double bonusWeightG = tx.BonusGoldMg / 1000.0;
            double totalWeightG = (tx.GoldWeightMg + tx.BonusGoldMg) / 1000.0;

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
                            row.RelativeItem().Row(logoRow =>
                            {
                                if (logoExists)
                                {
                                    logoRow.ConstantItem(45).PaddingRight(10).AlignMiddle().Image(logoPath);
                                }
                                else
                                {
                                    // Circular logo placeholder matching the image "A" inside a circle
                                    logoRow.ConstantItem(40).Height(40).Border(2f).BorderColor("#6B21A8").AlignMiddle().AlignCenter().Text("A").FontSize(22).Bold().FontColor("#6B21A8");
                                    logoRow.ConstantItem(10);
                                }

                                logoRow.RelativeItem().AlignMiddle().Column(col =>
                                {
                                    col.Item().Text("AISHWARYAM @ YOUR HOME").FontSize(20).Bold().FontColor("#6B21A8");
                                    col.Item().Text("Official Digital Gold Savings Investment Receipt").FontSize(8.5f).Italic().FontColor("#D4AF37").Bold();
                                });
                            });

                            row.ConstantItem(200).AlignRight().Column(col =>
                            {
                                col.Item().Text("Aishwaryam @ Home Private Limited").FontSize(9).Bold().FontColor("#1F2937");
                                col.Item().Text("45, Palace Road, Vasanth Nagar,").FontSize(8).FontColor("#4B5563");
                                col.Item().Text("Chennai, Tamil Nadu - 600001").FontSize(8).FontColor("#4B5563");
                                col.Item().Text("Mobile: +91 94430 00000").FontSize(8).FontColor("#4B5563");
                                col.Item().Text("Email: support@aishwaryam.com").FontSize(8).FontColor("#4B5563");
                            });
                        });
                        
                        header.Item().PaddingTop(10).LineHorizontal(3f).LineColor("#6B21A8");
                    });

                    // Content section
                    page.Content().PaddingVertical(15).Column(col =>
                    {
                        col.Spacing(15);

                        // PURCHASE INFORMATION
                        col.Item().Text("PURCHASE INFORMATION").FontSize(10).Bold().FontColor("#1F2937");
                        
                        col.Item().Row(row =>
                        {
                            row.RelativeItem().Column(subCol =>
                            {
                                subCol.Item().Row(r => { r.ConstantItem(100).Text("Customer Name:").Bold().FontSize(9).FontColor("#4B5563"); r.RelativeItem().Text(tx.User?.FullName ?? "Aishwaryam User").FontSize(9).FontColor("#1F2937"); });
                                subCol.Item().Row(r => { r.ConstantItem(100).Text("Mobile Number:").Bold().FontSize(9).FontColor("#4B5563"); r.RelativeItem().Text(tx.User?.PhoneNumber ?? "N/A").FontSize(9).FontColor("#1F2937"); });
                                subCol.Item().Row(r => { r.ConstantItem(100).Text("Plan / Scheme:").Bold().FontSize(9).FontColor("#4B5563"); r.RelativeItem().Text(!string.IsNullOrEmpty(schemePlanName) ? schemePlanName : "Digital Metal Savings Plan").FontSize(9).FontColor("#1F2937"); });
                            });
                            
                            row.ConstantItem(20);
                            
                            row.RelativeItem().Column(subCol =>
                            {
                                subCol.Item().Row(r => { r.ConstantItem(100).Text("Receipt Date:").Bold().FontSize(9).FontColor("#4B5563"); r.RelativeItem().Text(tx.CreatedAt.LocalDateTime.ToString("yyyy-MM-dd HH:mm:ss")).FontSize(9).FontColor("#1F2937"); });
                                subCol.Item().Row(r => { r.ConstantItem(100).Text("Transaction ID:").Bold().FontSize(9).FontColor("#4B5563"); r.RelativeItem().Text($"TXN{tx.Id.ToString()[..8].ToUpper()}").FontSize(9).FontColor("#1F2937"); });
                                subCol.Item().Row(r => { r.ConstantItem(100).Text("Razorpay ID:").Bold().FontSize(9).FontColor("#4B5563"); r.RelativeItem().Text(tx.RazorpayPaymentId ?? "Direct Account").FontSize(9).FontColor("#1F2937"); });
                            });
                        });
                        
                        col.Item().LineHorizontal(0.5f).LineColor("#E5E7EB");

                        // INVESTMENT BREAKDOWN
                        col.Item().Text("INVESTMENT BREAKDOWN").FontSize(10).Bold().FontColor("#1F2937");

                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn(3); // Description
                                columns.RelativeColumn(2); // Rate / Gram
                                columns.RelativeColumn(2); // Metal Weight
                                columns.RelativeColumn(2); // Amount
                            });

                            // Header
                            table.Header(header =>
                            {
                                header.Cell().Background("#6B21A8").Padding(6).Text("Description").Bold().FontColor(Colors.White).FontSize(9);
                                header.Cell().Background("#6B21A8").Padding(6).Text("Rate / Gram").Bold().FontColor(Colors.White).FontSize(9);
                                header.Cell().Background("#6B21A8").Padding(6).AlignRight().Text(isSilver ? "Silver Weight" : "Gold Weight").Bold().FontColor(Colors.White).FontSize(9);
                                header.Cell().Background("#6B21A8").Padding(6).AlignRight().Text("Amount (INR)").Bold().FontColor(Colors.White).FontSize(9);
                            });

                            // Row 1: Base Purchase
                            string baseLabel = isSilver ? "Silver Installment Amount (Base)" : "Gold Installment Amount (Base)";
                            table.Cell().BorderBottom(0.5f).BorderColor("#E5E7EB").Padding(6).Text(baseLabel).FontSize(9);
                            table.Cell().BorderBottom(0.5f).BorderColor("#E5E7EB").Padding(6).Text($"₹{pricePerGm:N2}/g").FontSize(9);
                            table.Cell().BorderBottom(0.5f).BorderColor("#E5E7EB").Padding(6).AlignRight().Text($"{baseWeightG:F3} g").FontSize(9);
                            table.Cell().BorderBottom(0.5f).BorderColor("#E5E7EB").Padding(6).AlignRight().Text($"₹{baseAmount:N2}").FontSize(9);

                            // Row 2: GST
                            table.Cell().BorderBottom(0.5f).BorderColor("#E5E7EB").Padding(6).Text("GST Charges (3%)").FontSize(9);
                            table.Cell().BorderBottom(0.5f).BorderColor("#E5E7EB").Padding(6).Text("-").FontSize(9);
                            table.Cell().BorderBottom(0.5f).BorderColor("#E5E7EB").Padding(6).AlignRight().Text("-").FontSize(9);
                            table.Cell().BorderBottom(0.5f).BorderColor("#E5E7EB").Padding(6).AlignRight().Text($"₹{gstAmount:N2}").FontSize(9);

                            // Row 3: Loyalty Bonus (Optional, Green)
                            if (tx.BonusGoldMg > 0)
                            {
                                decimal bonusPercent = tx.Invoice?.BonusPercentage ?? 7.5m;
                                table.Cell().BorderBottom(0.5f).BorderColor("#E5E7EB").Padding(6).Text($"Loyalty Bonus ({bonusPercent:F1}%)").FontSize(9).FontColor("#10B981");
                                table.Cell().BorderBottom(0.5f).BorderColor("#E5E7EB").Padding(6).Text("-").FontSize(9).FontColor("#10B981");
                                table.Cell().BorderBottom(0.5f).BorderColor("#E5E7EB").Padding(6).AlignRight().Text($"+ {bonusWeightG:F3} g").FontSize(9).FontColor("#10B981");
                                table.Cell().BorderBottom(0.5f).BorderColor("#E5E7EB").Padding(6).AlignRight().Text($"₹{bonusAmount:N2}").FontSize(9).FontColor("#10B981");
                            }
                        });

                        // Alignment totals
                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn(3); // Description
                                columns.RelativeColumn(2); // Rate / Gram
                                columns.RelativeColumn(2); // Weight
                                columns.RelativeColumn(2); // Amount
                            });

                            table.Cell().PaddingVertical(4).Text("Total Amount Paid:").Bold().FontSize(9.5f).FontColor("#1F2937");
                            table.Cell().PaddingVertical(4).Text("").FontSize(9.5f);
                            table.Cell().PaddingVertical(4).Text("").FontSize(9.5f);
                            table.Cell().PaddingVertical(4).AlignRight().Text($"₹{(tx.TotalAmountPaise / 100.0):N2}").Bold().FontSize(9.5f).FontColor("#1F2937");

                            string totalLabel = isSilver ? "Total Silver Credited to Wallet:" : "Total Gold Credited to Wallet:";
                            table.Cell().PaddingVertical(4).Text(totalLabel).Bold().FontSize(9.5f).FontColor("#1F2937");
                            table.Cell().PaddingVertical(4).Text("").FontSize(9.5f);
                            table.Cell().PaddingVertical(4).AlignRight().Text($"{totalWeightG:F3} g").Bold().FontSize(9.5f).FontColor("#1F2937");
                            table.Cell().PaddingVertical(4).AlignRight().Text("-").FontSize(9.5f).FontColor("#1F2937");
                        });

                        // Disclaimer
                        string disclaimer = isSilver 
                            ? "* Silver credited is subject to the terms and rules of the locked scheme plan."
                            : "* Gold credited is subject to the terms and rules of the locked scheme plan.";
                        col.Item().PaddingTop(10).Text(disclaimer).FontSize(8).Italic().FontColor("#9CA3AF");
                    });

                    // Footer section
                    page.Footer().Column(footer =>
                    {
                        footer.Item().LineHorizontal(0.5f).LineColor("#E5E7EB");
                        footer.Item().PaddingVertical(5).Row(row =>
                        {
                            row.RelativeItem().Column(contactCol =>
                            {
                                contactCol.Item().Text("Aishwaryam Swarna Mahal (Aishwaryam @ your home)").FontSize(7.5f).Bold().FontColor("#4B5563");
                                contactCol.Item().Text("Registered Office: No. 123, Gandhi Road, Chennai, Tamil Nadu - 600001").FontSize(7f).FontColor("#6B7280");
                                contactCol.Item().Text("Support Desk: +91-9876543210 | Email: support@aishwaryamgold.com").FontSize(7f).FontColor("#6B7280");
                            });

                            row.ConstantItem(80).AlignRight().AlignBottom().Text(x =>
                            {
                                x.Span("Page ").FontSize(7.5f).FontColor("#9CA3AF");
                                x.CurrentPageNumber().FontSize(7.5f).FontColor("#9CA3AF");
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
