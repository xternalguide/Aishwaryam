import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers/portfolio_provider.dart';
import '../../core/providers/gold_provider.dart';
import '../../core/theme/theme_manager.dart';
import 'trading_screen.dart';
import 'banking_screen.dart';

class PortfolioScreen extends ConsumerWidget {
  const PortfolioScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeConfig = ref.watch(themeProvider);
    final holdingsAsync = ref.watch(goldHoldingsProvider);
    final goldPriceAsync = ref.watch(goldPriceProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF5F7F5),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
        title: const Text('Portfolio', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
      ),
      body: RefreshIndicator(
        color: const Color(0xFF01352A),
        onRefresh: () async {
          ref.invalidate(goldHoldingsProvider);
          ref.invalidate(goldPriceProvider);
          ref.invalidate(transactionHistoryProvider);
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.only(bottom: 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // TOP GRAPH SECTION (Light Background)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Live Price', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 12)),
                    const SizedBox(height: 4),
                    goldPriceAsync.when(
                      data: (price) => Text(
                        '₹ ${(price.buyPricePaise / 100).toStringAsFixed(2)}/gm',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 24, color: Colors.black),
                      ),
                      loading: () => const Text('Loading...', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 24)),
                      error: (_, __) => const Text('Error', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 24)),
                    ),
                    const SizedBox(height: 24),
                    // Multi-line dummy graph
                    SizedBox(
                      height: 120,
                      child: CustomPaint(
                        size: const Size(double.infinity, 120),
                        painter: _PortfolioGraphPainter(),
                      ),
                    ),
                    const SizedBox(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.circle, color: Color(0xFF01352A), size: 10),
                        const SizedBox(width: 8),
                        const Text('Owned Gold Value', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                        const SizedBox(width: 16),
                        Container(height: 10, width: 1, color: Colors.grey),
                        const SizedBox(width: 16),
                        const Icon(Icons.circle, color: Color(0xFFE8A83A), size: 10),
                        const SizedBox(width: 8),
                        const Text('Current Gold Value', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // DARK GREEN BOTTOM SECTION
              Container(
                decoration: const BoxDecoration(
                  color: Color(0xFF01211A),
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(40),
                    topRight: Radius.circular(40),
                  ),
                ),
                padding: const EdgeInsets.only(top: 32, left: 24, right: 24, bottom: 120),
                child: Column(
                  children: [
                    // PORTFOLIO SUMMARY CARD
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Current Portfolio Value', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(color: Colors.teal.withOpacity(0.2), borderRadius: BorderRadius.circular(12)),
                                child: const Text('+5%', style: TextStyle(color: Colors.teal, fontWeight: FontWeight.bold, fontSize: 10)),
                              )
                            ],
                          ),
                          const SizedBox(height: 8),
                          goldPriceAsync.when(
                            data: (price) {
                              final currentHoldingsMg = holdingsAsync.value ?? 0;
                              final currentValuePaise = currentHoldingsMg * (price.sellPricePaise / 1000);
                              return Text('₹ ${(currentValuePaise / 100).toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 16));
                            },
                            loading: () => const Text('Loading...'),
                            error: (_, __) => const Text('Error'),
                          ),
                          const SizedBox(height: 16),
                          Divider(color: Colors.grey[300]),
                          const SizedBox(height: 16),
                          
                          const Text('Total Holdings', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                          const SizedBox(height: 8),
                          holdingsAsync.when(
                            data: (mg) => Text('${(mg / 1000).toStringAsFixed(4)} gm', style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 16)),
                            loading: () => const Text('Loading...'),
                            error: (_, __) => const Text('Error'),
                          ),
                          const SizedBox(height: 16),
                          Divider(color: Colors.grey[300]),
                          const SizedBox(height: 16),

                          const Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Total Investment', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                              Icon(Icons.info, color: Colors.grey, size: 16),
                            ],
                          ),
                          const SizedBox(height: 8),
                          const Text('₹ 97,563.25', style: TextStyle(fontWeight: FontWeight.w500, fontSize: 16)), // Hardcoded for design replica
                          
