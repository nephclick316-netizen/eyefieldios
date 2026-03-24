import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../providers/product_providers.dart';
import '../../domain/models/product.dart';
import '../../../auth/presentation/providers/auth_providers.dart';
import 'product_detail_screen.dart';
import 'sell_product_screen.dart';
import 'cart_screen.dart';

class ProductListScreen extends ConsumerWidget {
  const ProductListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final isDarkMode = theme.brightness == Brightness.dark;
    final productsAsync = ref.watch(filteredProductsProvider);

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Custom Top Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              child: Row(
                children: [
                  Text(
                    'EyeField',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                      color: isDarkMode ? Colors.white : const Color(0xFF00172D),
                    ),
                  ),
                  const Spacer(),
                  Stack(
                    children: [
                      const Icon(LucideIcons.bell, color: Color(0xFF64748B)),
                      Positioned(
                        right: 0,
                        top: 0,
                        child: Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: Colors.red,
                            shape: BoxShape.circle,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: 20),
                  const Icon(LucideIcons.share2, color: Color(0xFF64748B)),
                  const SizedBox(width: 20),
                  const Icon(LucideIcons.compass, color: Color(0xFF64748B)),
                  const SizedBox(width: 16),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEBE9FE),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(LucideIcons.layoutGrid, size: 16, color: Color(0xFF4F46E5)),
                        const SizedBox(width: 6),
                        const Text(
                          'ENDOCARD',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF4F46E5),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Cascadea Title & Currency
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: Row(
                children: [
                   Text(
                    'Cascadea',
                    style: TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.w900,
                      color: theme.colorScheme.onSurface,
                    ),
                  ),
                  const Spacer(),
                  GestureDetector(
                    onTap: () {
                       final current = ref.read(selectedCurrencyProvider);
                       ref.read(selectedCurrencyProvider.notifier).state = 
                           current == 'USD' ? 'EUR' : (current == 'EUR' ? 'GBP' : (current == 'GBP' ? 'UGX' : 'USD'));
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        border: Border.all(color: const Color(0xFFF1F5F9)),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        children: [
                          const Icon(LucideIcons.banknote, size: 16, color: Color(0xFF64748B)),
                          const SizedBox(width: 6),
                          Text(
                            ref.watch(selectedCurrencyProvider),
                            style: const TextStyle(
                               fontSize: 12,
                               fontWeight: FontWeight.bold,
                               color: Color(0xFF475569),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  GestureDetector(
                    onTap: () => _showPriceFilterDialog(context, ref),
                    child: const Icon(LucideIcons.sliders, color: Color(0xFF475569)),
                  ),
                  const SizedBox(width: 16),
                  GestureDetector(
                    onTap: () {
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const CartScreen()));
                    },
                    child: const Icon(LucideIcons.shoppingCart, color: Color(0xFF475569)),
                  ),
                ],
              ),
            ),

            // Search Bar & Sell Button
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              child: Row(
                children: [
                  Expanded(
                    child: Container(
                      height: 54,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.03),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: TextField(
                        onChanged: (text) => ref.read(productSearchQueryProvider.notifier).state = text,
                        style: TextStyle(color: isDarkMode ? Colors.white : Colors.black),
                        decoration: InputDecoration(
                          hintText: 'Search boutique...',
                          hintStyle: const TextStyle(color: Color(0xFF94A3B8)),
                          prefixIcon: const Icon(LucideIcons.search, color: Color(0xFFCBD5E1), size: 20),
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  GestureDetector(
                    onTap: () {
                       final userId = ref.read(authStateProvider).value?.session?.user.id;
                       if (userId == null) {
                         ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Must be logged in to sell')));
                         return;
                       }
                       Navigator.push(context, MaterialPageRoute(builder: (_) => const SellProductScreen()));
                    },
                    child: Container(
                    height: 54,
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F172A),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Center(
                      child: Row(
                        children: const [
                          Icon(LucideIcons.plus, color: Colors.white, size: 20),
                          SizedBox(width: 8),
                          Text(
                            'SELL',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1.2,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  ),
                ],
              ),
            ),

            // Category Tabs
            ref.watch(productsProvider(0)).when(
              data: (products) {
                final categories = ['ALL', ...products.map((p) => p.category?.toUpperCase() ?? '').where((c) => c.isNotEmpty).toSet()];
                return SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  child: Row(
                    children: categories.map((c) => _buildTab(context, ref, c)).toList(),
                  ),
                );
              },
              loading: () => const SizedBox(height: 50, child: Center(child: CircularProgressIndicator())),
              error: (_, __) => const SizedBox(),
            ),

            const Divider(height: 32, color: Color(0xFFF1F5F9)),

            // Product Grid
            Expanded(
              child: productsAsync.when(
                data: (products) => GridView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 0.75,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 20,
                  ),
                  itemCount: products.length,
                  itemBuilder: (context, index) => ProductCard(product: products[index]),
                ),
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, st) => Center(child: Text('Error: $e')),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTab(BuildContext context, WidgetRef ref, String title) {
    final isActive = ref.watch(productCategoryFilterProvider) == title;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return GestureDetector(
      onTap: () => ref.read(productCategoryFilterProvider.notifier).state = title,
      child: Container(
        margin: const EdgeInsets.only(right: 16),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        decoration: BoxDecoration(
          color: isActive 
              ? (isDark ? Colors.white : const Color(0xFF0F172A)) 
              : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          boxShadow: isActive
              ? [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: Text(
          title,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w900,
            color: isActive 
                ? (isDark ? const Color(0xFF0F172A) : Colors.white) 
                : const Color(0xFF64748B),
            letterSpacing: 0.5,
          ),
        ),
      ),
    );
  }



  void _showPriceFilterDialog(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    final products = ref.read(productsProvider(0)).value ?? [];
    double minVal = 0.0;
    double maxVal = 10000.0;
    if (products.isNotEmpty) {
      minVal = products.map((p) => p.price).reduce((a, b) => a < b ? a : b);
      maxVal = products.map((p) => p.price).reduce((a, b) => a > b ? a : b);
    }
    if (minVal == maxVal) maxVal += 100.0;

    final currentRange = ref.read(productPriceRangeFilterProvider);
    double sliderMin = currentRange?[0] ?? minVal;
    double sliderMax = currentRange?[1] ?? maxVal;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          backgroundColor: theme.scaffoldBackgroundColor,
          title: Text('Filter by Price', style: TextStyle(color: isDark ? Colors.white : Colors.black, fontWeight: FontWeight.w900)),
          content: SizedBox(
            height: 100,
            child: Column(
              children: [
                RangeSlider(
                  values: RangeValues(sliderMin, sliderMax),
                  min: minVal,
                  max: maxVal,
                  divisions: 100,
                  labels: RangeLabels('\$${sliderMin.round()}', '\$${sliderMax.round()}'),
                  activeColor: const Color(0xFF0F172A),
                  onChanged: (RangeValues values) {
                    setState(() {
                      sliderMin = values.start;
                      sliderMax = values.end;
                    });
                  },
                ),
                Text('Range: \$${sliderMin.round()} - \$${sliderMax.round()}', style: TextStyle(color: isDark ? Colors.white : Colors.black)),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () {
                ref.read(productPriceRangeFilterProvider.notifier).state = null;
                Navigator.pop(context);
              },
              child: const Text('Clear', style: TextStyle(color: Colors.red)),
            ),
            ElevatedButton(
              onPressed: () {
                ref.read(productPriceRangeFilterProvider.notifier).state = [sliderMin, sliderMax];
                Navigator.pop(context);
              },
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00007A), foregroundColor: Colors.white),
              child: const Text('Apply'),
            ),
          ],
        ),
      ),
    );
  }
}

class ProductCard extends StatelessWidget {
  final Product product;
  const ProductCard({super.key, required this.product});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
         Navigator.push(context, MaterialPageRoute(builder: (_) => ProductDetailScreen(product: product)));
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Stack(
              children: [
                Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(28),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.08),
                        blurRadius: 15,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(28),
                    child: product.imageUrl != null
                        ? CachedNetworkImage(
                            imageUrl: product.imageUrl!,
                            width: double.infinity,
                            fit: BoxFit.cover,
                            placeholder: (context, url) => Container(color: Colors.grey[100]),
                            errorWidget: (context, url, err) => const Icon(LucideIcons.image),
                          )
                        : Container(color: Colors.grey[100], child: const Icon(LucideIcons.image)),
                  ),
                ),
                Positioned(
                  right: 12,
                  bottom: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.1),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Consumer(
                      builder: (context, ref, child) {
                        final currency = ref.watch(selectedCurrencyProvider);
                        String symbol = '\$';
                        double rate = 1.0;
                        if (currency == 'EUR') { symbol = '€'; rate = 0.92; }
                        else if (currency == 'GBP') { symbol = '£'; rate = 0.79; }
                        else if (currency == 'UGX') { symbol = 'USh '; rate = 3750; }
                        return Text(
                          '$symbol${(product.price * rate).toStringAsFixed(0)}',
                          style: const TextStyle(
                            color: Color(0xFF0F172A),
                            fontWeight: FontWeight.w900,
                            fontSize: 12,
                          ),
                        );
                      }
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  product.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                     Column(
                       crossAxisAlignment: CrossAxisAlignment.start,
                       children: [
                         Text(
                          '@${product.seller.username}',
                          style: const TextStyle(
                            fontSize: 11,
                            color: Color(0xFF94A3B8),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            const Icon(LucideIcons.star, size: 10, color: Colors.orange),
                            const SizedBox(width: 4),
                            Text(
                              product.averageRating == 0 ? 'NEW' : product.averageRating.toStringAsFixed(1),
                              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF64748B)),
                            ),
                          ],
                        ),
                       ],
                     ),
                    const Spacer(),
                    const Icon(LucideIcons.arrowUpRight, size: 14, color: Color(0xFFCBD5E1)),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
