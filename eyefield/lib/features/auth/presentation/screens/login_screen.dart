import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../providers/auth_providers.dart';
import 'signup_screen.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;

  Future<void> _signIn() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    try {
      await ref.read(authRepositoryProvider).signInWithEmail(
            email: _emailController.text.trim(),
            password: _passwordController.text.trim(),
          );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isDarkMode = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 32.0),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Logo
                Image.asset(
                  'assets/images/logo.png',
                  height: 120,
                  fit: BoxFit.contain,
                  color: isDarkMode ? Colors.white : null, // Optional: invert/white logo in dark mode
                ),
                const SizedBox(height: 16),
                // App Name
                Text(
                  'EyeField',
                  style: TextStyle(
                    fontSize: 42,
                    fontWeight: FontWeight.w900,
                    color: colorScheme.onSurface,
                    letterSpacing: -1.5,
                  ),
                ),
                // Tagline
                Text(
                  'Welcome back to the EyeField.',
                  style: TextStyle(
                    fontSize: 16,
                    color: isDarkMode ? Colors.white70 : const Color(0xFF64748B),
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 40),
                // Google Sign In Button
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: () {
                      // Handle Google Sign In
                    },
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      side: BorderSide(
                        color: isDarkMode ? Colors.white24 : const Color(0xFFE2E8F0),
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      backgroundColor: isDarkMode ? Colors.white10 : Colors.white,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Image.asset(
                          'assets/images/google_logo.png',
                          height: 24,
                        ),
                        const SizedBox(width: 12),
                        Text(
                          'Continue with Google',
                          style: TextStyle(
                            color: isDarkMode ? Colors.white : Colors.black,
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 32),
                // Divider
                Row(
                  children: [
                    Expanded(
                      child: Divider(
                        color: isDarkMode ? Colors.white24 : const Color(0xFFE2E8F0),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Text(
                        'OR USE EMAIL',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: isDarkMode ? Colors.white38 : const Color(0xFF94A3B8),
                          letterSpacing: 1.2,
                        ),
                      ),
                    ),
                    Expanded(
                      child: Divider(
                        color: isDarkMode ? Colors.white24 : const Color(0xFFE2E8F0),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 32),
                // Email Field
                _buildTextField(
                  context: context,
                  controller: _emailController,
                  hintText: 'Email address',
                  icon: LucideIcons.mail,
                  keyboardType: TextInputType.emailAddress,
                  validator: (v) => v?.isEmpty ?? true ? 'Enter email' : null,
                ),
                const SizedBox(height: 16),
                // Password Field
                _buildTextField(
                  context: context,
                  controller: _passwordController,
                  hintText: 'Password',
                  icon: LucideIcons.lock,
                  obscureText: true,
                  validator: (v) => v?.isEmpty ?? true ? 'Enter password' : null,
                ),
                const SizedBox(height: 8),
                // Forgot Identity
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () {},
                    child: Text(
                      'FORGOT IDENTITY?',
                      style: TextStyle(
                        color: isDarkMode ? colorScheme.primary : const Color(0xFF2563EB),
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                // Sign In Button
                SizedBox(
                  width: double.infinity,
                  child: Container(
                    decoration: BoxDecoration(
                      boxShadow: [
                        BoxShadow(
                          color: (isDarkMode ? Colors.black : const Color(0xFF0F172A))
                              .withOpacity(0.3),
                          blurRadius: 15,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _signIn,
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 20),
                        backgroundColor: isDarkMode ? colorScheme.primary : const Color(0xFF0F172A),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Text(
                              'SIGN IN',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 1.5,
                              ),
                            ),
                    ),
                  ),
                ),
                const SizedBox(height: 48),
                // Footer
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'New here? ',
                      style: TextStyle(
                        color: isDarkMode ? Colors.white60 : const Color(0xFF64748B),
                      ),
                    ),
                    GestureDetector(
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(builder: (_) => const SignupScreen()),
                        );
                      },
                      child: Text(
                        'Join the Field',
                        style: TextStyle(
                          color: colorScheme.onSurface,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTextField({
    required BuildContext context,
    required TextEditingController controller,
    required String hintText,
    required IconData icon,
    bool obscureText = false,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;
    return Container(
      decoration: BoxDecoration(
        color: isDarkMode ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
      ),
      child: TextFormField(
        controller: controller,
        obscureText: obscureText,
        keyboardType: keyboardType,
        validator: validator,
        style: TextStyle(color: isDarkMode ? Colors.white : Colors.black),
        decoration: InputDecoration(
          hintText: hintText,
          hintStyle: TextStyle(
            color: isDarkMode ? Colors.white38 : const Color(0xFF94A3B8),
          ),
          prefixIcon: Icon(
            icon,
            color: isDarkMode ? Colors.white38 : const Color(0xFF94A3B8),
            size: 20,
          ),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(vertical: 18, horizontal: 16),
        ),
      ),
    );
  }
}
