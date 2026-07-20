import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:image_picker/image_picker.dart';
import '../providers/product_providers.dart';
import '../../../auth/presentation/providers/auth_providers.dart';

class SellProductScreen extends ConsumerStatefulWidget {
  const SellProductScreen({super.key});

  @override
  ConsumerState<SellProductScreen> createState() => _SellProductScreenState();
}

class _SellProductScreenState extends ConsumerState<SellProductScreen> {
  final _titleController = TextEditingController();
  final _priceController = TextEditingController();
  final _descController = TextEditingController();
  
  String _selectedCategory = 'Home';
  String _selectedCondition = 'New';
  List<XFile> _images = [];
  bool _isLoading = false;

  final List<String> _categories = ['Accommodations', 'Rental/Hiring', 'Auto Mobile', 'Fashion', 'Tech', 'Home', 'Art', 'Lifestyle', 'Food', 'Services', 'Real Estate'];
  final List<String> _conditions = ['New', 'Used', 'Refurbished'];

  bool get _isServiceOrRental => _selectedCategory == 'Services' || _selectedCategory == 'Rental/Hiring';

  Future<void> _pickImages() async {
    if (_images.length >= 3) return;
    final picker = ImagePicker();
    final picked = await picker.pickMultiImage(limit: 3 - _images.length);
    if (picked.isNotEmpty) {
      setState(() {
        _images.addAll(picked);
      });
    }
  }

