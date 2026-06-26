import 'package:shared_preferences/shared_preferences.dart';
import '../../core/network/api_client.dart';

class PortfolioRepository {
  final ApiClient _apiClient;

  PortfolioRepository(this._apiClient);

  Future<int> getGoldHoldings() async {
    final prefs = await SharedPreferences.getInstance();
    final userId = prefs.getString('user_id');
    if (userId == null) throw Exception('User not logged in');

    // In a full production setup, this would be an actual endpoint:
    // final response = await _apiClient.get('/gold/$userId/holdings');
    // return response['goldBalanceMg'];
    
    // For now, we simulate pulling the 15,000 mg holding from the DB
    return 15000; 
  }

  Future<List<Map<String, dynamic>>> getTransactionHistory() async {
    final prefs = await SharedPreferences.getInstance();
    final userId = prefs.getString('user_id');
    if (userId == null) throw Exception('User not logged in');

    // MOCK TRANSACTIONS: In production -> return await _apiClient.get('/transactions/$userId');
    return [
      {
        'id': 'TRX-9001',
        'type': 'BUY_GOLD',
        'amountPaise': 500000, // ₹5000
        'goldWeightMg': 714,
        'date': DateTime.now().subtract(const Duration(days: 1)).toIso8601String(),
        'status': 'SUCCESS'
      },
      {
        'id': 'TRX-8291',
        'type': 'WALLET_DEPOSIT',
        'amountPaise': 1000000, // ₹10000
        'goldWeightMg': 0,
        'date': DateTime.now().subtract(const Duration(days: 2)).toIso8601String(),
        'status': 'SUCCESS'
      },
      {
        'id': 'TRX-7732',
        'type': 'SELL_GOLD',
        'amountPaise': 250000, // ₹2500
        'goldWeightMg': 350,
        'date': DateTime.now().subtract(const Duration(days: 5)).toIso8601String(),
        'status': 'SUCCESS'
      }
    ];
  }
}

final portfolioRepository = PortfolioRepository(apiClient);
