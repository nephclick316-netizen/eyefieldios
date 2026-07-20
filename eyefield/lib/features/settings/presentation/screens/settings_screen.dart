import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../profile/presentation/screens/profile_settings_screen.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(LucideIcons.chevronLeft, color: isDark ? Colors.white : Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'SETTINGS',
          style: TextStyle(
            color: isDark ? Colors.white : Colors.black,
            fontWeight: FontWeight.w900,
            fontSize: 16,
            letterSpacing: 2,
          ),
        ),
        centerTitle: true,
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
        children: [
          _buildSectionHeader('ACCOUNT'),
          _buildSettingTile(
            context,
            icon: LucideIcons.user,
            title: 'Profile Settings',
            subtitle: 'Change your photo, name, and bio',
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProfileSettingsScreen())),
          ),
          _buildSettingTile(
            context,
            icon: LucideIcons.bell,
            title: 'Notifications',
            subtitle: 'Manage alerts and sounds',
            onTap: () {},
          ),
          
          const SizedBox(height: 32),
          _buildSectionHeader('PREFERENCES'),
          _buildSettingTile(
            context,
            icon: LucideIcons.moon,
            title: 'Appearance',
            subtitle: 'Dark mode and theme colors',
            onTap: () {},
          ),
          _buildSettingTile(
            context,
            icon: LucideIcons.languages,
            title: 'Language',
            subtitle: 'English (US)',
            onTap: () {},
          ),

          const SizedBox(height: 32),
          _buildSectionHeader('PRIVACY & SECURITY'),
          _buildSettingTile(
            context,
            icon: LucideIcons.lock,
            title: 'Password',
            subtitle: 'Change your security credentials',
            onTap: () {},
          ),
          _buildSettingTile(
            context,
            icon: LucideIcons.shieldCheck,
            title: 'Privacy',
            subtitle: 'Manage your visibility',
            onTap: () {},
          ),

          const SizedBox(height: 32),
          _buildSectionHeader('HELP & SUPPORT'),
          _buildSettingTile(
            context,
            icon: LucideIcons.helpCircle,
            title: 'Help Center',
            subtitle: 'FAQs and troubleshooting',
            onTap: () {},
          ),
          _buildSettingTile(
            context,
            icon: LucideIcons.info,
            title: 'About EyeField',
            subtitle: 'Version 1.0.0',
            onTap: () {},
          ),

          const SizedBox(height: 48),
          Center(
            child: TextButton(
              onPressed: () {
                // Handle Logout
              },
              child: const Text(
                'LOG OUT',
                style: TextStyle(
                  color: Colors.red,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2,
                ),
              ),
            ),
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16, left: 4),
      child: Text(
        title,
        style: const TextStyle(
          color: Color(0xFF94A3B8),
          fontSize: 10,
          fontWeight: FontWeight.w900,
          letterSpacing: 1.5,
        ),
      ),
    );
  }

  Widget _buildSettingTile(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9)),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: isDark ? Colors.black : Colors.white,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, size: 20, color: const Color(0xFF4F46E5)),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        fontSize: 11,
                        color: Color(0xFF64748B),
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(LucideIcons.chevronRight, size: 20, color: Color(0xFFCBD5E1)),
            ],
          ),
        ),
      ),
    );
  }
}
