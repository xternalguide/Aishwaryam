import 'package:shared_preferences/shared_preferences.dart';
import '../../core/network/api_client.dart';

class BankingRepository {
  final ApiClient _apiClient;

  BankingRepository(this._apiClient);

  Future<void> addBankAccount({
    required String accountNumber,
    required String ifscCode,
    required String bankName,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    final userId = prefs.getString('user_id');
    if (userId == null) throw Exception('User not logged in');

    await _apiClient.post('/banking/add-account', {
      'userId': userId,
      'accountNumber': accountNumber,
      'ifscCode': ifscCode,
      'bankName': bankName,
    });
  }

  Future<void> requestWithdrawal({
    required String bankAccountId,
    required int amountPaise,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    final userId = prefs.getString('user_id');
    if (userId == null) throw Exception('User not logged in');

    // Assuming endpoint exists for withdrawal (we will add it in the backend if not fully defined yet)
    await _apiClient.post('/banking/withdraw', {
      'userId': userId,
      'bankAccountId': bankAccountId,
      'amountPaise': amountPaise,
    });
  }
  Future<List<Map<String, dynamic>>> getBankAccounts() async {
    final prefs = await SharedPreferences.getInstance();
    final userId = prefs.getString('user_id');
    if (userId == null) throw Exception('User not logged in');

    final response = await _apiClient.get('/banking/accounts/$userId');
    if (response is List) {
      return List<Map<String, dynamic>>.from(response);
    }
    return [];
  }
}

final bankingRepository = BankingRepository(apiClient);
