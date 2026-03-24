import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../providers/cart_provider.dart';

class CartScreen extends ConsumerWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cartItems = ref.watch(cartProvider);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final total = cartItems.fold(0.0, (sum, item) => sum + item.price);

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(LucideIcons.chevronLeft, color: isDark ? Colors.white : Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text('YOUR BAG', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, letterSpacing: 1.5, color: isDark ? Colors.white : Colors.black)),
        centerTitle: true,
      ),
      body: SafeArea(
        child: cartItems.isEmpty
            ? Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: const [
                    Icon(LucideIcons.shoppingBag, size: 48, color: Colors.grey),
                    SizedBox(height: 16),
                    Text('BAG EMPTY', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, letterSpacing: 5, color: Colors.grey)),
                  ],
                ),
              )
            : Column(
                children: [
                  Expanded(
                    child: ListView.separated(
                      padding: const EdgeInsets.all(24),
                      itemCount: cartItems.length,
                      separatorBuilder: (context, index) => const SizedBox(height: 16),
                      itemBuilder: (context, index) {
                        final item = cartItems[index];
                        return Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(24),
                          ),
                          child: Row(
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(16),
                                child: item.imageUrl != null 
                                  ? CachedNetworkImage(imageUrl: item.imageUrl!, width: 64, height: 64, fit: BoxFit.cover)
                                  : Container(width: 64, height: 64, color: Colors.grey),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(item.name, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900), maxLines: 1),
                                    const SizedBox(height: 4),
                                    Text('\$${item.price.toStringAsFixed(0)}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.orange)),
                                  ],
                                ),
                              ),
                              IconButton(
                                icon: const Icon(LucideIcons.trash2, color: Colors.red),
                                style: IconButton.styleFrom(backgroundColor: isDark ? Colors.black : Colors.white),
                                onPressed: () {
                                  ref.read(cartProvider.notifier).removeFromCart(item.id);
                                },
                              )
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      border: Border(top: BorderSide(color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9))),
                    ),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('TOTAL CART', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1.5)),
                            Text('\$${total.toStringAsFixed(2)}', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900)),
                          ],
                        ),
                        const SizedBox(height: 24),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: () {
                              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Checkout flow pending')));
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF0F172A),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 20),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                            ),
                            child: const Text('CHECKOUT NOW', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1.5)),
                          ),
                        ),
                      ],
                    ),
                  )
                ],
              ),
      ),
    );
  }
}
