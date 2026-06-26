import 'dart:io';
import 'package:flutter/material.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:path_provider/path_provider.dart';

class TransactionDetailScreen extends StatelessWidget {
  final Map<String, dynamic> tx;

  const TransactionDetailScreen({super.key, required this.tx});

  Future<void> _downloadPdf(BuildContext context) async {
    try {
      final pdf = pw.Document();

      final isBuy = tx['type'] == 'BUY_GOLD';
      final isDeposit = tx['type'] == 'WALLET_DEPOSIT';
      final typeText = isBuy ? 'Gold Purchase' : isDeposit ? 'Wallet Deposit' : 'Gold Sale';
      final amountInr = (tx['amountPaise'] ?? 0) / 100;
      final goldWeightMg = tx['goldWeightMg'] ?? 0;
      final dateStr = tx['date']?.toString() ?? 'N/A';
      
      // Calculate mock GST and base price for demonstration
      final basePrice = amountInr / 1.03; // Assuming 3% GST included in total
      final gstAmount = amountInr - basePrice;

      pdf.addPage(
        pw.Page(
          build: (pw.Context context) {
            return pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Text('Aishwaryam Gold - Receipt', style: pw.TextStyle(fontSize: 24, fontWeight: pw.FontWeight.bold)),
                pw.SizedBox(height: 20),
                pw.Divider(),
                pw.SizedBox(height: 20),
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text('Transaction Type:'),
                    pw.Text(typeText, style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
                  ],
                ),
                pw.SizedBox(height: 10),
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text('Date & Time:'),
                    pw.Text(dateStr),
                  ],
                ),
                pw.SizedBox(height: 10),
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text('Gold Weight:'),
                    pw.Text('${(goldWeightMg / 1000).toStringAsFixed(4)} gm'),
                  ],
                ),
                pw.SizedBox(height: 20),
                pw.Divider(),
                pw.SizedBox(height: 20),
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text('Base Price:'),
                    pw.Text('INR ${basePrice.toStringAsFixed(2)}'),
                  ],
                ),
                pw.SizedBox(height: 10),
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text('GST (3%):'),
                    pw.Text('INR ${gstAmount.toStringAsFixed(2)}'),
                  ],
                ),
                pw.SizedBox(height: 20),
                pw.Divider(),
                pw.SizedBox(height: 10),
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text('Total Amount:', style: pw.TextStyle(fontSize: 18, fontWeight: pw.FontWeight.bold)),
                    pw.Text('INR ${amountInr.toStringAsFixed(2)}', style: pw.TextStyle(fontSize: 18, fontWeight: pw.FontWeight.bold)),
                  ],
                ),
              ],
            );
          },
        ),
      );

      final pdfBytes = await pdf.save();
      
      // Use Printing package to trigger native share/save popup
      await Printing.sharePdf(
        bytes: pdfBytes,
        filename: 'Aishwaryam_Receipt_${DateTime.now().millisecondsSinceEpoch}.pdf',
      );

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Receipt ready! Choose where to save it.'), backgroundColor: Color(0xFF01352A)),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to download PDF: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isBuy = tx['type'] == 'BUY_GOLD';
    final isDeposit = tx['type'] == 'WALLET_DEPOSIT';
    final typeText = isBuy ? 'Gold Purchase' : isDeposit ? 'Wallet Deposit' : 'Gold Sale';
    final color = (isBuy || isDeposit) ? Colors.green : Colors.red;
    
    final amountInr = (tx['amountPaise'] ?? 0) / 100;
    final goldWeightMg = tx['goldWeightMg'] ?? 0;
    final dateStr = tx['date']?.toString() ?? 'N/A';
    
    // Mock calculations for display
    final basePrice = amountInr / 1.03;
    final gstAmount = amountInr - basePrice;
    final goldPricePerGram = (goldWeightMg > 0) ? (basePrice / (goldWeightMg / 1000)) : 0;

    return Scaffold(
      backgroundColor: const Color(0xFFF5F7F5),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
        title: const Text('Transaction Detail', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            // Status Header
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
              ),
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(color: color.withOpacity(0.1), shape: BoxShape.circle),
                    child: Icon(isBuy ? Icons.check_circle : Icons.swap_horiz, color: color, size: 48),
                  ),
                  const SizedBox(height: 16),
                  Text(typeText, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Text(
                    '₹ ${amountInr.toStringAsFixed(2)}',
                    style: TextStyle(fontSize: 36, fontWeight: FontWeight.bold, color: color),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(color: Colors.green.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                    child: const Text('SUCCESSFUL', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 12)),
                  )
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Detailed Breakdown
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
              ),
              child: Column(
                children: [
                  _buildDetailRow('Date & Time', dateStr),
                  const Divider(height: 32),
                  if (goldWeightMg > 0) ...[
                    _buildDetailRow('Gold Weight', '${(goldWeightMg / 1000).toStringAsFixed(4)} gm'),
                    const SizedBox(height: 16),
                    _buildDetailRow('Gold Price (1g)', '₹ ${goldPricePerGram.toStringAsFixed(2)}'),
                    const SizedBox(height: 16),
                  ],
                  _buildDetailRow('Base Value', '₹ ${basePrice.toStringAsFixed(2)}'),
                  const SizedBox(height: 16),
                  _buildDetailRow('GST (3%)', '₹ ${gstAmount.toStringAsFixed(2)}'),
                  const Divider(height: 32),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Total Amount', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      Text('₹ ${amountInr.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                    ],
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 40),
            
            // Download Button
            SizedBox(
              width: double.infinity,
              height: 60,
              child: ElevatedButton.icon(
                onPressed: () => _downloadPdf(context),
                icon: const Icon(Icons.picture_as_pdf, color: Colors.white),
                label: const Text('Download Receipt', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF01352A),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                  elevation: 4,
                ),
              ),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: Colors.black54, fontSize: 14)),
        Text(value, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
      ],
    );
  }
}
