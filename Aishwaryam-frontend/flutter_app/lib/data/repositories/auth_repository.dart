import 'package:shared_preferences/shared_preferences.dart';
import '../../core/network/api_client.dart';

class AuthRepository {
  final ApiClient _apiClient;

  AuthRepository(this._apiClient);

  Future<void> sendOtp(String phoneNumber) async {
    await _apiClient.post('/auth/send-otp', {
      'phoneNumber': phoneNumber,
      'ipAddress': 'mobile_app',
    });
  }

  Future<Map<String, dynamic>> verifyOtp(String phoneNumber, String otp) async {
    final response = await _apiClient.post('/auth/verify-otp', {
      'phoneNumber': phoneNumber,
      'otp': otp,
      'deviceFingerprint': 'flutter_mobile_app',
      'ipAddress': 'mobile_app',
    });

    final token = response['token'];
    final userId = response['userId'];

    if (token != null) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('auth_token', token);
      if (userId != null) {
        await prefs.setString('user_id', userId);
      }
    }

    return response;
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }

  Future<bool> isLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token') != null;
  }

  Future<bool> hasMpin() async {
    final prefs = await SharedPreferences.getInstance();
    // Simulate checking if user has MPIN set up. In production, this might come from the login response.
    return prefs.getBool('has_mpin') ?? false;
  }

  Future<void> setMpin(String mpin) async {
    final prefs = await SharedPreferences.getInstance();
    final userId = prefs.getString('user_id');
    if (userId == null) throw Exception('User not logged in');

    await _apiClient.post('/auth/set-mpin', {
      'userId': userId,
      'mpin': mpin,
    });

    await prefs.setBool('has_mpin', true);
  }

  Future<bool> verifyMpin(String mpin) async {
    final prefs = await SharedPreferences.getInstance();
    final userId = prefs.getString('user_id');
    if (userId == null) return false;

    try {
      await _apiClient.post('/auth/verify-mpin', {
        'userId': userId,
        'mpin': mpin,
        'deviceFingerprint': 'flutter_mobile_app',
      });
      return true;
    } catch (e) {
      return false;
    }
  }
}

final authRepository = AuthRepository(apiClient);
