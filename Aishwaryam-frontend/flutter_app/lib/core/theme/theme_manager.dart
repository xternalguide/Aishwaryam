import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:convert';
import '../network/api_client.dart';

// Represents the dynamic theme configuration fetched from the backend (SDUI)
class SDUIThemeConfig {
  final String themeId;
  final Color primaryColor;
  final Color backgroundColor;
  final String greetingText;

  SDUIThemeConfig({
    required this.themeId,
    required this.primaryColor,
    required this.backgroundColor,
    required this.greetingText,
  });

  factory SDUIThemeConfig.defaultTheme() {
    return SDUIThemeConfig(
      themeId: 'default',
      primaryColor: const Color(0xFFD4AF37), // Classic Gold
      backgroundColor: const Color(0xFFF5F5F5), // Light Background
      greetingText: 'Invest in 24K Digital Gold',
    );
  }

  factory SDUIThemeConfig.fromJson(Map<String, dynamic> json) {
    Color parseColor(String hex) {
      hex = hex.replaceAll('#', '');
      if (hex.length == 6) hex = 'FF$hex';
      return Color(int.parse(hex, radix: 16));
    }

    return SDUIThemeConfig(
      themeId: json['themeId'] ?? 'default',
      primaryColor: parseColor(json['colors']?['primary'] ?? '#D4AF37'),
      backgroundColor: parseColor(json['colors']?['background'] ?? '#F5F5F5'),
      greetingText: json['strings']?['greeting'] ?? 'Invest in Digital Gold',
    );
  }
}

class ThemeNotifier extends Notifier<SDUIThemeConfig> {
  @override
  SDUIThemeConfig build() {
    _fetchDynamicTheme();
    return SDUIThemeConfig.defaultTheme();
  }

  Future<void> _fetchDynamicTheme() async {
    try {
      // In production, this would be an API call: await apiClient.get('/config/theme')
      state = SDUIThemeConfig.defaultTheme();
    } catch (e) {
      // Fallback to default on error
      state = SDUIThemeConfig.defaultTheme();
    }
  }

  ThemeData get themeData {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.light(
        primary: state.primaryColor,
        surface: Colors.white,
      ),
      scaffoldBackgroundColor: state.backgroundColor,
      appBarTheme: AppBarTheme(
        backgroundColor: state.primaryColor,
        foregroundColor: Colors.black, // Dark text on gold app bar
        elevation: 0,
        centerTitle: true,
      ),
      cardColor: Colors.white,
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: state.primaryColor,
          foregroundColor: Colors.black, // Dark text on gold button
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      ),
    );
  }
}

final themeProvider = NotifierProvider<ThemeNotifier, SDUIThemeConfig>(ThemeNotifier.new);
