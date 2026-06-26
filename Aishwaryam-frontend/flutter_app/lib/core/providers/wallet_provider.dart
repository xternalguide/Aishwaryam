import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/repositories/wallet_repository.dart';

final walletBalanceProvider = FutureProvider<int>((ref) async {
  final repo = ref.watch(Provider((ref) => walletRepository));
  return await repo.getBalance();
});
