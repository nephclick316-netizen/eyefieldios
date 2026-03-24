import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:eyefield/features/cascadea/data/repositories/product_repository.dart';
import 'package:eyefield/features/cascadea/domain/models/product.dart';

final productRepositoryProvider = Provider<ProductRepository>((ref) {
  return ProductRepository();
});

final productsProvider = FutureProvider.family<List<Product>, int>((ref, page) async {
  return ref.watch(productRepositoryProvider).getProducts(page: page);
});

final productSearchQueryProvider = StateProvider<String>((ref) => '');
final productCategoryFilterProvider = StateProvider<String>((ref) => 'ALL');
final selectedCurrencyProvider = StateProvider<String>((ref) => 'USD');
final productPriceRangeFilterProvider = StateProvider<List<double>?>((ref) => null);

final filteredProductsProvider = FutureProvider<List<Product>>((ref) async {
  final products = await ref.watch(productsProvider(0).future);
  final query = ref.watch(productSearchQueryProvider).toLowerCase();
  final category = ref.watch(productCategoryFilterProvider);
  final priceRange = ref.watch(productPriceRangeFilterProvider);

  return products.where((p) {
    final matchesQuery = query.isEmpty || p.name.toLowerCase().contains(query) || p.description.toLowerCase().contains(query);
    final matchesCategory = category == 'ALL' || (p.category?.toUpperCase() ?? '') == category || (category == 'RENTAL/HIRING' && (p.category?.toUpperCase() ?? '').contains('RENT'));
    final matchesPrice = priceRange == null || (p.price >= priceRange[0] && p.price <= priceRange[1]);
    return matchesQuery && matchesCategory && matchesPrice;
  }).toList();
});

final productDetailProvider = FutureProvider.family<Product?, String>((ref, id) async {
  return ref.watch(productRepositoryProvider).getProductById(id);
});
