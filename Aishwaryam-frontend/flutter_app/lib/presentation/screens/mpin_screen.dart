import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers/auth_provider.dart';
import 'package:local_auth/local_auth.dart';
import 'dart:math';

class MpinScreen extends ConsumerStatefulWidget {
  final bool isSetupMode;
  
  const MpinScreen({super.key, required this.isSetupMode});

  @override
  ConsumerState<MpinScreen> createState() => _MpinScreenState();
}

class _MpinScreenState extends ConsumerState<MpinScreen> {
  String _mpin = '';
  String _confirmMpin = '';
  bool _isConfirming = false;
  final LocalAuthentication _localAuth = LocalAuthentication();

  @override
  void initState() {
    super.initState();
    if (!widget.isSetupMode) {
      _checkBiometric();
    }
  }

  Future<void> _checkBiometric() async {
    try {
      final canCheckBiometrics = await _localAuth.canCheckBiometrics;
      final isDeviceSupported = await _localAuth.isDeviceSupported();
      
      if (canCheckBiometrics || isDeviceSupported) {
        final didAuthenticate = await _localAuth.authenticate(
          localizedReason: 'Please authenticate to securely access your Digital Gold',
          // Depending on the exact cached local_auth version, sometimes options is flattened or requires different imports.
          // Let's pass the parameters directly or fall back to defaults if it's complaining about 'options'.
        );
        
        if (didAuthenticate && mounted) {
          // Tell AuthNotifier that biometric succeeded, bypass MPIN
          ref.read(authProvider.notifier).verifyBiometric();
        }
      }
    } catch (e) {
      // Biometrics failed or not set up, user will fall back to typing MPIN
    }
  }

  void _onDigitPress(String digit) {
    setState(() {
      if (!_isConfirming && _mpin.length < 6) {
        _mpin += digit;
        if (_mpin.length == 6 && !widget.isSetupMode) {
          _verifyMpin();
        } else if (_mpin.length == 6 && widget.isSetupMode) {
          _isConfirming = true;
        }
      } else if (_isConfirming && _confirmMpin.length < 6) {
        _confirmMpin += digit;
        if (_confirmMpin.length == 6) {
          _setupMpin();
        }
      }
    });
  }

  void _onDeletePress() {
    setState(() {
      if (_isConfirming && _confirmMpin.isNotEmpty) {
        _confirmMpin = _confirmMpin.substring(0, _confirmMpin.length - 1);
      } else if (!_isConfirming && _mpin.isNotEmpty) {
        _mpin = _mpin.substring(0, _mpin.length - 1);
      } else if (_isConfirming && _confirmMpin.isEmpty) {
        _isConfirming = false;
        _mpin = _mpin.substring(0, _mpin.length - 1);
      }
    });
  }

  Future<void> _verifyMpin() async {
    final success = await ref.read(authProvider.notifier).verifyMpin(_mpin);
    if (!success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Invalid MPIN'), backgroundColor: Colors.red),
      );
      setState(() => _mpin = '');
    }
  }

  Future<void> _setupMpin() async {
    if (_mpin != _confirmMpin) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('MPINs do not match'), backgroundColor: Colors.red),
      );
      setState(() {
        _mpin = '';
        _confirmMpin = '';
        _isConfirming = false;
      });
      return;
    }
    
    final success = await ref.read(authProvider.notifier).setMpin(_mpin);
    if (!success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to set MPIN'), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final String title = widget.isSetupMode 
        ? (_isConfirming ? 'Confirm MPIN' : 'Set 6-digit MPIN')
        : 'Enter MPIN';
    final String currentInput = _isConfirming ? _confirmMpin : _mpin;

    return Scaffold(
      backgroundColor: const Color(0xFF1E1E1E),
      body: SafeArea(
        child: Column(
          children: [
            const SizedBox(height: 60),
            const Icon(Icons.lock_outline, size: 60, color: Colors.white),
            const SizedBox(height: 20),
            Text(
              title,
              style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            Text(
              'Secure your Aishwaryam Gold account',
              style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 14),
            ),
            const SizedBox(height: 40),
            
            // PIN Dots
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(6, (index) {
                final isFilled = index < currentInput.length;
                return Container(
                  margin: const EdgeInsets.symmetric(horizontal: 10),
                  width: 16,
                  height: 16,
                  decoration: BoxDecoration(
                    color: isFilled ? Colors.white : Colors.white.withOpacity(0.2),
                    shape: BoxShape.circle,
                  ),
                );
              }),
            ),
            
            if (authState.error != null) ...[
              const SizedBox(height: 20),
              Text(authState.error!, style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
            ],
            
            const Spacer(),
            
            // Number Pad
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
              decoration: const BoxDecoration(
                color: Color(0xFF131A22),
                borderRadius: BorderRadius.only(topLeft: Radius.circular(32), topRight: Radius.circular(32)),
              ),
              child: Column(
                children: [
                  for (var i = 0; i < 3; i++)
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        for (var j = 1; j <= 3; j++)
                          _buildNumPadBtn((i * 3 + j).toString()),
                      ],
                    ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      _buildNumPadBtn(widget.isSetupMode ? '' : 'FINGERPRINT', isFingerprint: !widget.isSetupMode),
                      _buildNumPadBtn('0'),
                      _buildNumPadBtn('DEL', isDelete: true),
                    ],
                  ),
                  if (widget.isSetupMode && !authState.isAuthenticated) ...[
                     const SizedBox(height: 20),
                     TextButton(
                       onPressed: () => ref.read(authProvider.notifier).logout(),
                       child: const Text('Cancel & Logout', style: TextStyle(color: Colors.red)),
                     ),
                  ]
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNumPadBtn(String label, {bool isDelete = false, bool isFingerprint = false}) {
    if (label.isEmpty) return const SizedBox(width: 80, height: 80);
    
    return InkWell(
      onTap: isDelete ? _onDeletePress : isFingerprint ? _checkBiometric : () => _onDigitPress(label),
      customBorder: const CircleBorder(),
      child: Container(
        width: 80,
        height: 80,
        alignment: Alignment.center,
        child: isDelete
            ? const Icon(Icons.backspace_outlined, color: Colors.white, size: 28)
            : isFingerprint
                ? const Icon(Icons.fingerprint, color: Colors.white, size: 36)
                : Text(label, style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w500)),
      ),
    );
  }
}
