import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/providers/user_provider.dart';
import 'mpin_screen.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(userProfileProvider);
    final configAsync = ref.watch(appConfigProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF5F7F5),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text('Settings', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: profileAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error loading profile: $err')),
        data: (profile) {
          final config = configAsync.value;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // User Profile Header
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: const Color(0xFF01211A),
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 30,
                        backgroundColor: Colors.white.withOpacity(0.2),
                        child: const Icon(Icons.person, color: Colors.white, size: 36),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(profile.fullName, style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 4),
                            Text(profile.phoneNumber, style: const TextStyle(color: Colors.white70, fontSize: 14)),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.edit, color: Colors.white),
                        onPressed: () => _showEditNameDialog(context, ref, profile.fullName),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),

                // Settings Options
                _buildSectionHeader('Security'),
                _buildListTile(Icons.lock_outline, 'Change MPIN', onTap: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const MpinScreen(isSetupMode: true)));
                }),
                _buildListTile(Icons.fingerprint, 'Biometric Login', isSwitch: true, value: profile.biometricEnabled, onChanged: (v) {
                  // Call API to toggle biometric logic in real implementation
                }),
                const SizedBox(height: 24),

                _buildSectionHeader('Account & Growth'),
                _buildListTile(Icons.account_balance_wallet_outlined, 'Bank Accounts', onTap: () {}),
                _buildListTile(Icons.verified_user_outlined, 'KYC Verification', trailingText: profile.kycLevel, onTap: () {}),
                _buildListTile(Icons.autorenew, 'Auto Gold Purchase (SIP)', onTap: () {
                  // Navigate to Auto Purchase Setup
                }),
                _buildListTile(Icons.card_giftcard, 'Refer & Earn', trailingText: 'Bonus Gold!', onTap: () {
                  // Navigate to Referrals
                }),
                const SizedBox(height: 24),

                _buildSectionHeader('Support & Legal'),
                _buildListTile(Icons.help_outline, 'Help & Support', onTap: () {
                  if (config != null) launchUrl(Uri.parse('mailto:${config.supportEmail}'));
                }),
                _buildListTile(Icons.description_outlined, 'Terms & Conditions', onTap: () {
                  if (config != null) launchUrl(Uri.parse(config.termsUrl));
                }),
                _buildListTile(Icons.privacy_tip_outlined, 'Privacy Policy', onTap: () {
                  if (config != null) launchUrl(Uri.parse(config.privacyUrl));
                }),
                const SizedBox(height: 32),

                // Logout Button
                OutlinedButton.icon(
                  onPressed: () {
                    ref.read(authProvider.notifier).logout();
                  },
                  icon: const Icon(Icons.logout, color: Colors.red),
                  label: const Text('Logout', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Colors.red),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                ),
                const SizedBox(height: 60), // Padding for bottom nav
              ],
            ),
          );
        },
      ),
    );
  }

  void _showEditNameDialog(BuildContext context, WidgetRef ref, String currentName) {
    final controller = TextEditingController(text: currentName);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Edit Name'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(hintText: 'Enter your full name'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              // Fire backend API to update Name
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Name updated successfully')));
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 8.0, bottom: 8.0),
      child: Text(
        title,
        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.black54),
      ),
    );
  }

  Widget _buildListTile(IconData icon, String title, {VoidCallback? onTap, bool isSwitch = false, bool value = false, ValueChanged<bool>? onChanged, String? trailingText}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10)],
      ),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(color: const Color(0xFFF5F7F5), borderRadius: BorderRadius.circular(8)),
          child: Icon(icon, color: const Color(0xFF01352A)),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
        trailing: isSwitch
            ? Switch(value: value, onChanged: onChanged, activeColor: const Color(0xFF01352A))
            : trailingText != null
                ? Text(trailingText, style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold))
                : const Icon(Icons.chevron_right, color: Colors.grey),
        onTap: onTap,
      ),
    );
  }
}
