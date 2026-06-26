import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../network/api_client.dart';
import 'auth_provider.dart';

// Represents the dynamic config from the DB
class AppConfig {
  final String supportEmail;
  final String supportPhone;
  final String termsUrl;
  final String privacyUrl;
  final List<dynamic> faqList;
  final String referralBonusMsg;
  final String primaryColorHex;
  final String secondaryColorHex;
  final String festivalBannerUrl;
  final bool isReferralEnabled;
  final bool isAutoSaveEnabled;

  AppConfig({
    required this.supportEmail,
    required this.supportPhone,
    required this.termsUrl,
    required this.privacyUrl,
    required this.faqList,
    required this.referralBonusMsg,
    required this.primaryColorHex,
    required this.secondaryColorHex,
    required this.festivalBannerUrl,
    required this.isReferralEnabled,
    required this.isAutoSaveEnabled,
  });

  factory AppConfig.fromJson(Map<String, dynamic> json) {
    return AppConfig(
      supportEmail: json['supportEmail'] ?? 'support@aishwaryamgold.com',
      supportPhone: json['supportPhone'] ?? '+91-9876543210',
      termsUrl: json['termsAndConditionsUrl'] ?? 'https://aishwaryamgold.com/terms',
      privacyUrl: json['privacyPolicyUrl'] ?? 'https://aishwaryamgold.com/privacy',
      faqList: json['faqJson'] != null && json['faqJson'] is String ? jsonDecode(json['faqJson']) : (json['faqJson'] ?? []),
      referralBonusMsg: json['referralBonusMsg'] ?? 'Invite friends and earn gold!',
      primaryColorHex: json['primaryColorHex'] ?? '#01211A',
      secondaryColorHex: json['secondaryColorHex'] ?? '#E8A83A',
      festivalBannerUrl: json['festivalBannerUrl'] ?? 'https://images.unsplash.com/photo-1610652492500-ded49ceeb378?auto=format&fit=crop&q=80&w=800',
      isReferralEnabled: json['isReferralEnabled'] ?? true,
      isAutoSaveEnabled: json['isAutoSaveEnabled'] ?? true,
    );
  }
}

// Represents the User Profile from DB
class UserProfile {
  final String fullName;
  final String phoneNumber;
  final String email;
  final String kycLevel;
  final bool biometricEnabled;
  final String referralCode;

  UserProfile({
    required this.fullName,
    required this.phoneNumber,
    required this.email,
    required this.kycLevel,
    required this.biometricEnabled,
    required this.referralCode,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      fullName: json['fullName'] ?? 'Guest User',
      phoneNumber: json['phoneNumber'] ?? '',
      email: json['email'] ?? '',
      kycLevel: json['kycLevel'] ?? 'BASIC',
      biometricEnabled: json['biometricEnabled'] ?? false,
      referralCode: json['referralCode'] ?? 'AISHWARYAM100',
    );
  }
}

final appConfigProvider = FutureProvider<AppConfig>((ref) async {
  try {
    final response = await apiClient.get('/user/config');
    return AppConfig.fromJson(response);
  } catch (e) {
    print('Failed to fetch config from backend: $e');
  }
  // Fallback to defaults if backend is unavailable during dev
  return AppConfig(
    supportEmail: 'support@aishwaryamgold.com',
    supportPhone: '+91-9876543210',
    termsUrl: 'https://aishwaryamgold.com/terms',
    privacyUrl: 'https://aishwaryamgold.com/privacy',
    faqList: [
      {"q": "How do I buy Digital Gold?", "a": "Go to the Market tab and click Buy Gold. You can buy for as little as ₹10."},
      {"q": "Is my gold safe?", "a": "Yes! All digital gold is backed by physical 24K 99.9% pure gold stored in highly secure vaults."}
    ],
    referralBonusMsg: 'Invite friends and earn 1mg of 24K Gold!',
    primaryColorHex: '#01211A',
    secondaryColorHex: '#E8A83A',
    festivalBannerUrl: 'https://images.unsplash.com/photo-1610652492500-ded49ceeb378?auto=format&fit=crop&q=80&w=800',
    isReferralEnabled: true,
    isAutoSaveEnabled: true,
  );
});

final userProfileProvider = FutureProvider<UserProfile>((ref) async {
  final authState = ref.watch(authProvider);
  if (!authState.isAuthenticated || authState.userId == null) {
    throw Exception('User not logged in');
  }

  try {
    final response = await apiClient.get('/user/profile/${authState.userId}');
    return UserProfile.fromJson(response);
  } catch (e) {
    print('Failed to fetch profile: $e');
  }
  // Fallback for dev if backend isn't running
  return UserProfile(
    fullName: 'John Doe',
    phoneNumber: '+91 9876543210',
    email: 'johndoe@example.com',
    kycLevel: 'VERIFIED',
    biometricEnabled: true,
    referralCode: 'GOLDEN2026',
  );
});
