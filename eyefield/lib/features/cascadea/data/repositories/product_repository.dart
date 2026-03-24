import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:eyefield/features/echoes/domain/models/echo.dart';
import 'package:eyefield/features/cascadea/domain/models/product.dart';
import 'package:eyefield/core/services/storage_service.dart';
import 'package:image_picker/image_picker.dart';

class ProductRepository {
  final SupabaseClient _client = Supabase.instance.client;
  final StorageService _storage = StorageService();

  Future<List<Product>> getProducts({int page = 0, int limit = 10}) async {
    final from = page * limit;
    final to = from + limit - 1;

    final response = await _client
        .from('products')
        .select('*')
        .order('created_at', ascending: false)
        .range(from, to);

    final List<dynamic> data = response as List<dynamic>;
    if (data.isEmpty) return [];
    
    final userIds = data.map((e) => e['seller_id']).toSet().toList();
    final profilesResponse = await _client
        .from('profiles')
        .select('id, username, display_name, avatar_url, is_verified')
        .filter('id', 'in', userIds);
    
    final profilesMap = {
      for (var p in profilesResponse) p['id']: EchoUser.fromJson(p)
    };

    return data.map((p) {
      final seller = profilesMap[p['seller_id']] ?? 
          EchoUser(id: p['seller_id'], username: 'unknown', displayName: 'Unknown Seller', avatar: '');
      
      return Product.fromJson(p, seller);
    }).toList();
  }

  Future<void> createProduct(
    String userId, 
    String name, 
    double price, 
    String description, 
    String category, 
    String? condition,
    List<XFile> imageFiles
  ) async {
    List<String> uploadedUrls = [];
    
    for (var file in imageFiles) {
      final url = await _storage.uploadMedia(
        bucket: 'products',
        userId: userId,
        file: file,
        isVideo: false,
      );
      if (url != null) uploadedUrls.add(url);
    }

    String? primaryUrl = uploadedUrls.isNotEmpty ? uploadedUrls.first : null;

    await _client.from('products').insert({
      'seller_id': userId,
      'name': name,
      'price': price,
      'description': description,
      'category': category,
      if (condition != null) 'condition': condition,
      if (primaryUrl != null) 'image_url': primaryUrl,
      if (uploadedUrls.isNotEmpty) 'image_urls': uploadedUrls,
    });
  }

  Future<Product?> getProductById(String productId) async {
    final data = await _client
        .from('products')
        .select('*')
        .eq('id', productId)
        .maybeSingle();

    if (data == null) return null;

    final sellerData = await _client
        .from('profiles')
        .select('id, username, display_name, avatar_url, is_verified')
        .eq('id', data['seller_id'])
        .single();
    
    final seller = EchoUser.fromJson(sellerData);

    // Fetch ratings and comments (if any)
    final commentsData = await _client
        .from('product_comments')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', ascending: true);
    
    final List<dynamic> rawComments = commentsData as List<dynamic>;
    final commentUserIds = rawComments.map((c) => c['user_id']).toSet().toList();
    
    Map<String, EchoUser> commentUsers = {};
    if (commentUserIds.isNotEmpty) {
      final commentProfiles = await _client
          .from('profiles')
          .select('id, username, display_name, avatar_url, is_verified')
          .filter('id', 'in', commentUserIds);
      commentUsers = {
        for (var p in commentProfiles) p['id']: EchoUser.fromJson(p)
      };
    }

    final comments = rawComments.map((c) {
      final user = commentUsers[c['user_id']] ?? 
          EchoUser(id: c['user_id'], username: 'unknown', displayName: 'Unknown User', avatar: '');
      return ProductComment.fromJson(c, user);
    }).toList();

    return Product.fromJson(data, seller, comments: comments);
  }

  Future<void> addProductRating(String productId, String userId, int rating) async {
    await _client.from('product_ratings').insert({
      'product_id': productId,
      'user_id': userId,
      'rating': rating,
    });
  }

  Future<void> addProductComment(String productId, String userId, String text, int rating) async {
    await _client.from('product_comments').insert({
      'product_id': productId,
      'user_id': userId,
      'text': text,
      'rating': rating,
    });
  }
}