                          const SizedBox(height: 24),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: ElevatedButton.icon(
                                  onPressed: () {
                                    Navigator.push(context, MaterialPageRoute(builder: (_) => const TradingScreen(isBuying: true)));
                                  },
                                  icon: const Text('₹', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                                  label: const Text('Invest', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF01352A),
                                    padding: const EdgeInsets.symmetric(vertical: 16),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                                    elevation: 0,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: OutlinedButton.icon(
                                  onPressed: () {
                                    Navigator.push(context, MaterialPageRoute(builder: (_) => const BankingScreen()));
                                  },
                                  icon: const Icon(Icons.account_balance_wallet, color: Color(0xFF01352A), size: 16),
                                  label: const Text('Withdraw', style: TextStyle(color: Color(0xFF01352A), fontWeight: FontWeight.bold, fontSize: 16)),
                                  style: OutlinedButton.styleFrom(
                                    backgroundColor: Colors.white,
                                    side: const BorderSide(color: Color(0xFF01352A), width: 1.5),
                                    padding: const EdgeInsets.symmetric(vertical: 16),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                                  ),
                                ),
                              ),
                            ],
                          )
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Divider Line
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20.0),
                      child: Divider(color: Colors.white.withOpacity(0.1)),
                    ),
                    const SizedBox(height: 16),

                    // VIEW TRANSACTIONS BUTTON
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.receipt_long, color: Colors.black, size: 24),
                              SizedBox(width: 12),
                              Text('View Transactions', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.black)),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            decoration: BoxDecoration(color: const Color(0xFF01211A), borderRadius: BorderRadius.circular(16)),
                            child: const Text('View', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                          )
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // REFER & EARN
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Refer & Earn', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 18)),
                                  Text('Share our app with your friend and earn rewards', style: TextStyle(color: Colors.black54, fontSize: 10)),
                                ],
                              ),
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF01352A),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Icon(Icons.card_giftcard, color: Color(0xFFE8A83A), size: 24),
                              )
                            ],
                          ),
                          const SizedBox(height: 20),
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            decoration: BoxDecoration(
                              color: const Color(0xFF01211A),
                              borderRadius: BorderRadius.circular(24),
                            ),
                            child: const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text('Refer now', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                                SizedBox(width: 8),
                                Icon(Icons.arrow_forward, color: Colors.white, size: 20),
                              ],
                            ),
                          )
                        ],
                      ),
                    ),

                    const SizedBox(height: 40),
                    // Watermark
                    Center(
                      child: Column(
                        children: [
                          Text('Aishwaryam', style: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 36, fontWeight: FontWeight.w900, letterSpacing: -1)),
                          Text('@ your home', style: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 16, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PortfolioGraphPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final gridPaint = Paint()
      ..color = Colors.grey.withOpacity(0.3)
      ..strokeWidth = 1
      ..style = PaintingStyle.stroke;
    
    for (int i = 0; i <= 4; i++) {
      double y = size.height * (i / 4);
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }

    final ownedPaint = Paint()
      ..color = const Color(0xFF01352A)
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;

    final currentPaint = Paint()
      ..color = const Color(0xFFE8A83A)
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;

    final ownedPath = Path();
    ownedPath.moveTo(0, size.height * 0.1);
    ownedPath.lineTo(size.width * 0.15, size.height * 0.4);
    ownedPath.lineTo(size.width * 0.3, size.height * 0.3);
    ownedPath.lineTo(size.width * 0.45, size.height * 0.4);
    ownedPath.lineTo(size.width * 0.6, size.height * 0.3);
    ownedPath.lineTo(size.width * 0.75, size.height * 0.6);
    ownedPath.lineTo(size.width * 0.9, size.height * 0.5);
    ownedPath.lineTo(size.width, size.height * 0.2);

    final currentPath = Path();
    currentPath.moveTo(0, size.height * 0.8);
    currentPath.lineTo(size.width * 0.15, size.height * 0.6);
    currentPath.lineTo(size.width * 0.3, size.height * 0.55);
    currentPath.lineTo(size.width * 0.45, size.height * 0.2);
    currentPath.lineTo(size.width * 0.6, size.height * 0.25);
    currentPath.lineTo(size.width * 0.75, size.height * 0.9);
    currentPath.lineTo(size.width * 0.9, size.height * 0.85);
    currentPath.lineTo(size.width, size.height * 0.7);

    canvas.drawPath(ownedPath, ownedPaint);
    canvas.drawPath(currentPath, currentPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

