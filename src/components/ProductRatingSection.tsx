"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Star, Send, Loader2, MessageCircle } from 'lucide-react';
import { Product, ProductComment, User } from '../types';
import { supabase } from '../utils/supabaseClient';
import { productService } from '../services/productService';
import { withTimeout } from '../utils/queryUtils';
import { toast } from 'react-hot-toast';
import { profileService } from '../services/profileService'; // Import profileService

interface ProductRatingSectionProps {
  product: Product;
  currentUser: User;
  onRatingSubmitted: () => void; // Callback to refresh product data
}

const INITIAL_VISIBLE_REVIEWS = 2;

export const ProductRatingSection: React.FC<ProductRatingSectionProps> = ({ product, currentUser, onRatingSubmitted }) => {
  const [userRating, setUserRating] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hasUserReviewed, setHasUserReviewed] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    checkUserReview();
    return () => {
      isMounted.current = false;
    };
  }, [product.id, currentUser.id, product.comments]);

  const checkUserReview = () => {
    if (!isMounted.current || !product.comments) return;
    const review = product.comments.find(c => c.userId === currentUser.id);
    if (review) {
      if (isMounted.current) setUserRating(review.rating);
      if (isMounted.current) setCommentText(review.text);
      if (isMounted.current) setHasUserReviewed(true);
    } else {
      if (isMounted.current) setUserRating(0);
      if (isMounted.current) setCommentText('');
      if (isMounted.current) setHasUserReviewed(false);
    }
  };

  const handleRatingClick = (rating: number) => {
    if (isMounted.current) setUserRating(rating);
  };

  const handleSubmitReview = async () => {
    if (!isMounted.current || submitting || userRating === 0 || !commentText.trim()) return;

    setSubmitting(true);
    try {
      // Submit both the comment and the rating
      await productService.addProductComment(product.id, currentUser.id, commentText, userRating);
      await productService.addProductRating(product.id, currentUser.id, userRating);
      
      toast.success('Review submitted!');
      if (isMounted.current) setHasUserReviewed(true);
      if (isMounted.current) onRatingSubmitted(); // Refresh parent data
    } catch (error) {
      console.error("Failed to submit review:", error);
      toast.error('Failed to submit review.');
    } finally {
      if (isMounted.current) setSubmitting(false);
    }
  };

  const displayedComments = showAllReviews 
    ? product.comments 
    : product.comments?.slice(0, INITIAL_VISIBLE_REVIEWS);

  return (
    <div className="space-y-6">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ratings & Reviews</h3>

      {/* Average Rating Display */}
      <div className="flex items-center gap-2">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={20}
              className={product.averageRating && star <= product.averageRating ? 'text-blue-600 fill-blue-600' : 'text-slate-300'}
            />
          ))}
        </div>
        <span className="text-sm font-bold">{product.averageRating?.toFixed(1) || '0.0'}</span>
        <span className="text-xs text-slate-500">({product.ratingCount || 0} reviews)</span>
      </div>

      {/* User Review Form */}
      {!hasUserReviewed && (
        <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
          <p className="text-xs font-bold">Your Review:</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={24}
                className={`cursor-pointer ${userRating >= star ? 'text-blue-600 fill-blue-600' : 'text-slate-300'} hover:scale-110 transition-transform`}
                onClick={() => handleRatingClick(star)}
              />
            ))}
          </div>
          <textarea
            placeholder="Share your thoughts on this product..."
            className="w-full bg-white dark:bg-black py-3 px-4 rounded-xl text-sm outline-none resize-none border border-slate-100 dark:border-slate-800"
            rows={3}
            value={commentText}
            onChange={(e) => { if (isMounted.current) setCommentText(e.target.value); }}
          />
          <button
            onClick={handleSubmitReview}
            disabled={submitting || userRating === 0 || !commentText.trim()}
            className="w-full bg-navy-950 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Submit Review
          </button>
        </div>
      )}

      {/* Existing Comments */}
      {product.comments && product.comments.length > 0 && (
        <div className="space-y-4">
          {displayedComments?.map((comment) => (
            <div key={comment.id} className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl">
              <img src={comment.user.avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold">@{comment.user.username}</p>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={12}
                        className={comment.rating >= star ? 'text-blue-600 fill-blue-600' : 'text-slate-300'}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{comment.text}</p>
                <p className="text-[9px] text-slate-500 mt-1">{new Date(comment.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
          {product.comments.length > INITIAL_VISIBLE_REVIEWS && !showAllReviews && (
            <button 
              onClick={() => setShowAllReviews(true)}
              className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-navy-950 dark:text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <MessageCircle size={16} /> View All {product.comments.length} Reviews
            </button>
          )}
        </div>
      )}
    </div>
  );
};