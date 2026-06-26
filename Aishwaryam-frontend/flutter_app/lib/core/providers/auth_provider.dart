import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/repositories/auth_repository.dart';

// Provides the repository
final authRepositoryProvider = Provider((ref) => authRepository);

// Represents the state of authentication
class AuthState {
  final bool isLoading;
  final bool isAuthenticated;
  final bool hasMpin;
  final bool isMpinVerified;
  final bool isNewUser;
  final String? error;
  final String? userId;

  AuthState({
    this.isLoading = false,
    this.isAuthenticated = false,
    this.hasMpin = false,
    this.isMpinVerified = false,
    this.isNewUser = false,
    this.error,
    this.userId,
  });

  AuthState copyWith({
    bool? isLoading,
    bool? isAuthenticated,
    bool? hasMpin,
    bool? isMpinVerified,
    bool? isNewUser,
    String? error,
    String? userId,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      hasMpin: hasMpin ?? this.hasMpin,
      isMpinVerified: isMpinVerified ?? this.isMpinVerified,
      isNewUser: isNewUser ?? this.isNewUser,
      error: error,
      userId: userId ?? this.userId,
    );
  }
}

class AuthNotifier extends Notifier<AuthState> {
  late AuthRepository _repository;

  @override
  AuthState build() {
    _repository = ref.watch(authRepositoryProvider);
    _checkLoginStatus();
    return AuthState();
  }

  Future<void> _checkLoginStatus() async {
    final isLoggedIn = await _repository.isLoggedIn();
    final hasMpin = await _repository.hasMpin();
    state = AuthState(
      isAuthenticated: isLoggedIn,
      hasMpin: hasMpin,
      isMpinVerified: false, // Must verify on every app open
    );
  }

  Future<bool> sendOtp(String phoneNumber) async {
    state = state.copyWith(isLoading: true);
    try {
      await _repository.sendOtp(phoneNumber);
      state = state.copyWith(isLoading: false);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<bool> verifyOtp(String phoneNumber, String otp) async {
    state = state.copyWith(isLoading: true);
    try {
      final response = await _repository.verifyOtp(phoneNumber, otp);
      final hasMpin = await _repository.hasMpin();
      final isNewUser = response['isNewUser'] == true;
      final userId = response['userId']?.toString();
      state = state.copyWith(
        isLoading: false,
        isAuthenticated: true,
        hasMpin: hasMpin,
        isNewUser: isNewUser,
        isMpinVerified: !hasMpin && !isNewUser,
        userId: userId,
      );
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<bool> setMpin(String mpin) async {
    state = state.copyWith(isLoading: true);
    try {
      await _repository.setMpin(mpin);
      state = state.copyWith(
        isLoading: false,
        hasMpin: true,
        isMpinVerified: true,
      );
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<bool> verifyMpin(String mpin) async {
    state = state.copyWith(isLoading: true);
    try {
      final isValid = await _repository.verifyMpin(mpin);
      if (isValid) {
        state = state.copyWith(isLoading: false, isMpinVerified: true);
        return true;
      } else {
        state = state.copyWith(isLoading: false, error: 'Invalid MPIN');
        return false;
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  void verifyBiometric() {
    state = state.copyWith(isMpinVerified: true);
  }

  void markOnboardingComplete() {
    // Called after all onboarding steps are done.
    // Set isMpinVerified: true so they enter the dashboard immediately.
    // On next app restart, _checkLoginStatus() will set it back to false.
    state = state.copyWith(isNewUser: false, hasMpin: true, isMpinVerified: true);
  }

  Future<void> logout() async {
    await _repository.logout();
    state = AuthState();
  }
}

final authProvider = NotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);
