import 'package:shared_preferences/shared_preferences.dart';
import '../../core/network/api_client.dart';

class KycRepository {
  final ApiClient _apiClient;

  KycRepository(this._apiClient);

  Future<void> submitKycDocument({
    required String documentType,
    required String documentUrl,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    final userId = prefs.getString('user_id');
    if (userId == null) throw Exception('User not logged in');

    await _apiClient.post('/kyc/submit', {
      'userId': userId,
      'documentType': documentType,
      'documentUrl': documentUrl,
    });
  }
}

final kycRepository = KycRepository(apiClient);
