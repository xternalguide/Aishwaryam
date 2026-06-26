import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme/theme_manager.dart';
import 'core/providers/auth_provider.dart';
import 'presentation/screens/login_screen.dart';
import 'presentation/screens/main_wrapper.dart';
import 'presentation/screens/mpin_screen.dart';
import 'presentation/screens/profile_setup_screen.dart';
import 'presentation/screens/mpin_setup_screen.dart';
import 'presentation/screens/kyc_screen.dart';
import 'presentation/screens/bank_setup_screen.dart';

void main() {
  runApp(
    const ProviderScope(
      child: AishwaryamApp(),
    ),
  );
}

class AishwaryamApp extends ConsumerWidget {
  const AishwaryamApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeNotifier = ref.watch(themeProvider.notifier);

    return MaterialApp(
      title: 'Aishwaryam Gold',
      debugShowCheckedModeBanner: false,
      theme: themeNotifier.themeData,
      home: const AuthWrapper(),
      // Named routes for onboarding navigation
      routes: {
        '/setup-profile': (_) => const ProfileSetupScreen(),
        '/setup-mpin': (_) => const MpinSetupScreen(),
        '/setup-kyc': (_) => const KycScreen(isOnboarding: true),
        '/setup-bank': (_) => const BankSetupScreen(),
      },
    );
  }
}

class AuthWrapper extends ConsumerWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Only watch the fields that trigger navigation — NOT isLoading
    final isAuthenticated = ref.watch(authProvider.select((s) => s.isAuthenticated));
    final isNewUser = ref.watch(authProvider.select((s) => s.isNewUser));
    final hasMpin = ref.watch(authProvider.select((s) => s.hasMpin));
    final isMpinVerified = ref.watch(authProvider.select((s) => s.isMpinVerified));

    // ─── NOT LOGGED IN: show login ──────────────────
    if (!isAuthenticated) {
      return const LoginScreen();
    }

    // ─── NEW USER: Onboarding Flow ─────────────────────────────────────────
    if (isNewUser) {
      return const ProfileSetupScreen();
    }

    // ─── EXISTING USER: MPIN Gate ──────────────────────────────────────────
    if (hasMpin && !isMpinVerified) {
      return const MpinScreen(isSetupMode: false);
    }

    // ─── MPIN NOT SET YET ──────────────────────────────────────────────────
    if (!hasMpin) {
      return const MpinSetupScreen();
    }

    // ─── FULLY AUTHENTICATED ───────────────────────────────────────────────
    return const MainWrapper();
  }
}
