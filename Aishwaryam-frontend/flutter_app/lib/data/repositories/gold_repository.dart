import 'package:shared_preferences/shared_preferences.dart';
import '../../core/network/api_client.dart';

class GoldRepository {
  final ApiClient _apiClient;

  GoldRepository(this._apiClient);

  Future<Map<String, dynamic>> getLivePrice() async {
    final response = await _apiClient.get('/gold/price');
    return response; // { buyPricePaise, sellPricePaise, updatedAt }
  }

  Future<void> buyGold(int amountPaise) async {
    final prefs = await SharedPreferences.getInstance();
    final userId = prefs.getString('user_id');
    if (userId == null) throw Exception('User not logged in');

    await _apiClient.post('/gold/buy', {
      'userId': userId,
      'totalAmountPaise': amountPaise,
    });
  }

  Future<void> sellGold(int goldWeightMg) async {
    final prefs = await SharedPreferences.getInstance();
    final userId = prefs.getString('user_id');
    if (userId == null) throw Exception('User not logged in');

    await _apiClient.post('/gold/sell', {
      'userId': userId,
      'goldWeightMg': goldWeightMg,
    });
  }
}

final goldRepository = GoldRepository(apiClient);
