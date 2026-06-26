import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();
  bool _otpSent = false;
  bool _isLocalLoading = false;

  @override
  void dispose() {
    _phoneController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).clearSnackBars();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red[700],
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 5),
      ),
    );
  }

  void _showSuccess(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).clearSnackBars();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.green[700],
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<void> _handleSendOtp() async {
    final phone = _phoneController.text.trim();

    if (phone.isEmpty) {
      _showError('Please enter your mobile number');
      return;
    }
    if (phone.length < 10) {
      _showError('Please enter a valid 10-digit mobile number');
      return;
    }

    setState(() => _isLocalLoading = true);

    try {
      // Format: always send with +91 prefix (strip if already included)
      final cleaned = phone.replaceAll(RegExp(r'\D'), '');
      final formatted = cleaned.startsWith('91') && cleaned.length == 12
          ? '+$cleaned'
          : '+91$cleaned';

      final success = await ref.read(authProvider.notifier).sendOtp(formatted);

      if (success && mounted) {
        setState(() => _otpSent = true);
        _showSuccess('OTP sent! Use 123456 for testing.');
      } else if (mounted) {
        final error = ref.read(authProvider).error ?? 'Failed to send OTP. Check your internet connection.';
        _showError(error);
      }
    } catch (e) {
      _showError('Could not connect to server: $e');
    } finally {
      if (mounted) setState(() => _isLocalLoading = false);
    }
  }

  Future<void> _handleVerifyOtp() async {
    final phone = _phoneController.text.trim();
    final otp = _otpController.text.trim();

    if (otp.isEmpty || otp.length < 6) {
      _showError('Please enter the 6-digit OTP');
      return;
    }

    setState(() => _isLocalLoading = true);

    try {
      final cleaned = phone.replaceAll(RegExp(r'\D'), '');
      final formatted = cleaned.startsWith('91') && cleaned.length == 12
          ? '+$cleaned'
          : '+91$cleaned';

      final success = await ref.read(authProvider.notifier).verifyOtp(formatted, otp);

      if (!success && mounted) {
        final error = ref.read(authProvider).error ?? 'Invalid OTP. Please try again.';
        _showError(error);
        _otpController.clear();
      }
    } catch (e) {
      _showError('Could not connect to server: $e');
    } finally {
      if (mounted) setState(() => _isLocalLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final isLoading = authState.isLoading || _isLocalLoading;

    return Scaffold(
      backgroundColor: const Color(0xFF0D1B14),
      body: SingleChildScrollView(
        child: Container(
          height: MediaQuery.of(context).size.height,
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // App Branding
              Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: const Color(0xFFE8A83A).withValues(alpha: 0.15),
                    ),
                    child: const Icon(Icons.diamond, size: 52, color: Color(0xFFE8A83A)),
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'Aishwaryam Gold',
                    style: TextStyle(
                      fontSize: 30,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.5,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'India\'s Trusted Digital Gold Platform',
                    style: TextStyle(color: Colors.white54, fontSize: 14),
                  ),
                ],
              ),
              const SizedBox(height: 56),

              // Form Card
              Container(
                padding: const EdgeInsets.all(28),
                decoration: BoxDecoration(
                  color: const Color(0xFF1A2B22),
                  borderRadius: BorderRadius.circular(28),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      _otpSent ? 'Enter OTP' : 'Login / Sign up',
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      _otpSent
                          ? 'OTP sent to +91 ${_phoneController.text.trim()}. (Use 123456 for testing)'
                          : 'Enter your 10-digit mobile number',
                      style: const TextStyle(color: Colors.white54, fontSize: 13),
                    ),
                    const SizedBox(height: 28),

                    if (!_otpSent) ...[
                      // Phone number field
                      Container(
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.07),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFE8A83A).withValues(alpha: 0.3)),
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
                              decoration: BoxDecoration(
                                border: Border(right: BorderSide(color: Colors.white.withValues(alpha: 0.1))),
                              ),
                              child: const Text(
                                '+91',
                                style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                              ),
                            ),
                            Expanded(
                              child: TextField(
                                controller: _phoneController,
                                keyboardType: TextInputType.phone,
                                maxLength: 10,
                                style: const TextStyle(color: Colors.white, fontSize: 18, letterSpacing: 2),
                                decoration: const InputDecoration(
                                  hintText: '9876543210',
                                  hintStyle: TextStyle(color: Colors.white24, letterSpacing: 1),
                                  border: InputBorder.none,
                                  counterText: '',
                                  contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 18),
                                ),
                                onSubmitted: (_) => _handleSendOtp(),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
                      SizedBox(
                        height: 56,
                        child: ElevatedButton(
                          onPressed: isLoading ? null : _handleSendOtp,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFE8A83A),
                            foregroundColor: Colors.black,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            elevation: 0,
                          ),
                          child: isLoading
                              ? const SizedBox(
                                  height: 22, width: 22,
                                  child: CircularProgressIndicator(color: Colors.black, strokeWidth: 2.5),
                                )
                              : const Text(
                                  'Send OTP',
                                  style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                                ),
                        ),
                      ),
                    ] else ...[
                      // OTP field
                      TextField(
                        controller: _otpController,
                        keyboardType: TextInputType.number,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 28,
                          letterSpacing: 12,
                          fontWeight: FontWeight.bold,
                        ),
                        maxLength: 6,
                        autofocus: true,
                        decoration: InputDecoration(
                          hintText: '• • • • • •',
                          counterText: '',
                          hintStyle: TextStyle(
                            color: Colors.white.withValues(alpha: 0.2),
                            fontSize: 18,
                            letterSpacing: 8,
                          ),
                          filled: true,
                          fillColor: Colors.white.withValues(alpha: 0.07),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: const BorderSide(color: Colors.white12),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: const BorderSide(color: Colors.white12),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: const BorderSide(color: Color(0xFFE8A83A)),
                          ),
                        ),
                        onChanged: (val) {
                          if (val.length == 6) _handleVerifyOtp();
                        },
                      ),
                      const SizedBox(height: 24),
                      SizedBox(
                        height: 56,
                        child: ElevatedButton(
                          onPressed: isLoading ? null : _handleVerifyOtp,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFE8A83A),
                            foregroundColor: Colors.black,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            elevation: 0,
                          ),
                          child: isLoading
                              ? const SizedBox(
                                  height: 22, width: 22,
                                  child: CircularProgressIndicator(color: Colors.black, strokeWidth: 2.5),
                                )
                              : const Text(
                                  'Verify & Login',
                                  style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                                ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextButton(
                        onPressed: isLoading ? null : () => setState(() {
                          _otpSent = false;
                          _otpController.clear();
                        }),
                        child: const Text(
                          'Change mobile number',
                          style: TextStyle(color: Colors.white38, fontSize: 13),
                        ),
                      ),
                    ],
                  ],
                ),
              ),

              const SizedBox(height: 32),
              const Center(
                child: Text(
                  '🔒  Your data is encrypted & secure',
                  style: TextStyle(color: Colors.white24, fontSize: 12),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
