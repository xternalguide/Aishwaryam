import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers/gold_provider.dart';
import '../../core/providers/wallet_provider.dart';
import '../../core/providers/portfolio_provider.dart';
import '../../data/repositories/gold_repository.dart';

class TradingScreen extends ConsumerStatefulWidget {
  final bool isBuying; // true = BUY, false = SELL
  
  const TradingScreen({super.key, required this.isBuying});

  @override
  ConsumerState<TradingScreen> createState() => _TradingScreenState();
}

class _TradingScreenState extends ConsumerState<TradingScreen> {
  final _amountController = TextEditingController();
  bool _isLoading = false;
  double _calculatedGoldMg = 0.0;
  int _currentPricePaise = 0;
  int _currentHoldingsMg = 0;

  @override
  void dispose() {
    _amountController.dispose();
    super.dispose();
  }

  void _recalculateGold(String amountText) {
    if (amountText.isEmpty) {
      setState(() => _calculatedGoldMg = 0.0);
      return;
    }
    final amountInr = double.tryParse(amountText) ?? 0.0;
    final amountPaise = amountInr * 100;
    
    if (_currentPricePaise > 0) {
      final pricePerMg = _currentPricePaise / 1000.0;
      setState(() {
        _calculatedGoldMg = amountPaise / pricePerMg;
      });
    }
  }

  Future<void> _executeTrade() async {
    final amountText = _amountController.text;
    if (amountText.isEmpty) return;
    
    final amountInr = double.tryParse(amountText) ?? 0.0;
    if (amountInr <= 0) return;

    if (!widget.isBuying && _calculatedGoldMg > _currentHoldingsMg) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Insufficient gold balance!'), backgroundColor: Colors.red));
      return;
    }

    setState(() => _isLoading = true);

    try {
      if (widget.isBuying) {
        final amountPaise = (amountInr * 100).toInt();
        await goldRepository.buyGold(amountPaise);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Gold Purchased Successfully!')));
      } else {
        final weightMg = _calculatedGoldMg.toInt();
        await goldRepository.sellGold(weightMg);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Gold Sold Successfully!')));
      }
      
      ref.invalidate(walletBalanceProvider);
      if (mounted) Navigator.pop(context);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: Colors.redAccent));
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final goldPriceAsync = ref.watch(goldPriceProvider);
    final holdingsAsync = ref.watch(goldHoldingsProvider);
    
    _currentHoldingsMg = holdingsAsync.value ?? 0;

    final title = widget.isBuying ? 'Buy 24K Gold' : 'Sell 24K Gold';

    return Scaffold(
      backgroundColor: const Color(0xFFF3F4F6),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
        title: Text(title, style: const TextStyle(color: Colors.black, fontWeight: FontWeight.w800)),
      ),
      body: goldPriceAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: Colors.black)),
        error: (err, stack) => Center(child: Text('Error: $err', style: const TextStyle(color: Colors.red))),
        data: (goldPrice) {
          _currentPricePaise = widget.isBuying ? goldPrice.buyPricePaise : goldPrice.sellPricePaise;
          final priceInrPerGram = _currentPricePaise / 100;

          return Padding(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Live Price Container
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E1E1E),
                    borderRadius: BorderRadius.circular(32),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Live Price (1g)', style: TextStyle(color: Colors.white.withValues(alpha: 0.6), fontSize: 16)),
                      Text(
                        '₹ ${priceInrPerGram.toStringAsFixed(2)}',
                        style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.greenAccent),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),
                
                // Input Amount
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 16),
                  child: Text('Enter Amount (₹)', style: TextStyle(color: Colors.black54, fontWeight: FontWeight.w600)),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: TextField(
                    controller: _amountController,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'^\d+\.?\d{0,2}'))],
                    style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.black),
                    onChanged: _recalculateGold,
                    decoration: const InputDecoration(
                      prefixText: '₹ ',
                      prefixStyle: TextStyle(fontSize: 32, color: Colors.black),
                      border: InputBorder.none,
                    ),
                  ),
                ),
                if (!widget.isBuying) ...[
                  const SizedBox(height: 8),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Text(
                      'Available Balance: ${(_currentHoldingsMg / 1000).toStringAsFixed(4)} gm',
                      style: TextStyle(
                        color: _calculatedGoldMg > _currentHoldingsMg ? Colors.red : Colors.green,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
                const SizedBox(height: 24),
                
                // Calculated Gold
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E1E1E),
                    borderRadius: BorderRadius.circular(32),
                  ),
                  child: Column(
                    children: [
                      Text(widget.isBuying ? 'You will get roughly' : 'You are selling roughly', style: TextStyle(color: Colors.white.withValues(alpha: 0.6))),
                      const SizedBox(height: 8),
                      Text(
                        '${(_calculatedGoldMg / 1000).toStringAsFixed(4)} gm',
                        style: TextStyle(
                          fontSize: 32, 
                          fontWeight: FontWeight.bold, 
                          color: (!widget.isBuying && _calculatedGoldMg > _currentHoldingsMg) ? Colors.red : Colors.white
                        ),
                      ),
                      if (!widget.isBuying && _currentHoldingsMg > 0) ...[
                        const SizedBox(height: 16),
                        Text(
                          'Estimated Value of Total Holdings: ₹${(_currentHoldingsMg * priceInrPerGram / 1000).toStringAsFixed(2)}',
                          style: const TextStyle(color: Colors.greenAccent, fontWeight: FontWeight.w600),
                        ),
                      ]
                    ],
                  ),
                ),
                
                const Spacer(),
                
                // Action Button
                SizedBox(
                  height: 64,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _executeTrade,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.black,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
                    ),
                    child: _isLoading 
                        ? const CircularProgressIndicator(color: Colors.white)
                        : Text('CONFIRM ${widget.isBuying ? 'BUY' : 'SELL'}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, letterSpacing: 1)),
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ),
          );
        },
      ),
    );
  }
}
