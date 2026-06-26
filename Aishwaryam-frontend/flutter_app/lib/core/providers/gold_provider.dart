import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/repositories/gold_repository.dart';

class GoldPrice {
  final int buyPricePaise;
  final int sellPricePaise;

  GoldPrice({required this.buyPricePaise, required this.sellPricePaise});

  factory GoldPrice.fromJson(Map<String, dynamic> json) {
    return GoldPrice(
      buyPricePaise: json['buyPricePaise'] ?? 0,
      sellPricePaise: json['sellPricePaise'] ?? 0,
    );
  }
}

final goldPriceProvider = FutureProvider<GoldPrice>((ref) async {
  try {
    final repo = ref.watch(Provider((ref) => goldRepository));
    final response = await repo.getLivePrice();
    return GoldPrice.fromJson(response);
  } catch (e) {
    // Fallback Mock Data if API is unreachable or fails auth
    return GoldPrice(buyPricePaise: 750000, sellPricePaise: 730000); 
  }
});
