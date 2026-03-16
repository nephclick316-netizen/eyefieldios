import { supabase } from '../utils/supabaseClient';
import { Product, ProductComment } from '../types';
import { withTimeout } from '../utils/queryUtils';
import { profileService } from './profileService';
import { notificationService } from './notificationService';
import { cacheUtils } from '../utils/cacheUtils';

const PRODUCT_COLUMNS = 'id, name, price, description, image_url, image_urls, category, condition, created_at, seller_id';
const PROFILE_COLUMNS = 'id, username, display_name, avatar_url, is_verified';

export const productService = {
  async getProducts(page: number = 0, limit: number = 10): Promise<{ data: Product[], hasMore: boolean }> {
    const from = page * limit;
    const to = from + limit;

    const { data, error } = await withTimeout(
      (supabase
        .from('products')
        .select(PRODUCT_COLUMNS)
        .order('created_at', { ascending: false })
        .range(from, to)) as any,
      30000,
      'getProducts'
    );

    if (error) throw new Error(error.message);

    if (!data || data.length === 0) return { data: [], hasMore: false };

    const hasMore = data.length > limit;
    const rawItems = data.slice(0, limit);

    const sellerIds = [...new Set(rawItems.map(p => p.seller_id))];
    const { data: profilesData } = await supabase.from('profiles').select(PROFILE_COLUMNS).in('id', sellerIds);
    const profilesMap = new Map((profilesData || []).map(p => [p.id, p]));

    const productsData = await Promise.all(rawItems.map(async (p: any) => {
      const sellerProfile = profilesMap.get(p.seller_id);
      const mappedSeller = sellerProfile ? {
        id: sellerProfile.id,
        username: sellerProfile.username,
        displayName: sellerProfile.display_name,
        avatar: sellerProfile.avatar_url || 'https://picsum.photos/seed/default/200/200',
        isVerified: sellerProfile.is_verified
      } : { id: p.seller_id, username: 'unknown', displayName: 'Unknown Seller', avatar: 'https://picsum.photos/seed/default/200/200' };

      const { data: ratingsData } = await withTimeout(supabase.from('product_ratings').select('rating').eq('product_id', p.id) as any, 30000, 'getProductRatings');
      const { data: commentsData } = await withTimeout(supabase.from('product_comments').select('id, user_id, text, rating, created_at').eq('product_id', p.id).order('created_at', { ascending: true }) as any, 30000, 'getProductComments');

      const ratings = ratingsData?.map((r: any) => r.rating) || [];
      const averageRating = ratings.length > 0 ? ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length : 0;

      const comments: ProductComment[] = await Promise.all((commentsData || []).map(async (c: any) => {
        const commentUserProfile = await profileService.getProfile(c.user_id);
        return {
          id: c.id,
          userId: c.user_id,
          user: commentUserProfile || { id: c.user_id, username: 'unknown', displayName: 'Unknown User', avatar: 'https://picsum.photos/seed/default/200/200' },
          text: c.text,
          rating: c.rating,
          createdAt: c.created_at,
        };
      }));

      return {
        id: p.id,
        seller: mappedSeller,
        name: p.name,
        price: p.price,
        description: p.description,
        imageUrl: p.image_url,
        imageUrls: Array.isArray(p.image_urls) ? p.image_urls : (p.image_url ? [p.image_url] : []),
        category: p.category,
        condition: p.condition,
        averageRating: parseFloat(averageRating.toFixed(1)),
        ratingCount: ratings.length,
        comments: comments,
      };
    }));
    return { data: productsData, hasMore };
  },

  async getUserProducts(userId: string, page: number = 0, limit: number = 12): Promise<{ data: Product[], hasMore: boolean }> {
    const from = page * limit;
    const to = from + limit;
    const { data, error } = await withTimeout(
      (supabase
        .from('products')
        .select(PRODUCT_COLUMNS)
        .eq('seller_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to)) as any,
      30000,
      'getUserProducts'
    );

    if (error) throw new Error(error.message);
    const hasMore = (data || []).length > limit;
    const productsData = await Promise.all((data || []).slice(0, limit).map(async (p: any) => {
      const sellerProfile = await profileService.getProfile(p.seller_id);

      const { data: ratingsData } = await withTimeout(supabase.from('product_ratings').select('rating').eq('product_id', p.id) as any, 30000, 'getUserProductRatings');
      const { data: commentsData } = await withTimeout(supabase.from('product_comments').select('id, user_id, text, rating, created_at').eq('product_id', p.id).order('created_at', { ascending: true }) as any, 30000, 'getUserProductComments');

      const ratings = ratingsData?.map((r: any) => r.rating) || [];
      const averageRating = ratings.length > 0 ? ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length : 0;

      const comments: ProductComment[] = await Promise.all((commentsData || []).map(async (c: any) => {
        const commentUserProfile = await profileService.getProfile(c.user_id);
        return {
          id: c.id,
          userId: c.user_id,
          user: commentUserProfile || { id: c.user_id, username: 'unknown', displayName: 'Unknown User', avatar: 'https://picsum.photos/seed/default/200/200' },
          text: c.text,
          rating: c.rating,
          createdAt: c.created_at,
        };
      }));

      return {
        id: p.id,
        seller: sellerProfile || { id: p.seller_id, username: 'unknown', displayName: 'Unknown Seller', avatar: 'https://picsum.photos/seed/default/200/200' },
        name: p.name,
        price: p.price,
        description: p.description,
        imageUrl: p.image_url,
        imageUrls: Array.isArray(p.image_urls) ? p.image_urls : (p.image_url ? [p.image_url] : []),
        category: p.category,
        condition: p.condition,
        averageRating: parseFloat(averageRating.toFixed(1)),
        ratingCount: ratings.length,
        comments: comments,
      };
    }));
    return { data: productsData, hasMore };
  },

  async getProductById(productId: string): Promise<Product | null> {
    const { data, error } = await withTimeout(
      (supabase
        .from('products')
        .select(PRODUCT_COLUMNS)
        .eq('id', productId)
        .maybeSingle()) as any,
      30000,
      'getProductById'
    );

    if (error) throw new Error(error.message);
    if (!data) return null;

    const sellerProfile = await profileService.getProfile(data.seller_id);

    const { data: ratingsData } = await withTimeout(supabase.from('product_ratings').select('rating').eq('product_id', data.id) as any, 30000, 'getProductByIdRatings');
    const { data: commentsData } = await withTimeout(supabase.from('product_comments').select('id, user_id, text, rating, created_at').eq('product_id', data.id).order('created_at', { ascending: true }) as any, 30000, 'getProductByIdComments');

    const ratings = ratingsData?.map((r: any) => r.rating) || [];
    const averageRating = ratings.length > 0 ? ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length : 0;

    const comments: ProductComment[] = await Promise.all((commentsData || []).map(async (c: any) => {
      const commentUserProfile = await profileService.getProfile(c.user_id);
      return {
        id: c.id,
        userId: c.user_id,
        user: commentUserProfile || { id: c.user_id, username: 'unknown', displayName: 'Unknown User', avatar: 'https://picsum.photos/seed/default/200/200' },
        text: c.text,
        rating: c.rating,
        createdAt: c.created_at,
      };
    }));

    return {
      id: data.id,
      seller: sellerProfile || { id: data.seller_id, username: 'unknown', displayName: 'Unknown Seller', avatar: 'https://picsum.photos/seed/default/200/200' },
      name: data.name,
      price: data.price,
      description: data.description,
      imageUrl: data.image_url,
      imageUrls: Array.isArray(data.image_urls) ? data.image_urls : (data.image_url ? [data.image_url] : []),
      category: data.category,
      condition: data.condition,
      averageRating: parseFloat(averageRating.toFixed(1)),
      ratingCount: ratings.length,
      comments: comments,
    };
  },

  async getAlternativeProducts(productId: string, category: string, limit: number = 4): Promise<Product[]> {
    const { data, error } = await withTimeout(
      (supabase
        .from('products')
        .select(PRODUCT_COLUMNS)
        .eq('category', category)
        .neq('id', productId)
        .order('created_at', { ascending: false })
        .limit(limit)) as any,
      30000,
      'getAlternativeProducts'
    );

    if (error) throw new Error(error.message);
    const alternativeProductsData = await Promise.all((data || []).map(async (p: any) => {
      const sellerProfile = await profileService.getProfile(p.seller_id);
      return {
        id: p.id,
        seller: sellerProfile || { id: p.seller_id, username: 'unknown', displayName: 'Unknown Seller', avatar: 'https://picsum.photos/seed/default/200/200' },
        name: p.name,
        price: p.price,
        description: p.description,
        imageUrl: p.image_url,
        imageUrls: Array.isArray(p.image_urls) ? p.image_urls : (p.image_url ? [p.image_url] : []),
        category: p.category,
        condition: p.condition,
      };
    }));
    return alternativeProductsData;
  },

  async createProduct(userId: string, product: Partial<Product>) {
    const { error } = await withTimeout(
      (supabase.from('products').insert({
        seller_id: userId,
        name: product.name,
        price: product.price,
        description: product.description,
        image_url: product.imageUrl,
        image_urls: product.imageUrls,
        category: product.category,
        condition: product.condition
      })) as any,
      30000,
      'createProduct'
    );
    if (error) throw new Error(error.message);
  },

  async deleteProduct(productId: string) {
    const { error } = await withTimeout(
      (supabase.from('products').delete().eq('id', productId)) as any,
      30000,
      'deleteProduct'
    );
    if (error) throw new Error(error.message);

    // Update global caches to prevent deleted products from reappearing
    cacheUtils.removeByPredicate('cached_products', (p: any) => p.id !== productId);
    cacheUtils.removeByPredicate('user_products_', (p: any) => p.id !== productId);
  },

  async addProductRating(productId: string, userId: string, rating: number) {
    const { error } = await withTimeout(
      (supabase.from('product_ratings').insert({
        product_id: productId,
        user_id: userId,
        rating: rating
      })) as any,
      30000,
      'addProductRating'
    );
    if (error) throw new Error(error.message);

    const { data: productData } = await withTimeout(supabase.from('products').select('seller_id').eq('id', productId).single() as any, 30000, 'getProductSellerRating');
    if (productData && productData.seller_id !== userId) {
      await notificationService.createNotification({
        userId: productData.seller_id,
        actorId: userId,
        type: 'product_rating',
        contentId: productId,
        message: `Rated your product ${rating} stars`
      });
    }
  },

  async addProductComment(productId: string, userId: string, text: string, rating: number) {
    const { error } = await withTimeout(
      (supabase.from('product_comments').insert({
        product_id: productId,
        user_id: userId,
        text: text,
        rating: rating
      })) as any,
      30000,
      'addProductComment'
    );
    if (error) throw new Error(error.message);

    const { data: productData } = await withTimeout(supabase.from('products').select('seller_id').eq('id', productId).single() as any, 30000, 'getProductSellerComment');
    if (productData && productData.seller_id !== userId) {
      await notificationService.createNotification({
        userId: productData.seller_id,
        actorId: userId,
        type: 'product_comment',
        contentId: productId,
        message: text
      });
    }
  },
};