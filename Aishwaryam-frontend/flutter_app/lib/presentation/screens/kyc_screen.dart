import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/repositories/kyc_repository.dart';

/// Used both as onboarding step 3 AND as a standalone KYC update screen.
/// [isOnboarding] determines whether Skip leads to next onboarding step.
class KycScreen extends ConsumerStatefulWidget {
  final bool isOnboarding;
  const KycScreen({super.key, this.isOnboarding = false});

  @override
  ConsumerState<KycScreen> createState() => _KycScreenState();
}

class _KycScreenState extends ConsumerState<KycScreen> {
  final _documentUrlController = TextEditingController();
  String _selectedDocType = 'PAN';
  bool _isLoading = false;

  @override
  void dispose() {
    _documentUrlController.dispose();
    super.dispose();
  }

  void _skip() {
    if (widget.isOnboarding) {
      Navigator.of(context).pushReplacementNamed('/setup-bank');
    } else {
      Navigator.pop(context);
    }
  }

  Future<void> _submitKyc() async {
    final docUrl = _documentUrlController.text.trim();
    if (docUrl.isEmpty) return;

    setState(() => _isLoading = true);

    try {
      await kycRepository.submitKycDocument(documentType: _selectedDocType, documentUrl: docUrl);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('KYC submitted! Our team will verify within 24 hours.'), backgroundColor: Colors.green),
        );
        if (widget.isOnboarding) {
          Navigator.of(context).pushReplacementNamed('/setup-bank');
        } else {
          Navigator.pop(context);
        }
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: Colors.red));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D1B14),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 16),
              if (widget.isOnboarding)
                Row(
                  children: [
                    ...List.generate(4, (i) => Expanded(
                      child: Container(
                        height: 4,
                        margin: const EdgeInsets.only(right: 4),
                        decoration: BoxDecoration(
                          color: i <= 2 ? const Color(0xFFE8A83A) : Colors.white12,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    )),
                  ],
                ),
              const SizedBox(height: 32),

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'KYC\nVerification',
                    style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Colors.white, height: 1.2),
                  ),
                  TextButton(
                    onPressed: _skip,
                    child: const Text('Skip for now', style: TextStyle(color: Colors.white54, fontSize: 14)),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                widget.isOnboarding
                    ? 'Step 3 of 4 · Unlock higher limits by completing KYC'
                    : 'Upload your document to upgrade your KYC level',
                style: const TextStyle(color: Colors.white54, fontSize: 14),
              ),
              const SizedBox(height: 32),

              // KYC Benefits Banner
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: const Color(0xFFE8A83A).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFE8A83A).withValues(alpha: 0.3)),
                ),
                child: const Column(
                  children: [
                    _BenefitRow(icon: Icons.shield_outlined, text: 'Buy gold up to ₹10 Lakh/year'),
                    SizedBox(height: 12),
                    _BenefitRow(icon: Icons.account_balance, text: 'Withdraw funds to your bank'),
                    SizedBox(height: 12),
                    _BenefitRow(icon: Icons.verified_outlined, text: 'Legally compliant account'),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // Document Type Selector
              const Text('Document Type', style: TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w600)),
              const SizedBox(height: 10),
              Row(
                children: ['PAN', 'AADHAAR'].map((type) {
                  final selected = _selectedDocType == type || _selectedDocType == 'AADHAAR_FRONT' && type == 'AADHAAR';
                  return GestureDetector(
                    onTap: () => setState(() => _selectedDocType = type == 'AADHAAR' ? 'AADHAAR_FRONT' : type),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      margin: const EdgeInsets.only(right: 12),
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                      decoration: BoxDecoration(
                        color: selected ? const Color(0xFFE8A83A) : Colors.white10,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        type,
                        style: TextStyle(
                          color: selected ? Colors.black : Colors.white70,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 20),

              // URL / Mock upload
              const Text('Document URL', style: TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              TextField(
                controller: _documentUrlController,
                style: const TextStyle(color: Colors.white, fontSize: 16),
                decoration: InputDecoration(
                  hintText: 'https://your-hosted-doc-link.com/pan.jpg',
                  hintStyle: const TextStyle(color: Colors.white38),
                  prefixIcon: const Icon(Icons.link, color: Color(0xFFE8A83A), size: 20),
                  filled: true,
                  fillColor: Colors.white.withValues(alpha: 0.07),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Colors.white12)),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Colors.white12)),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Color(0xFFE8A83A))),
                ),
              ),
              const SizedBox(height: 32),
              const Text(
                '🔒  Documents are encrypted end-to-end and used only for SEBI compliance',
                style: TextStyle(color: Colors.white38, fontSize: 12),
              ),
              const SizedBox(height: 40),

              SizedBox(
                width: double.infinity,
                height: 60,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _submitKyc,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFE8A83A),
                    foregroundColor: Colors.black,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                    elevation: 0,
                  ),
                  child: _isLoading
                      ? const CircularProgressIndicator(color: Colors.black)
                      : const Text('Submit Securely', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BenefitRow extends StatelessWidget {
  final IconData icon;
  final String text;
  const _BenefitRow({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) => Row(
    children: [
      Icon(icon, color: const Color(0xFFE8A83A), size: 20),
      const SizedBox(width: 12),
      Text(text, style: const TextStyle(color: Colors.white, fontSize: 14)),
    ],
  );
}
