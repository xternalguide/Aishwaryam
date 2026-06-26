import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/repositories/banking_repository.dart';

final bankAccountsProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  return await bankingRepository.getBankAccounts();
});
