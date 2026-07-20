import 'package:eyefield/features/echoes/domain/models/echo.dart';

class Product {
  final String id;
  final EchoUser seller;
  final String name;
  final double price;
  final String description;
  final String? imageUrl;
  final List<String> imageUrls;
  final String? category;
  final String? condition;
  final double averageRating;
  final int ratingCount;
  final List<ProductComment> comments;

  Product({
    required this.id,
    required this.seller,
    required this.name,
    required this.price,
    required this.description,
    this.imageUrl,
    this.imageUrls = const [],
    this.category,
    this.condition,
    this.averageRating = 0.0,
    this.ratingCount = 0,
    this.comments = const [],
  });

  factory Product.fromJson(Map<String, dynamic> json, EchoUser seller, {List<ProductComment> comments = const []}) {
    return Product(
      id: json['id'].toString(),
      seller: seller,
      name: json['name'] ?? '',
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      description: json['description'] ?? '',
      imageUrl: json['image_url'],
      imageUrls: json['image_urls'] != null ? List<String>.from(json['image_urls']) : [],
      category: json['category'],
      condition: json['condition'],
      averageRating: (json['average_rating'] as num?)?.toDouble() ?? 0.0,
      ratingCount: json['rating_count'] ?? 0,
      comments: comments,
    );
  }
}

class ProductComment {
  final String id;
  final String userId;
  final EchoUser user;
  final String text;
  final int rating;
  final String createdAt;

  ProductComment({
    required this.id,
    required this.userId,
    required this.user,
    required this.text,
    required this.rating,
    required this.createdAt,
  });

  factory ProductComment.fromJson(Map<String, dynamic> json, EchoUser user) {
    return ProductComment(
      id: json['id'].toString(),
      userId: json['user_id'],
      user: user,
      text: json['text'] ?? '',
      rating: json['rating'] ?? 0,
      createdAt: json['created_at'] ?? '',
    );
  }
}
