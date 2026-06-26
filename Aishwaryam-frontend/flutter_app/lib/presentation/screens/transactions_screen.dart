import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers/portfolio_provider.dart';
import 'transaction_detail_screen.dart';

class TransactionsScreen extends ConsumerStatefulWidget {
  const TransactionsScreen({super.key});

  @override
  ConsumerState<TransactionsScreen> createState() => _TransactionsScreenState();
}

class _TransactionsScreenState extends ConsumerState<TransactionsScreen> {
  String _selectedTab = 'All';
  String _sortOrder = 'Date (Newest)';

  void _showSortOptions() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Padding(
                padding: EdgeInsets.all(16.0),
                child: Text('Sort By', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
              ),
              ListTile(
                title: const Text('Date (Newest)'),
                trailing: _sortOrder == 'Date (Newest)' ? const Icon(Icons.check, color: Color(0xFF01352A)) : null,
                onTap: () { setState(() => _sortOrder = 'Date (Newest)'); Navigator.pop(context); },
              ),
              ListTile(
                title: const Text('Date (Oldest)'),
                trailing: _sortOrder == 'Date (Oldest)' ? const Icon(Icons.check, color: Color(0xFF01352A)) : null,
                onTap: () { setState(() => _sortOrder = 'Date (Oldest)'); Navigator.pop(context); },
              ),
              ListTile(
                title: const Text('Amount (High to Low)'),
                trailing: _sortOrder == 'Amount (High to Low)' ? const Icon(Icons.check, color: Color(0xFF01352A)) : null,
                onTap: () { setState(() => _sortOrder = 'Amount (High to Low)'); Navigator.pop(context); },
              ),
              ListTile(
                title: const Text('Amount (Low to High)'),
                trailing: _sortOrder == 'Amount (Low to High)' ? const Icon(Icons.check, color: Color(0xFF01352A)) : null,
                onTap: () { setState(() => _sortOrder = 'Amount (Low to High)'); Navigator.pop(context); },
              ),
            ],
          ),
        );
      },
    );
  }

  void _openTransactionDetail(Map<String, dynamic> tx) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => TransactionDetailScreen(tx: tx)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final historyAsync = ref.watch(transactionHistoryProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF5F7F5),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text('Transactions', style: TextStyle(fontWeight: FontWeight.w800, color: Colors.black)),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16.0),
            child: GestureDetector(
              onTap: _showSortOptions,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.black87),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Row(
                  children: [
                    Text('Sort', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                    SizedBox(width: 4),
                    Icon(Icons.tune, color: Colors.black, size: 16),
                  ],
                ),
              ),
            ),
          )
        ],
      ),
      body: Column(
        children: [
          const SizedBox(height: 16),
          // Tabs
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 20),
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: Colors.grey[200],
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildTab('All'),
                _buildTab('Buy'),
                _buildTab('Sell'),
                _buildTab('Referrals'),
                _buildTab('Rewards'),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: historyAsync.when(
              loading: () => const Center(child: CircularProgressIndicator(color: Colors.black)),
              error: (err, stack) => Center(child: Text('Error: $err')),
              data: (transactions) {
                // Filter logic based on _selectedTab
                List filteredTx = transactions;
                if (_selectedTab == 'Buy') {
                  filteredTx = transactions.where((tx) => tx['type'] == 'BUY_GOLD').toList();
                } else if (_selectedTab == 'Sell') {
                  filteredTx = transactions.where((tx) => tx['type'] == 'SELL_GOLD').toList();
                } else if (_selectedTab == 'Referrals') {
                  filteredTx = transactions.where((tx) => tx['type'] == 'REFERRAL_BONUS').toList();
                } else if (_selectedTab == 'Rewards') {
                  filteredTx = transactions.where((tx) => tx['type'] == 'REWARD').toList();
                }

                // Sort Logic
                filteredTx.sort((a, b) {
                  if (_sortOrder == 'Date (Newest)') {
                    return b['date'].compareTo(a['date']);
                  } else if (_sortOrder == 'Date (Oldest)') {
                    return a['date'].compareTo(b['date']);
                  } else if (_sortOrder == 'Amount (High to Low)') {
                    return b['amountPaise'].compareTo(a['amountPaise']);
                  } else if (_sortOrder == 'Amount (Low to High)') {
                    return a['amountPaise'].compareTo(b['amountPaise']);
                  }
                  return 0;
                });

                if (filteredTx.isEmpty) {
                  return const Center(child: Text('No transactions found.'));
                }

                return ListView.separated(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10).copyWith(bottom: 100),
                  itemCount: filteredTx.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final tx = filteredTx[index];
                    final isDeposit = tx['type'] == 'WALLET_DEPOSIT';
                    final isBuy = tx['type'] == 'BUY_GOLD';
                    final isSell = tx['type'] == 'SELL_GOLD';
                    
                    final icon = isBuy ? Icons.public : Icons.receipt; 
                    final color = (isBuy || isDeposit) ? Colors.green : Colors.red;
                    final dateStr = tx['date'].toString(); 
                    // format date to "03 Apr" based on design, simplified here
                    
                    return GestureDetector(
                      onTap: () => _openTransactionDetail(tx),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.grey.withOpacity(0.3)),
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: color,
                                shape: BoxShape.circle,
                              ),
                              child: Icon(icon, color: Colors.white, size: 20),
                            ),
                            const SizedBox(width: 16),
                            Text(
                              dateStr.length > 10 ? dateStr.substring(0, 10) : dateStr, 
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                            ),
                            const Spacer(),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  '₹ ${(tx['amountPaise'] / 100).toStringAsFixed(0)}',
                                  style: TextStyle(fontWeight: FontWeight.bold, color: color, fontSize: 16),
                                ),
                                if (tx['goldWeightMg'] > 0)
                                  Text('${(tx['goldWeightMg'] / 1000).toStringAsFixed(1)}gm', style: const TextStyle(fontSize: 12, color: Colors.black54)),
                              ],
                            ),
                            const SizedBox(width: 8),
                            IconButton(
                              icon: const Icon(Icons.download_for_offline_outlined, color: Color(0xFF01352A)),
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(),
                              onPressed: () {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text('Downloading statement for ${tx['id']}...')),
                                );
                              },
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          )
        ],
      ),
    );
  }

  Widget _buildTab(String title) {
    bool isSelected = _selectedTab == title;
    return GestureDetector(
      onTap: () => setState(() => _selectedTab = title),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? Colors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
          boxShadow: isSelected ? [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4)] : null,
        ),
        child: Text(
          title,
          style: TextStyle(
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            color: isSelected ? Colors.black : Colors.grey[600],
            fontSize: 12,
          ),
        ),
      ),
    );
  }
}
