import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers/banking_provider.dart';
import '../../core/providers/wallet_provider.dart';
import '../../data/repositories/banking_repository.dart';

class BankingScreen extends ConsumerStatefulWidget {
  const BankingScreen({super.key});

  @override
  ConsumerState<BankingScreen> createState() => _BankingScreenState();
}

class _BankingScreenState extends ConsumerState<BankingScreen> {
  final _accountController = TextEditingController();
  final _ifscController = TextEditingController();
  final _bankNameController = TextEditingController();
  final _withdrawAmountController = TextEditingController();
  
  bool _isLoading = false;
  bool _isAddingNew = false;
  String? _selectedBankId;

  @override
  void dispose() {
    _accountController.dispose();
    _ifscController.dispose();
    _bankNameController.dispose();
    _withdrawAmountController.dispose();
    super.dispose();
  }

  Future<void> _addBankAccount() async {
    final account = _accountController.text.trim();
    final ifsc = _ifscController.text.trim().toUpperCase();
    final bank = _bankNameController.text.trim();

    if (account.isEmpty || ifsc.isEmpty || bank.isEmpty) return;

    setState(() => _isLoading = true);

    try {
      await bankingRepository.addBankAccount(
        accountNumber: account,
        ifscCode: ifsc,
        bankName: bank,
      );
      ref.invalidate(bankAccountsProvider);
      setState(() {
        _isAddingNew = false;
        _accountController.clear();
        _ifscController.clear();
        _bankNameController.clear();
      });
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Bank account added successfully.')));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _requestWithdrawal() async {
    final amountText = _withdrawAmountController.text.trim();
    if (amountText.isEmpty || _selectedBankId == null) return;

    final amountInr = double.tryParse(amountText) ?? 0;
    if (amountInr <= 0) return;

    setState(() => _isLoading = true);

    try {
      await bankingRepository.requestWithdrawal(
        bankAccountId: _selectedBankId!,
        amountPaise: (amountInr * 100).toInt(),
      );
      ref.invalidate(walletBalanceProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Withdrawal requested successfully.')));
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: Colors.red));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bankAccountsAsync = ref.watch(bankAccountsProvider);
    final walletBalanceAsync = ref.watch(walletBalanceProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF3F4F6),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
        title: const Text('Banking & Withdrawals', style: TextStyle(fontWeight: FontWeight.w800, color: Colors.black)),
      ),
      body: bankAccountsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: Colors.black)),
        error: (err, _) => Center(child: Text('Error: $err', style: const TextStyle(color: Colors.red))),
        data: (accounts) {
          if (accounts.isEmpty || _isAddingNew) {
            return _buildAddAccountForm();
          }

          if (_selectedBankId == null && accounts.isNotEmpty) {
            _selectedBankId = accounts.first['id'];
          }

          return _buildWithdrawalForm(accounts, walletBalanceAsync.value ?? 0);
        },
      ),
    );
  }

  Widget _buildWithdrawalForm(List<Map<String, dynamic>> accounts, int balancePaise) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24)),
            child: Column(
              children: [
                const Text('Wallet Balance', style: TextStyle(color: Colors.black54, fontSize: 16)),
                const SizedBox(height: 8),
                Text('₹ ${(balancePaise / 100).toStringAsFixed(2)}', style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.black)),
              ],
            ),
          ),
          const SizedBox(height: 32),
          
          const Text('Select Bank Account', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 16),
          ...accounts.map((acc) {
            return RadioListTile<String>(
              value: acc['id'],
              groupValue: _selectedBankId,
              onChanged: (val) => setState(() => _selectedBankId = val),
              title: Text(acc['bankName'] ?? 'Unknown Bank'),
              subtitle: Text(acc['accountNumberMasked'] ?? '****'),
              activeColor: const Color(0xFF01352A),
              tileColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            );
          }),
          const SizedBox(height: 16),
          TextButton.icon(
            onPressed: () => setState(() => _isAddingNew = true),
            icon: const Icon(Icons.add, color: Color(0xFF01352A)),
            label: const Text('Add Another Bank Account', style: TextStyle(color: Color(0xFF01352A))),
          ),
          
          const SizedBox(height: 32),
          TextField(
            controller: _withdrawAmountController,
            keyboardType: TextInputType.number,
            decoration: InputDecoration(
              labelText: 'Withdrawal Amount (₹)',
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
            ),
          ),
          const SizedBox(height: 32),
          
          SizedBox(
            height: 64,
            child: ElevatedButton(
              onPressed: _isLoading ? null : _requestWithdrawal,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF01352A),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
              ),
              child: _isLoading
                  ? const CircularProgressIndicator(color: Colors.white)
                  : const Text('WITHDRAW FUNDS', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
            ),
          )
        ],
      ),
    );
  }

  Widget _buildAddAccountForm() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.all(32),
            decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
            child: const Icon(Icons.account_balance, size: 60, color: Colors.black),
          ),
          const SizedBox(height: 24),
          const Text(
            'Link your bank account to withdraw funds safely from your wallet.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.black54, fontSize: 16),
          ),
          const SizedBox(height: 48),

          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: const Color(0xFF1E1E1E),
              borderRadius: BorderRadius.circular(32),
            ),
            child: Column(
              children: [
                TextField(
                  controller: _accountController,
                  keyboardType: TextInputType.number,
                  style: const TextStyle(color: Colors.white, fontSize: 18),
                  decoration: InputDecoration(
                    labelText: 'Account Number',
                    labelStyle: TextStyle(color: Colors.white.withValues(alpha: 0.5)),
                    enabledBorder: const UnderlineInputBorder(borderSide: BorderSide(color: Colors.white24)),
                    focusedBorder: const UnderlineInputBorder(borderSide: BorderSide(color: Colors.white)),
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _ifscController,
                  textCapitalization: TextCapitalization.characters,
                  style: const TextStyle(color: Colors.white, fontSize: 18),
                  decoration: InputDecoration(
                    labelText: 'IFSC Code',
                    labelStyle: TextStyle(color: Colors.white.withValues(alpha: 0.5)),
                    enabledBorder: const UnderlineInputBorder(borderSide: BorderSide(color: Colors.white24)),
                    focusedBorder: const UnderlineInputBorder(borderSide: BorderSide(color: Colors.white)),
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _bankNameController,
                  textCapitalization: TextCapitalization.words,
                  style: const TextStyle(color: Colors.white, fontSize: 18),
                  decoration: InputDecoration(
                    labelText: 'Bank Name',
                    labelStyle: TextStyle(color: Colors.white.withValues(alpha: 0.5)),
                    enabledBorder: const UnderlineInputBorder(borderSide: BorderSide(color: Colors.white24)),
                    focusedBorder: const UnderlineInputBorder(borderSide: BorderSide(color: Colors.white)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 48),

          SizedBox(
            height: 64,
            child: ElevatedButton(
              onPressed: _isLoading ? null : _addBankAccount,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.black,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
              ),
              child: _isLoading
                  ? const CircularProgressIndicator(color: Colors.white)
                  : const Text('LINK BANK ACCOUNT', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
            ),
          ),
          if (_isAddingNew)
            Padding(
              padding: const EdgeInsets.only(top: 16.0),
              child: TextButton(
                onPressed: () => setState(() => _isAddingNew = false),
                child: const Text('Cancel', style: TextStyle(color: Colors.black54)),
              ),
            ),
        ],
      ),
    );
  }
}
