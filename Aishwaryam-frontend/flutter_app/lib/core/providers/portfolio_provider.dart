import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/repositories/portfolio_repository.dart';

final goldHoldingsProvider = FutureProvider<int>((ref) async {
  final repo = ref.watch(Provider((ref) => portfolioRepository));
  return await repo.getGoldHoldings();
});

final transactionHistoryProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final repo = ref.watch(Provider((ref) => portfolioRepository));
  return await repo.getTransactionHistory();
});
