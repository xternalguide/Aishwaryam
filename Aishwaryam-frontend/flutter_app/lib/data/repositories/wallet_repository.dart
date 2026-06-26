import 'package:shared_preferences/shared_preferences.dart';
import '../../core/network/api_client.dart';

class WalletRepository {
  final ApiClient _apiClient;

  WalletRepository(this._apiClient);

  Future<int> getBalance() async {
    final prefs = await SharedPreferences.getInstance();
    final userId = prefs.getString('user_id');
    if (userId == null) throw Exception('User not logged in');

    final response = await _apiClient.get('/wallet/$userId/balance');
    return response['balancePaise'] ?? 0;
  }
}

final walletRepository = WalletRepository(apiClient);
