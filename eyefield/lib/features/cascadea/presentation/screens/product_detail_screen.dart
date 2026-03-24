import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:carousel_slider/carousel_slider.dart';
import 'package:eyefield/features/cascadea/domain/models/product.dart';
import 'package:eyefield/features/cascadea/presentation/providers/product_providers.dart';
import 'package:eyefield/features/cascadea/presentation/providers/cart_provider.dart';
import 'package:eyefield/features/auth/presentation/providers/auth_providers.dart';
import 'package:eyefield/features/profile/presentation/screens/profile_screen.dart';

class ProductDetailScreen extends ConsumerStatefulWidget {
  final Product product;
  const ProductDetailScreen({super.key, required this.product});

  @override
  ConsumerState<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends ConsumerState<ProductDetailScreen> {
  int _currentImageIndex = 0;
  int _userRating = 0;
  final TextEditingController _commentController = TextEditingController();
  bool _submittingReview = false;
  
  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    final images = widget.product.imageUrls.isNotEmpty 
        ? widget.product.imageUrls 
        : (widget.product.imageUrl != null ? [widget.product.imageUrl!] : ['https://picsum.photos/800']);
        
    final currency = ref.watch(selectedCurrencyProvider);
    String symbol = '\$';
    double rate = 1.0;
    if (currency == 'EUR') { symbol = '€'; rate = 0.92; }
    else if (currency == 'GBP') { symbol = '£'; rate = 0.79; }
    else if (currency == 'UGX') { symbol = 'USh '; rate = 3750; }

    final isServiceOrRental = widget.product.category == 'Services' || widget.product.category == 'Rental/Hiring';
    final currentUser = ref.watch(authStateProvider).value?.session?.user;
    final hasReviewed = widget.product.comments.any((c) => c.userId == currentUser?.id);

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: MediaQuery.of(context).size.width,
            pinned: true,
            backgroundColor: isDark ? Colors.black : Colors.white,
            leading: Padding(
              padding: const EdgeInsets.all(8.0),
              child: GestureDetector(
                onTap: () => Navigator.pop(context),
                child: Container(
                  decoration: BoxDecoration(color: Colors.black.withOpacity(0.3), shape: BoxShape.circle),
                  child: const Icon(LucideIcons.chevronLeft, color: Colors.white),
                ),
              ),
            ),
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                children: [
                   CarouselSlider(
                     options: CarouselOptions(
                       height: MediaQuery.of(context).size.width,
                       viewportFraction: 1.0,
                       enableInfiniteScroll: images.length > 1,
                       onPageChanged: (index, reason) => setState(() => _currentImageIndex = index),
                     ),
                     items: images.map((img) {
                        return Builder(
                          builder: (BuildContext context) {
                            return CachedNetworkImage(
                              imageUrl: img,
                              fit: BoxFit.cover,
                              width: double.infinity,
                            );
                          },
                        );
                     }).toList(),
                   ),
                   if (images.length > 1)
                     Positioned(
                       bottom: 20, left: 0, right: 0,
                       child: Column(
                         children: [
                           Row(
                             mainAxisAlignment: MainAxisAlignment.center,
                             children: images.asMap().entries.map((entry) {
                               return Container(
                                 width: 8.0, height: 8.0,
                                 margin: const EdgeInsets.symmetric(horizontal: 4.0),
                                 decoration: BoxDecoration(
                                   shape: BoxShape.circle,
                                   color: _currentImageIndex == entry.key ? Colors.orange : Colors.white.withOpacity(0.5)
                                 ),
                               );
                             }).toList(),
                           ),
                           const SizedBox(height: 12),
                           SizedBox(
                             height: 60,
                             child: ListView.separated(
                               scrollDirection: Axis.horizontal,
                               padding: const EdgeInsets.symmetric(horizontal: 20),
                               itemCount: images.length,
                               separatorBuilder: (_, __) => const SizedBox(width: 8),
                               itemBuilder: (context, index) {
                                 return GestureDetector(
                                   onTap: () {
                                     // CarouselSlider controller would be better here, 
                                     // but we can just setState if we have a controller.
                                     // Since I don't have a controller assigned yet, 
                                     // I'll add one if needed or just use the current index update.
                                   },
                                   child: Container(
                                     width: 60,
                                     decoration: BoxDecoration(
                                       borderRadius: BorderRadius.circular(12),
                                       border: Border.all(
                                         color: _currentImageIndex == index ? Colors.orange : Colors.transparent,
                                         width: 2,
                                       ),
                                     ),
                                     clipBehavior: Clip.hardEdge,
                                     child: CachedNetworkImage(
                                       imageUrl: images[index],
                                       fit: BoxFit.cover,
                                     ),
                                   ),
                                 );
                               },
                             ),
                           ),
                         ],
                       ),
                     ),
                ],
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Text(
                            (widget.product.category ?? 'ITEM').toUpperCase(),
                            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.orange, letterSpacing: 3),
                          ),
                          if (widget.product.condition != null && !isServiceOrRental)
                            Padding(
                              padding: const EdgeInsets.only(left: 8),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(color: const Color(0xFF0F172A), borderRadius: BorderRadius.circular(12)),
                                child: Text(widget.product.condition!.toUpperCase(), style: const TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Colors.white)),
                              ),
                            ),
                        ],
                      ),
                      if (!isServiceOrRental)
                         Text(
                           '$symbol${(widget.product.price * rate).toStringAsFixed(0)}',
                           style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: isDark ? Colors.white : const Color(0xFF0F172A)),
                         ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    widget.product.name,
                    style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w900, letterSpacing: -1),
                  ),
                  const SizedBox(height: 24),
                  GestureDetector(
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ProfileScreen(userId: widget.product.seller.id))),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9)),
                      ),
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 24,
                            backgroundImage: CachedNetworkImageProvider(widget.product.seller.avatar),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('@${widget.product.seller.username}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900)),
                                const Text('VIEW PROFILE & LISTINGS', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF94A3B8))),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(color: isDark ? Colors.black : Colors.white, borderRadius: BorderRadius.circular(16)),
                            child: const Icon(LucideIcons.user, color: Colors.orange, size: 20),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Text('DESCRIPTION', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF94A3B8), letterSpacing: 2)),
                  const SizedBox(height: 8),
                  Text(
                    widget.product.description,
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569), height: 1.6),
                  ),
                  const SizedBox(height: 32),
                  const Divider(),
                  const SizedBox(height: 16),
                  _buildRatingsSection(context, ref, isDark, currentUser?.id, hasReviewed),
                  const SizedBox(height: 24),
                  const Divider(),
                  const SizedBox(height: 16),
                  const Text('RELATED PRODUCTS', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF94A3B8), letterSpacing: 2)),
                  const SizedBox(height: 16),
                  _buildRelatedProducts(ref),
                  const SizedBox(height: 48),
                ],
              ),
            ),
          )
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Row(
            children: [
              if (!isServiceOrRental)
                Expanded(
                  flex: 1,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      ref.read(cartProvider.notifier).addToCart(widget.product);
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Added to bag')));
                    },
                    icon: const Icon(LucideIcons.shoppingBag, size: 18),
                    label: const Text('ADD TO BAG', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 1.5)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
                      foregroundColor: isDark ? Colors.white : const Color(0xFF0F172A),
                      padding: const EdgeInsets.symmetric(vertical: 20),
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                    ),
                  ),
                ),
              if (!isServiceOrRental) const SizedBox(width: 16),
              Expanded(
                flex: 1,
                child: ElevatedButton(
                  onPressed: () {},
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0F172A),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 20),
                    elevation: 10,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                  ),
                  child: Text(isServiceOrRental ? 'INQUIRE NOW' : 'BUY NOW', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 1.5)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRatingsSection(BuildContext context, WidgetRef ref, bool isDark, String? userId, bool hasReviewed) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('RATINGS & REVIEWS', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF94A3B8), letterSpacing: 2)),
            Row(
              children: [
                const Icon(LucideIcons.star, size: 16, color: Colors.orange),
                const SizedBox(width: 4),
                Text(widget.product.averageRating == 0 ? 'NEW' : widget.product.averageRating.toStringAsFixed(1), style: const TextStyle(fontWeight: FontWeight.w900)),
              ],
            )
          ],
        ),
        const SizedBox(height: 16),
        if (userId != null && !hasReviewed && userId != widget.product.seller.id)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(24)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Your Review:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Row(
                  children: List.generate(5, (index) => GestureDetector(
                    onTap: () => setState(() => _userRating = index + 1),
                    child: Icon(LucideIcons.star, color: _userRating > index ? Colors.orange : Colors.grey, size: 28),
                  )),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _commentController,
                  maxLines: 2,
                  style: TextStyle(color: isDark ? Colors.white : Colors.black, fontSize: 14),
                  decoration: InputDecoration(
                    hintText: 'Share your thoughts...',
                    filled: true,
                    fillColor: isDark ? Colors.black : Colors.white,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: (_submittingReview || _userRating == 0) ? null : () async {
                      setState(() => _submittingReview = true);
                      try {
                        await ref.read(productRepositoryProvider).addProductRating(widget.product.id, userId, _userRating);
                        if (_commentController.text.isNotEmpty) {
                          await ref.read(productRepositoryProvider).addProductComment(widget.product.id, userId, _commentController.text.trim(), _userRating);
                        }
                        ref.invalidate(productDetailProvider(widget.product.id));
                        if (!mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Review submitted!')));
                        setState(() { _userRating = 0; _commentController.clear(); });
                      } catch (e) {
                        if (!mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
                      } finally {
                        if (mounted) setState(() => _submittingReview = false);
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF00007A),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    child: _submittingReview ? const SizedBox(height: 16, width:16, child: CircularProgressIndicator(color:Colors.white, strokeWidth:2)) : const Text('SUBMIT'),
                  ),
                )
              ],
            ),
          ),
        const SizedBox(height: 16),
        if (widget.product.comments.isEmpty)
          const Text('No reviews yet.', style: TextStyle(color: Colors.grey, fontSize: 12))
        else
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: widget.product.comments.length,
            separatorBuilder: (context, index) => const SizedBox(height: 16),
            itemBuilder: (context, index) {
              final comment = widget.product.comments[index];
              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  CircleAvatar(radius: 16, backgroundImage: CachedNetworkImageProvider(comment.user.avatar)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('@${comment.user.username}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                            Row(children: List.generate(5, (sIndex) => Icon(LucideIcons.star, size: 10, color: comment.rating > sIndex ? Colors.orange : Colors.grey))),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(comment.text, style: TextStyle(color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569), fontSize: 13)),
                      ]
                    )
                  )
                ]
              );
            }
          )
      ]
    );
  }

  Widget _buildRelatedProducts(WidgetRef ref) {
    final asyncProducts = ref.watch(filteredProductsProvider);
    return asyncProducts.when(
      data: (allProducts) {
        final related = allProducts.where((p) => p.category == widget.product.category && p.id != widget.product.id).take(4).toList();
        if (related.isEmpty) return const Text('No related products.', style: TextStyle(color: Colors.grey, fontSize: 12));
        
        return SizedBox(
          height: 120,
          child: ListView.separated(
             scrollDirection: Axis.horizontal,
             itemCount: related.length,
             separatorBuilder: (_, __) => const SizedBox(width: 16),
             itemBuilder: (context, index) {
                final p = related[index];
                return GestureDetector(
                   onTap: () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => ProductDetailScreen(product: p))),
                   child: Container(
                     width: 100,
                     decoration: BoxDecoration(
                        color: Colors.grey[200],
                        borderRadius: BorderRadius.circular(16),
                        image: p.imageUrl != null ? DecorationImage(image: CachedNetworkImageProvider(p.imageUrl!), fit: BoxFit.cover) : null,
                     ),
                     clipBehavior: Clip.hardEdge,
                     alignment: Alignment.bottomLeft,
                     child: Container(
                        padding: const EdgeInsets.all(8),
                        width: double.infinity,
                        color: Colors.black.withOpacity(0.5),
                        child: Text(p.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                     )
                   )
                );
             }
          )
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (_, __) => const SizedBox(),
    );
  }
}
