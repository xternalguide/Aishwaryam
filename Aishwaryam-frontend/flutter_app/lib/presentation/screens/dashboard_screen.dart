import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';
import '../../core/providers/wallet_provider.dart';
import '../../core/providers/gold_provider.dart';
import '../../core/providers/portfolio_provider.dart';
import '../../core/providers/user_provider.dart';
import '../../core/theme/theme_manager.dart';
import 'trading_screen.dart';
import 'banking_screen.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeConfig = ref.watch(themeProvider);
    final goldPriceAsync = ref.watch(goldPriceProvider);
    final holdingsAsync = ref.watch(goldHoldingsProvider);
    final appConfigAsync = ref.watch(appConfigProvider);
    final profileAsync = ref.watch(userProfileProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF5F7F5), // Light Background for top section
      body: RefreshIndicator(
        color: const Color.fromARGB(255, 0, 0, 0),
        onRefresh: () async {
          ref.invalidate(walletBalanceProvider);
          ref.invalidate(goldPriceProvider);
          ref.invalidate(goldHoldingsProvider);
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.only(bottom: 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // TOP HEADER SECTION (Dark Teal with Texture)
              Container(
                padding: const EdgeInsets.only(top: 60, left: 24, right: 24, bottom: 40),
                decoration: const BoxDecoration(
                  image: DecorationImage(
                    image: AssetImage('assets/images/bg_texture.png'),
                    fit: BoxFit.cover,
                  ),
                  // Removed fallback color to ensure image base64 shows with no color
                  borderRadius: BorderRadius.only(
                    bottomLeft: Radius.circular(32),
                    bottomRight: Radius.circular(32),
                  ),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Live price capsule
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.3),
                            borderRadius: BorderRadius.circular(24),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.stars, color: Color(0xFFE8A83A), size: 18),
                              const SizedBox(width: 8),
                              goldPriceAsync.when(
                                data: (price) => Text(
                                  '₹ ${(price.buyPricePaise / 100).toStringAsFixed(2)}/gm',
                                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                                ),
                                loading: () => const SizedBox(width: 20, height: 10, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)),
                                error: (_, __) => const Text('Error', style: TextStyle(color: Colors.white)),
                              ),
                            ],
                          ),
                        ),
                        // Notification Bell
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.3),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.notifications, color: Colors.white, size: 20),
                        ),
                      ],
                    ),
                    const SizedBox(height: 32),
                    const Text('Your savings', style: TextStyle(color: Colors.white70, fontSize: 14)),
                    const SizedBox(height: 4),
                    holdingsAsync.when(
                      data: (mg) => Text(
                        (mg / 1000).toStringAsFixed(4),
                        style: const TextStyle(color: Colors.white, fontSize: 56, fontWeight: FontWeight.w900, height: 1.1),
                      ),
                      loading: () => const Padding(
                        padding: EdgeInsets.symmetric(vertical: 20),
                        child: CircularProgressIndicator(color: Colors.white),
                      ),
                      error: (_, __) => const Text('Error', style: TextStyle(color: Colors.white, fontSize: 32)),
                    ),
                    const Text('grams', style: TextStyle(color: Colors.white70, fontSize: 14)),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              
              // ACTION BUTTONS
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                child: Row(
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
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.grey[200],
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.bar_chart, color: Colors.black54, size: 20),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          Navigator.push(context, MaterialPageRoute(builder: (_) => const BankingScreen()));
                        },
                        icon: const Icon(Icons.account_balance_wallet, color: const Color(0xFF01352A), size: 16),
                        label: const Text('Withdraw', style: TextStyle(color: const Color(0xFF01352A), fontWeight: FontWeight.bold, fontSize: 16)),
                        style: OutlinedButton.styleFrom(
                          backgroundColor: Colors.white,
                          side: const BorderSide(color: Color(0xFF01352A), width: 1.5),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              
              // CAROUSEL BANNER PLACEHOLDER (Remote Config)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                child: Container(
                  height: 120,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(24),
                    gradient: const LinearGradient(
                      colors: [Color(0xFF8B6A45), Color(0xFFE2C4A2)],
                      begin: Alignment.centerLeft,
                      end: Alignment.centerRight,
                    ),
                    image: DecorationImage(
                      image: NetworkImage(appConfigAsync.value?.festivalBannerUrl ?? 'https://images.unsplash.com/photo-1610652492500-ded49ceeb378?auto=format&fit=crop&q=80&w=800'),
                      fit: BoxFit.cover,
                      colorFilter: const ColorFilter.mode(Colors.black38, BlendMode.darken),
                    )
                  ),
                  child: const Center(
                    child: Text('Exclusive Jewellery Designs', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(width: 6, height: 6, decoration: const BoxDecoration(color: Color(0xFF01352A), shape: BoxShape.circle)),
                  const SizedBox(width: 4),
                  Container(width: 6, height: 6, decoration: BoxDecoration(color: Colors.grey[300], shape: BoxShape.circle)),
                  const SizedBox(width: 4),
                  Container(width: 6, height: 6, decoration: BoxDecoration(color: Colors.grey[300], shape: BoxShape.circle)),
                  const SizedBox(width: 4),
                  Container(width: 6, height: 6, decoration: BoxDecoration(color: Colors.grey[300], shape: BoxShape.circle)),
                ],
              ),
              const SizedBox(height: 24),

              // DARK GREEN BOTTOM SECTION (Dynamic Theme color)
              Container(
                decoration: BoxDecoration(
                  color: appConfigAsync.value != null ? Color(int.parse(appConfigAsync.value!.primaryColorHex.replaceFirst('#', '0xFF'))) : const Color(0xFF01211A),
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(32),
                    topRight: Radius.circular(32),
                  ),
                ),
                padding: const EdgeInsets.only(top: 32, left: 24, right: 24, bottom: 120),
                child: Column(
                  children: [
                    // LIVE PRICE GRAPH CARD
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.teal.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Text('Live Price', style: TextStyle(color: Colors.teal, fontSize: 10, fontWeight: FontWeight.bold)),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              goldPriceAsync.when(
                                data: (price) => Text(
                                  '₹ ${(price.buyPricePaise / 100).toStringAsFixed(2)}/gm',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20, color: Colors.black),
                                ),
                                loading: () => const Text('Loading...', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
                                error: (_, __) => const Text('Error', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
                              ),
                              const SizedBox(width: 8),
                              const Text('↘ 5%', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 12)),
                            ],
                          ),
                          const SizedBox(height: 24),
                          // Dummy Graph line (just a placeholder visual)
                          SizedBox(
                            height: 60,
                            child: CustomPaint(
                              size: const Size(double.infinity, 60),
                              painter: _DummyGraphPainter(),
                            ),
                          ),
                          const SizedBox(height: 24),
                          // Filters
                          Container(
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: Colors.grey[100],
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                _buildGraphFilter('1 Day', true),
                                _buildGraphFilter('1 Month', false),
                                _buildGraphFilter('1 Year', false),
                                _buildGraphFilter('Max', false),
                              ],
                            ),
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

                    // BOTTOM CARDS: Auto Save & FAQ
                    Row(
                      children: [
                        Expanded(
                          flex: 5,
                          child: Container(
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              color: const Color(0xFF042B22), // slightly lighter dark green
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: Colors.white.withOpacity(0.05)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Row(
                                  children: [
                                    Icon(Icons.savings_outlined, color: Colors.white, size: 28),
                                    SizedBox(width: 8),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text('Auto Save', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                                        Text('Start with ₹50', style: TextStyle(color: Colors.white70, fontSize: 10)),
                                      ],
                                    )
                                  ],
                                ),
                                const SizedBox(height: 24),
                                InkWell(
                                  onTap: () {
                                     ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Auto Save Setup (SIP) opening...')));
                                  },
                                  child: Container(
                                    width: double.infinity,
                                    padding: const EdgeInsets.symmetric(vertical: 12),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: const Center(
                                      child: Text('Get Started', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 14)),
                                    ),
                                  ),
                                )
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          flex: 4,
                          child: Container(
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Row(
                                  children: [
                                    Icon(Icons.help_outline, color: Colors.black, size: 28),
                                    SizedBox(width: 8),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text('FAQ', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 14)),
                                        Text('Find Answers', style: TextStyle(color: Colors.black54, fontSize: 10)),
                                      ],
                                    )
                                  ],
                                ),
                                const SizedBox(height: 24),
                                InkWell(
                                  onTap: () {
                                    if (appConfigAsync.value != null && appConfigAsync.value!.faqList.isNotEmpty) {
                                      _showFaqBottomSheet(context, appConfigAsync.value!.faqList);
                                    } else {
                                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No FAQs available right now.')));
                                    }
                                  },
                                  child: Container(
                                    width: double.infinity,
                                    padding: const EdgeInsets.symmetric(vertical: 12),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF01211A),
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: const Center(
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Text('Go', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                                          SizedBox(width: 4),
                                          Icon(Icons.arrow_forward, color: Colors.white, size: 16),
                                        ],
                                      ),
                                    ),
                                  ),
                                )
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // REFER & EARN (Feature Flag controlled)
                    if (appConfigAsync.value?.isReferralEnabled ?? true)
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('Refer & Earn', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 16)),
                                    Text('Share our app with your friend and earn rewards', style: TextStyle(color: Colors.black54, fontSize: 10)),
                                  ],
                                ),
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: appConfigAsync.value != null ? Color(int.parse(appConfigAsync.value!.primaryColorHex.replaceFirst('#', '0xFF'))) : const Color(0xFF01352A),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Icon(Icons.card_giftcard, color: appConfigAsync.value != null ? Color(int.parse(appConfigAsync.value!.secondaryColorHex.replaceFirst('#', '0xFF'))) : const Color(0xFFE8A83A), size: 24),
                                )
                              ],
                            ),
                            const SizedBox(height: 20),
                            InkWell(
                              onTap: () {
                                if (appConfigAsync.value != null && profileAsync.value != null) {
                                  Share.share('${appConfigAsync.value!.referralBonusMsg}\nUse my code: ${profileAsync.value!.referralCode}\nhttps://aishwaryamgold.com');
                                } else {
                                  Share.share('Invite friends and earn 1mg of 24K Gold!\nUse my code: AISHWARYAM100\nhttps://aishwaryamgold.com');
                                }
                              },
                              child: Container(
                                width: double.infinity,
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                decoration: BoxDecoration(
                                  color: appConfigAsync.value != null ? Color(int.parse(appConfigAsync.value!.primaryColorHex.replaceFirst('#', '0xFF'))) : const Color(0xFF01211A),
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

  Widget _buildGraphFilter(String label, bool isSelected) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: isSelected ? Colors.white : Colors.transparent,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: isSelected ? Colors.black : Colors.grey[600],
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          fontSize: 10,
        ),
      ),
    );
  }

  void _showFaqBottomSheet(BuildContext context, List<dynamic> faqs) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) {
        return Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Frequently Asked Questions', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              Expanded(
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: faqs.length,
                  itemBuilder: (context, index) {
                    final faq = faqs[index];
                    return ExpansionTile(
                      title: Text(faq['q'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600)),
                      children: [
                        Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Text(faq['a'] ?? '', style: const TextStyle(color: Colors.black54)),
                        )
                      ],
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _DummyGraphPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF01352A)
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;

    final path = Path();
    path.moveTo(0, size.height * 0.2);
    path.lineTo(size.width * 0.1, size.height * 0.1);
    path.lineTo(size.width * 0.2, size.height * 0.3);
    path.lineTo(size.width * 0.3, size.height * 0.2);
    path.lineTo(size.width * 0.4, size.height * 0.6);
    path.lineTo(size.width * 0.5, size.height * 0.5);
    path.lineTo(size.width * 0.6, size.height * 0.8);
    path.lineTo(size.width * 0.7, size.height * 0.7);
    path.lineTo(size.width * 0.8, size.height * 0.9);
    path.lineTo(size.width * 0.9, size.height * 0.8);
    path.lineTo(size.width, size.height);

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
