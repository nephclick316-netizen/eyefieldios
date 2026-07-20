import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/models/product.dart';

final cartProvider = StateNotifierProvider<CartNotifier, List<Product>>((ref) {
  return CartNotifier();
});

class CartNotifier extends StateNotifier<List<Product>> {
  CartNotifier() : super([]);

  void addToCart(Product product) {
    if (!state.any((p) => p.id == product.id)) {
      state = [...state, product];
    }
  }

  void removeFromCart(String productId) {
    state = state.where((p) => p.id != productId).toList();
  }

  void clearCart() {
    state = [];
  }
}
