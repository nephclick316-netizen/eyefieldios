import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:eyefield/features/profile/presentation/providers/profile_providers.dart';
import 'package:eyefield/features/profile/domain/models/profile_user.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final _formKey = GlobalKey<FormState>();
  
  // Personal Info
  late TextEditingController _usernameController;
  late TextEditingController _displayNameController;
  late TextEditingController _bioController;
  late TextEditingController _countryCodeController;
  late TextEditingController _phoneController;
  
  // Business Info
  late TextEditingController _businessNameController;
  String _businessCategory = 'Fashion';
  late TextEditingController _businessDescriptionController;
  late TextEditingController _businessAddressController;
  late TextEditingController _websiteController;
  bool _isSaving = false;

  final List<String> _categories = [
    'Fashion', 'Tech', 'Health', 'Consulting', 'Retail', 
    'Food & Beverage', 'Arts', 'Services', 'Education', 
    'Real Estate', 'Travel', 'Other'
  ];

  @override
  void initState() {
    super.initState();
    final profile = ref.read(currentUserProfileProvider).value;
    _usernameController = TextEditingController(text: profile?.username ?? '');
    _displayNameController = TextEditingController(text: profile?.displayName ?? '');
    _bioController = TextEditingController(text: profile?.bio ?? '');
    
    // Attempt to split country code from phone if it exists
    String rawPhone = profile?.phoneNumber ?? '';
    String cCode = '+1';
    String pNum = '';
    if (rawPhone.startsWith('+') && rawPhone.length > 3) {
      cCode = rawPhone.substring(0, rawPhone.indexOf(' ', 0) != -1 ? rawPhone.indexOf(' ', 0) : 3);
      pNum = rawPhone.replaceFirst(cCode, '').trim();
    } else {
      pNum = rawPhone;
    }
    _countryCodeController = TextEditingController(text: cCode);
    _phoneController = TextEditingController(text: pNum);
    
    final bDetails = profile?.businessDetails ?? {};
    _businessNameController = TextEditingController(text: bDetails['name'] ?? '');
    if (_categories.contains(bDetails['category'])) {
      _businessCategory = bDetails['category'];
    }
    _businessDescriptionController = TextEditingController(text: bDetails['description'] ?? '');
    _businessAddressController = TextEditingController(text: bDetails['address'] ?? '');
    _websiteController = TextEditingController(text: bDetails['website'] ?? '');
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _displayNameController.dispose();
    _bioController.dispose();
    _countryCodeController.dispose();
    _phoneController.dispose();
    _businessNameController.dispose();
    _businessDescriptionController.dispose();
    _businessAddressController.dispose();
    _websiteController.dispose();
    super.dispose();
  }

  Future<void> _completeOnboarding() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isSaving = true);
    try {
      final oldProfile = ref.read(currentUserProfileProvider).value;
      if (oldProfile == null) throw Exception("Profile not found");

      final formattedPhone = '${_countryCodeController.text.trim()} ${_phoneController.text.trim()}'.trim();

      final updatedProfile = ProfileUser(
        id: oldProfile.id,
        avatar: oldProfile.avatar,
        isVerified: true, // Mark as verified/completed onboarding
        gender: oldProfile.gender,
        username: _usernameController.text.trim(),
        displayName: _displayNameController.text.trim(),
        bio: _bioController.text.trim(),
        phoneNumber: formattedPhone,
        businessDetails: {
           'name': _businessNameController.text.trim(),
           'category': _businessCategory,
           'description': _businessDescriptionController.text.trim(),
           'address': _businessAddressController.text.trim(),
           'website': _websiteController.text.trim(),
           'socialMedia': '', // Kept empty or unexposed in simple onboarding
        },
      );

      await ref.read(profileRepositoryProvider).updateProfile(oldProfile.id, updatedProfile);
      ref.invalidate(currentUserProfileProvider);
      
      if (mounted) {
        // Navigate to Main Screen (or replace)
        Navigator.of(context).pushReplacementNamed('/home'); // Adjust according to routing setup
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        title: Text(
          'COMPLETE PROFILE',
          style: TextStyle(
            color: isDark ? Colors.white : const Color(0xFF00172D),
            fontWeight: FontWeight.w900,
            fontSize: 16,
            letterSpacing: 2,
          ),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Set up your EyeField business profile.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 14,
                    color: isDark ? Colors.white70 : Colors.black54,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 48),

                const Text('PERSONAL DETAILS', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF64748B), letterSpacing: 1.5)),
                const SizedBox(height: 24),
                
                _buildTextField(
                  label: 'USERNAME',
                  controller: _usernameController,
                  hint: 'Choose a unique handle',
                  icon: LucideIcons.atSign,
                ),
                const SizedBox(height: 24),
                
                _buildTextField(
                  label: 'DISPLAY NAME',
                  controller: _displayNameController,
                  hint: 'Your full name or brand',
                  icon: LucideIcons.user,
                ),
                const SizedBox(height: 24),
                
                _buildTextField(
                  label: 'BIO',
                  controller: _bioController,
                  hint: 'Short description about you',
                  icon: LucideIcons.text,
                  maxLines: 2,
                ),
                const SizedBox(height: 24),
                
                Text(
                  'PHONE NUMBER',
                  style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1.5),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    SizedBox(
                      width: 100,
                      child: _buildInputField(
                        controller: _countryCodeController,
                        hint: '+Code',
                        icon: null,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildInputField(
                        controller: _phoneController,
                        hint: 'Phone Number',
                        icon: LucideIcons.phone,
                      ),
                    ),
                  ],
                ),
                
                const SizedBox(height: 48),
                const Text('BUSINESS DETAILS', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF64748B), letterSpacing: 1.5)),
                const SizedBox(height: 24),

                _buildTextField(
                  label: 'BUSINESS NAME',
                  controller: _businessNameController,
                  hint: 'e.g. EyeField Boutique',
                  icon: LucideIcons.briefcase,
                ),
                const SizedBox(height: 24),
                
                _buildDropdown(
                  label: 'BUSINESS CATEGORY',
                  value: _businessCategory,
                  items: _categories,
                  onChanged: (val) { if (val != null) setState(() => _businessCategory = val); },
                  icon: LucideIcons.tag,
                ),
                const SizedBox(height: 24),
                
                _buildTextField(
                  label: 'OPERATIONAL ADDRESS',
                  controller: _businessAddressController,
                  hint: 'e.g. 123 Field Lane, City, Country',
                  icon: LucideIcons.mapPin,
                ),
                const SizedBox(height: 24),
                
                _buildTextField(
                  label: 'WEB PORTAL',
                  controller: _websiteController,
                  hint: 'eyefield.me (optional)',
                  icon: LucideIcons.globe,
                ),
                
                const SizedBox(height: 48),
                ElevatedButton(
                  onPressed: _isSaving ? null : _completeOnboarding,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF4F46E5),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 20),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    elevation: 0,
                  ),
                  child: _isSaving
                    ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('COMPLETE SETUP', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1)),
                ),
                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTextField({
    required String label,
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    int maxLines = 1,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: Color(0xFF94A3B8),
            fontSize: 10,
            fontWeight: FontWeight.w900,
            letterSpacing: 1.5,
          ),
        ),
        const SizedBox(height: 12),
        _buildInputField(controller: controller, hint: hint, icon: icon, maxLines: maxLines),
      ],
    );
  }

  Widget _buildInputField({
    required TextEditingController controller,
    required String hint,
    IconData? icon,
    int maxLines = 1,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return TextFormField(
      controller: controller,
      maxLines: maxLines,
      style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: Color(0xFFCBD5E1), fontWeight: FontWeight.normal),
        prefixIcon: icon != null ? Icon(icon, size: 20, color: const Color(0xFF94A3B8)) : null,
        filled: true,
        fillColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: Color(0xFF4F46E5)),
        ),
      ),
    );
  }

  Widget _buildDropdown({
    required String label,
    required String value,
    required List<String> items,
    required void Function(String?) onChanged,
    required IconData icon,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1.5),
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          value: value,
          onChanged: onChanged,
          items: items.map((item) => DropdownMenuItem(value: item, child: Text(item, style: const TextStyle(fontWeight: FontWeight.w900)))).toList(),
          decoration: InputDecoration(
            prefixIcon: Icon(icon, size: 20, color: const Color(0xFF94A3B8)),
            filled: true,
            fillColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
          ),
        ),
      ],
    );
  }
}
