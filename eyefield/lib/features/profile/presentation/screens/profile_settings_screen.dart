import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:image_picker/image_picker.dart';
import 'package:eyefield/features/profile/domain/models/profile_user.dart';
import '../providers/profile_providers.dart';

class ProfileSettingsScreen extends ConsumerStatefulWidget {
  const ProfileSettingsScreen({super.key});

  @override
  ConsumerState<ProfileSettingsScreen> createState() => _ProfileSettingsScreenState();
}

class _ProfileSettingsScreenState extends ConsumerState<ProfileSettingsScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _usernameController;
  late TextEditingController _displayNameController;
  late TextEditingController _bioController;
  late TextEditingController _phoneController;
  late TextEditingController _businessNameController;
  String _businessCategory = 'Fashion';
  late TextEditingController _businessDescriptionController;
  late TextEditingController _businessAddressController;
  late TextEditingController _websiteController;
  late TextEditingController _socialMediaController;
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
    _phoneController = TextEditingController(text: profile?.phoneNumber ?? '');
    
    final bDetails = profile?.businessDetails ?? {};
    _businessNameController = TextEditingController(text: bDetails['name'] ?? '');
    if (_categories.contains(bDetails['category'])) {
      _businessCategory = bDetails['category'];
    }
    _businessDescriptionController = TextEditingController(text: bDetails['description'] ?? '');
    _businessAddressController = TextEditingController(text: bDetails['address'] ?? '');
    _websiteController = TextEditingController(text: bDetails['website'] ?? '');
    _socialMediaController = TextEditingController(text: bDetails['socialMedia'] ?? '');
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _displayNameController.dispose();
    _bioController.dispose();
    _phoneController.dispose();
    _businessNameController.dispose();
    _businessDescriptionController.dispose();
    _businessAddressController.dispose();
    _websiteController.dispose();
    _socialMediaController.dispose();
    super.dispose();
  }

  Future<void> _pickAvatar() async {
    final picker = ImagePicker();
    final image = await picker.pickImage(source: ImageSource.gallery);
    if (image != null) {
      // Handle avatar upload to Storage and update Profile
    }
  }

  Future<void> _saveChanges() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isSaving = true);
    try {
      final oldProfile = ref.read(currentUserProfileProvider).value;
      if (oldProfile == null) throw Exception("Profile not found");

      final updatedProfile = ProfileUser(
        id: oldProfile.id,
        avatar: oldProfile.avatar,
        isVerified: oldProfile.isVerified,
        gender: oldProfile.gender,
        username: _usernameController.text.trim(),
        displayName: _displayNameController.text.trim(),
        bio: _bioController.text.trim(),
        phoneNumber: _phoneController.text.trim(),
        businessDetails: {
           'name': _businessNameController.text.trim(),
           'category': _businessCategory,
           'description': _businessDescriptionController.text.trim(),
           'address': _businessAddressController.text.trim(),
           'website': _websiteController.text.trim(),
           'socialMedia': _socialMediaController.text.trim(),
        },
      );

      await ref.read(profileRepositoryProvider).updateProfile(oldProfile.id, updatedProfile);
      ref.invalidate(currentUserProfileProvider);
      ref.invalidate(userProfileProvider(oldProfile.id));
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Profile updated successfully')));
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final profile = ref.watch(currentUserProfileProvider).value;
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
          'EDIT PROFILE',
          style: TextStyle(
            color: isDark ? Colors.white : Colors.black,
            fontWeight: FontWeight.w900,
            fontSize: 16,
            letterSpacing: 2,
          ),
        ),
        centerTitle: true,
        actions: [
          TextButton(
            onPressed: _isSaving ? null : _saveChanges,
            child: _isSaving 
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
              : const Text('SAVE', style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF4F46E5))),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Stack(
                  children: [
                    CircleAvatar(
                      radius: 60,
                      backgroundImage: profile?.avatar != null ? CachedNetworkImageProvider(profile!.avatar) : null,
                    ),
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: GestureDetector(
                        onTap: _pickAvatar,
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: const BoxDecoration(
                            color: Color(0xFF4F46E5),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(LucideIcons.camera, color: Colors.white, size: 20),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 48),
              _buildTextField(
                label: 'USERNAME',
                controller: _usernameController,
                hint: 'Choose a unique username',
                icon: LucideIcons.atSign,
              ),
              const SizedBox(height: 24),
              _buildTextField(
                label: 'DISPLAY NAME',
                controller: _displayNameController,
                hint: 'Enter your full name',
                icon: LucideIcons.user,
              ),
              const SizedBox(height: 24),
              _buildTextField(
                label: 'BIO',
                controller: _bioController,
                hint: 'Tell the world about yourself',
                icon: LucideIcons.text,
                maxLines: 4,
              ),
              const SizedBox(height: 24),
              _buildTextField(
                label: 'PHONE NUMBER',
                controller: _phoneController,
                hint: '+254 XXX XXX XXXX',
                icon: LucideIcons.phone,
              ),
              const SizedBox(height: 48),
              const Text('BUSINESS DETAILS', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF0F172A), letterSpacing: 1.5)),
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
                label: 'DESCRIPTION',
                controller: _businessDescriptionController,
                hint: 'What is the essence of your venture?',
                icon: LucideIcons.alignLeft,
                maxLines: 3,
              ),
              const SizedBox(height: 24),
              _buildTextField(
                label: 'OPERATIONAL ADDRESS',
                controller: _businessAddressController,
                hint: 'e.g. 123 Field Lane',
                icon: LucideIcons.mapPin,
              ),
              const SizedBox(height: 24),
              _buildTextField(
                label: 'WEB PORTAL',
                controller: _websiteController,
                hint: 'eyefield.me',
                icon: LucideIcons.globe,
              ),
              const SizedBox(height: 24),
              _buildTextField(
                label: 'SOCIAL FEED',
                controller: _socialMediaController,
                hint: '@handle',
                icon: LucideIcons.instagram,
              ),
              const SizedBox(height: 40),
            ],
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
    final isDark = Theme.of(context).brightness == Brightness.dark;

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
        TextFormField(
          controller: controller,
          maxLines: maxLines,
          style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(color: Color(0xFFCBD5E1), fontWeight: FontWeight.normal),
            prefixIcon: Icon(icon, size: 20, color: const Color(0xFF94A3B8)),
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
        ),
      ],
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
          style: const TextStyle(
            color: Color(0xFF94A3B8),
            fontSize: 10,
            fontWeight: FontWeight.w900,
            letterSpacing: 1.5,
          ),
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
        ),
      ],
    );
  }
}
