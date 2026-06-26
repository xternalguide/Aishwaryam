import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/network/api_client.dart';

/// Onboarding step 2: Set a 6-digit MPIN and optionally enable fingerprint
class MpinSetupScreen extends ConsumerStatefulWidget {
  const MpinSetupScreen({super.key});

  @override
  ConsumerState<MpinSetupScreen> createState() => _MpinSetupScreenState();
}

class _MpinSetupScreenState extends ConsumerState<MpinSetupScreen> {
  String _mpin = '';
  String _confirmMpin = '';
  bool _isConfirming = false;
  bool _isLoading = false;

  void _onDigit(String d) {
    setState(() {
      if (!_isConfirming && _mpin.length < 6) {
        _mpin += d;
        if (_mpin.length == 6) _isConfirming = true;
      } else if (_isConfirming && _confirmMpin.length < 6) {
        _confirmMpin += d;
        if (_confirmMpin.length == 6) _doSetMpin();
      }
    });
  }

  void _onDelete() {
    setState(() {
      if (_isConfirming && _confirmMpin.isNotEmpty) {
        _confirmMpin = _confirmMpin.substring(0, _confirmMpin.length - 1);
      } else if (_isConfirming && _confirmMpin.isEmpty) {
        _isConfirming = false;
        _mpin = _mpin.substring(0, _mpin.length - 1);
      } else if (!_isConfirming && _mpin.isNotEmpty) {
        _mpin = _mpin.substring(0, _mpin.length - 1);
      }
    });
  }

  Future<void> _doSetMpin() async {
    if (_mpin != _confirmMpin) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('MPINs do not match. Try again.'), backgroundColor: Colors.red),
      );
      setState(() { _mpin = ''; _confirmMpin = ''; _isConfirming = false; });
      return;
    }
    setState(() => _isLoading = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final userId = prefs.getString('user_id');
      if (userId == null) throw Exception('Session expired. Please login again.');

      // Call API directly — do NOT update authProvider state here.
      // If we did, AuthWrapper would see hasMpin=true and immediately
      // redirect to MainWrapper, breaking the onboarding named-route flow.
      await apiClient.post('/auth/set-mpin', {
        'userId': userId,
        'mpin': _mpin,
      });
      await prefs.setBool('has_mpin', true);

      if (mounted) {
        Navigator.of(context).pushReplacementNamed('/setup-kyc');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
        setState(() { _mpin = ''; _confirmMpin = ''; _isConfirming = false; _isLoading = false; });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final currentPin = _isConfirming ? _confirmMpin : _mpin;

    return Scaffold(
      backgroundColor: const Color(0xFF0D1B14),
      body: SafeArea(
        child: Column(
          children: [
            const SizedBox(height: 16),
            // Progress
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Row(
                children: List.generate(4, (i) => Expanded(
                  child: Container(
                    height: 4,
                    margin: const EdgeInsets.only(right: 4),
                    decoration: BoxDecoration(
                      color: i <= 1 ? const Color(0xFFE8A83A) : Colors.white12,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                )),
              ),
            ),
            const SizedBox(height: 48),
            const Icon(Icons.lock_outline, size: 56, color: Color(0xFFE8A83A)),
            const SizedBox(height: 24),
            Text(
              _isConfirming ? 'Confirm MPIN' : 'Set your 6-digit MPIN',
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: Colors.white),
            ),
            const SizedBox(height: 8),
            Text(
              _isConfirming
                  ? 'Re-enter the same MPIN to confirm'
                  : 'Step 2 of 4 · You\'ll use this every time you open the app',
              style: const TextStyle(color: Colors.white54, fontSize: 14),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 48),

            // Pin dots
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(6, (i) {
                final filled = i < currentPin.length;
                return Container(
                  margin: const EdgeInsets.symmetric(horizontal: 8),
                  width: 20,
                  height: 20,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: filled ? const Color(0xFFE8A83A) : Colors.white12,
                    border: filled ? null : Border.all(color: Colors.white30, width: 1.5),
                  ),
                );
              }),
            ),
            const Spacer(),

            // Numpad
            if (!_isLoading) ...[
              _buildNumpad(),
              const SizedBox(height: 32),
            ] else ...[
              const CircularProgressIndicator(color: Color(0xFFE8A83A)),
              const SizedBox(height: 32),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildNumpad() {
    final keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 40),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 3,
          childAspectRatio: 1.8,
        ),
        itemCount: 12,
        itemBuilder: (_, i) {
          final k = keys[i];
          if (k.isEmpty) return const SizedBox();
          if (k == '⌫') {
            return GestureDetector(
              onTap: _onDelete,
              child: Container(
                margin: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.white10,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Center(
                  child: Icon(Icons.backspace_outlined, color: Colors.white70, size: 22),
                ),
              ),
            );
          }
          return GestureDetector(
            onTap: () => _onDigit(k),
            child: Container(
              margin: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: Colors.white10,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Center(
                child: Text(
                  k,
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
