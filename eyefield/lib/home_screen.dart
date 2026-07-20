import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'features/echoes/presentation/screens/echo_list_screen.dart';
import 'features/cascadea/presentation/screens/product_list_screen.dart';
import 'features/chat/presentation/screens/conversation_list_screen.dart';
import 'features/profile/presentation/screens/profile_screen.dart';
import 'features/calls/presentation/screens/call_list_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 1;

  final List<Widget> _screens = [
    const EchoListScreen(),
    const ProductListScreen(),
    const ConversationListScreen(),
    const CallListScreen(),
    const ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDarkMode = theme.brightness == Brightness.dark;

    return Scaffold(
      body: Stack(
        children: [
          _screens[_currentIndex],
          Positioned(
            bottom: 20,
            left: 20,
            right: 20,
            child: Container(
              height: 70,
              decoration: BoxDecoration(
                color: (isDarkMode ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9)).withOpacity(0.95),
                borderRadius: BorderRadius.circular(35),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 20,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              padding: const EdgeInsets.symmetric(horizontal: 10),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                   _buildNavItem(0, LucideIcons.smile, 'ECHOES', isDarkMode),
                   _buildNavItem(1, LucideIcons.shoppingBag, 'CASCADEA', isDarkMode),
                   _buildNavItem(2, LucideIcons.messageSquare, 'CHATS', isDarkMode),
                   _buildNavItem(3, LucideIcons.phone, 'CALLS', isDarkMode),
                   _buildNavItem(4, LucideIcons.user, 'PROFILE', isDarkMode),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNavItem(int index, IconData icon, String label, bool isDarkMode) {
    bool isActive = _currentIndex == index;
    return GestureDetector(
      onTap: () => setState(() => _currentIndex = index),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isActive 
              ? (isDarkMode ? const Color(0xFF0F172A) : Colors.white) 
              : Colors.transparent,
          borderRadius: BorderRadius.circular(25),
          boxShadow: isActive
              ? [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ]
              : [],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 20,
              color: isActive 
                  ? (isDarkMode ? Colors.white : const Color(0xFF0F172A)) 
                  : const Color(0xFF94A3B8),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 8,
                fontWeight: FontWeight.w900,
                color: isActive 
                    ? (isDarkMode ? Colors.white : const Color(0xFF0F172A)) 
                    : const Color(0xFF94A3B8),
                letterSpacing: 0.5,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
