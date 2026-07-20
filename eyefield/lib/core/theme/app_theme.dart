import 'package:flutter/material.dart';

class AppTheme {
  // Brand Colors
  static const Color primaryBlue = Color(0xFF0EA5E9);
  static const Color navyDark = Color(0xFF00172D);
  static const Color slateGray = Color(0xFF64748B);
  static const Color lightGray = Color(0xFFF8FAFC);
  static const Color borderGray = Color(0xFFE2E8F0);
  static const Color textGray = Color(0xFF94A3B8);

  // Light Theme (Default)
  static final ThemeData lightTheme = ThemeData(
    brightness: Brightness.light,
    primaryColor: primaryBlue,
    scaffoldBackgroundColor: Colors.white,
    colorScheme: const ColorScheme.light(
      primary: primaryBlue,
      surface: Colors.white,
      onSurface: navyDark,
      secondary: Color(0xFF2563EB), // Link Blue
    ),
    dividerTheme: const DividerThemeData(color: borderGray),
    textTheme: const TextTheme(
      displayLarge: TextStyle(color: navyDark, fontWeight: FontWeight.bold),
      bodyLarge: TextStyle(color: slateGray),
      bodyMedium: TextStyle(color: slateGray),
    ),
    useMaterial3: true,
  );

  // Dark Theme
  static final ThemeData darkTheme = ThemeData(
    brightness: Brightness.dark,
    primaryColor: primaryBlue,
    scaffoldBackgroundColor: const Color(0xFF0F172A),
    colorScheme: const ColorScheme.dark(
      primary: primaryBlue,
      surface: Color(0xFF1E293B),
      onSurface: Colors.white,
      secondary: primaryBlue,
    ),
    cardTheme: CardTheme(
      color: const Color(0xFF1E293B),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ),
    useMaterial3: true,
  );
}