  Future<void> _submit() async {
    if (_titleController.text.isEmpty || (_priceController.text.isEmpty && !_isServiceOrRental) || _images.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill all required fields and add at least 1 image.')));
      return;
    }

    final userId = ref.read(authStateProvider).value?.session?.user.id;
    if (userId == null) return;

    setState(() => _isLoading = true);
    
    try {
      final price = _isServiceOrRental ? 0.0 : (double.tryParse(_priceController.text) ?? 0.0);
      await ref.read(productRepositoryProvider).createProduct(
        userId,
        _titleController.text.trim(),
        price,
        _descController.text.trim(),
        _selectedCategory,
        _isServiceOrRental ? null : _selectedCondition,
        _images,
      );
      ref.invalidate(productsProvider);
      ref.invalidate(filteredProductsProvider);
      if (!mounted) return;
      Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      setState(() => _isLoading = false);
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
        leading: IconButton(icon: Icon(LucideIcons.x, color: theme.colorScheme.onSurface), onPressed: () => Navigator.pop(context)),
        title: Text('LIST PRODUCT', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, letterSpacing: 1.5, color: theme.colorScheme.onSurface)),
        centerTitle: true,
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Product Images (max 3)', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF94A3B8), letterSpacing: 1.5)),
                const SizedBox(height: 12),
                Row(
                  children: [
                    ..._images.asMap().entries.map((entry) => Padding(
                      padding: const EdgeInsets.only(right: 12),
                      child: Stack(
                        children: [
                          Container(
                            width: 100, height: 100,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(16),
                              image: DecorationImage(
                                image: (kIsWeb 
                                  ? NetworkImage(entry.value.path) 
                                  : FileImage(File(entry.value.path))) as ImageProvider, 
                                fit: BoxFit.cover
                              ),
                            ),
                          ),
                          Positioned(
                            top: 4, right: 4,
                            child: GestureDetector(
                              onTap: () => setState(() => _images.removeAt(entry.key)),
                              child: Container(
                                padding: const EdgeInsets.all(4),
                                decoration: BoxDecoration(color: Colors.black.withOpacity(0.5), shape: BoxShape.circle),
                                child: const Icon(LucideIcons.x, size: 12, color: Colors.white),
                              ),
                            ),
                          ),
                        ]
                      ),
                    )),
                    if (_images.length < 3)
                      GestureDetector(
                        onTap: _pickImages,
                        child: Container(
                          width: 100, height: 100,
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFFCBD5E1), style: BorderStyle.solid),
                          ),
                          child: const Center(child: Icon(LucideIcons.plus, color: Color(0xFF94A3B8))),
                        ),
                      ),
                  ],
                ),
                
                const SizedBox(height: 32),
                
                TextField(
                  controller: _titleController,
                  style: TextStyle(color: isDark ? Colors.white : Colors.black, fontWeight: FontWeight.bold),
                  decoration: InputDecoration(
                    labelText: 'Product Name',
                    labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF94A3B8), letterSpacing: 1.5),
                    floatingLabelBehavior: FloatingLabelBehavior.always,
                    prefixIcon: const Icon(LucideIcons.tag, size: 18),
                    filled: true,
                    fillColor: isDark ? const Color(0xFF0F172A) : Colors.white,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide.none),
                  ),
                ),
                const SizedBox(height: 20),
                
                Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: _selectedCategory,
                        dropdownColor: isDark ? const Color(0xFF1E293B) : Colors.white,
                        style: TextStyle(color: isDark ? Colors.white : Colors.black, fontWeight: FontWeight.bold),
                        decoration: InputDecoration(
                          labelText: 'Category',
                          labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF94A3B8), letterSpacing: 1.5),
                          floatingLabelBehavior: FloatingLabelBehavior.always,
                          prefixIcon: const Icon(LucideIcons.layout, size: 18),
                          filled: true,
                          fillColor: isDark ? const Color(0xFF0F172A) : Colors.white,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide.none),
                        ),
                        items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c, style: const TextStyle(fontSize: 14)))).toList(),
                        onChanged: (v) => setState(() => _selectedCategory = v!),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: TextField(
                        controller: _priceController,
                        keyboardType: TextInputType.number,
                        enabled: !_isServiceOrRental,
                        style: TextStyle(color: isDark ? Colors.white : Colors.black, fontWeight: FontWeight.bold),
                        decoration: InputDecoration(
                          labelText: 'Price (USD)',
                          labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF94A3B8), letterSpacing: 1.5),
                          floatingLabelBehavior: FloatingLabelBehavior.always,
                          prefixIcon: const Icon(LucideIcons.dollarSign, size: 18),
                          filled: true,
                          fillColor: isDark ? const Color(0xFF0F172A) : Colors.white,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide.none),
                        ),
                      ),
                    ),
                  ],
                ),
                
                const SizedBox(height: 20),
                DropdownButtonFormField<String>(
                  value: _selectedCondition,
                  dropdownColor: isDark ? const Color(0xFF1E293B) : Colors.white,
                  style: TextStyle(color: isDark ? Colors.white : Colors.black, fontWeight: FontWeight.bold),
                  decoration: InputDecoration(
                    labelText: 'Condition',
                    labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF94A3B8), letterSpacing: 1.5),
                    floatingLabelBehavior: FloatingLabelBehavior.always,
                    prefixIcon: const Icon(LucideIcons.info, size: 18),
                    filled: true,
                    fillColor: isDark ? const Color(0xFF0F172A) : Colors.white,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide.none),
                  ),
                  items: _conditions.map((c) => DropdownMenuItem(value: c, child: Text(c, style: const TextStyle(fontSize: 14)))).toList(),
                  onChanged: _isServiceOrRental ? null : (v) => setState(() => _selectedCondition = v!),
                ),
                
                const SizedBox(height: 20),
                TextField(
                  controller: _descController,
                  maxLines: 4,
                  style: TextStyle(color: isDark ? Colors.white : Colors.black, fontWeight: FontWeight.bold),
                  decoration: InputDecoration(
                    labelText: 'Description',
                    labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF94A3B8), letterSpacing: 1.5),
                    floatingLabelBehavior: FloatingLabelBehavior.always,
                    filled: true,
                    fillColor: isDark ? const Color(0xFF0F172A) : Colors.white,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide.none),
                  ),
                ),
                
                const SizedBox(height: 48),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: _submit,
                    icon: const Icon(LucideIcons.check),
                    label: const Text('LIST IN CASCADEA', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1.5)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0F172A),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 20),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                    ),
                  ),
                ),
              ],
            ),
          ),
    );
  }
}
