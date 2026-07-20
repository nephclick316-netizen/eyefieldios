"use client";

import React, { useEffect, useState } from "react";
import { Star, MessageSquare, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProductReviewsProps {
  productId: string;
}

const ProductReviews: React.FC<ProductReviewsProps> = ({ productId }) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      const { data, error, count } = await supabase
        .from("product_reviews")
        .select(`
          *,
          profiles (
            full_name,
            avatar_url
          )
        `, { count: 'exact' })
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReviews(data || []);
      setTotalReviews(count || 0);
    } catch (error: any) {
      console.error("Error fetching reviews:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchReviews();
    }
  }, [productId]);

  const handleSubmit = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast.error("Please sign in to leave a review");
      return;
    }

    if (userRating === 0) {
      toast.error("Please select a rating");
      return;
    }

    if (!reviewText.trim()) {
      toast.error("Please write a review");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("product_reviews")
        .insert({
          product_id: productId,
          user_id: session.user.id,
          rating: userRating,
          content: reviewText.trim()
        });

      if (error) throw error;

      toast.success("Review submitted successfully!");
      setReviewText("");
      setUserRating(0);
      fetchReviews();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-black">Reviews</h2>
          <span className="px-2 py-0.5 bg-accent/10 text-accent text-[10px] font-black rounded-full">
            {totalReviews}
          </span>
        </div>
        <Button variant="ghost" className="text-accent font-bold text-xs">View All</Button>
      </div>

      <div className="p-6 bg-accent/5 rounded-[2.5rem] border border-accent/10 space-y-4">
        <div className="text-center space-y-1">
          <h3 className="font-black text-sm">Rate this product</h3>
          <p className="text-xs text-muted-foreground">Share your experience with others</p>
        </div>
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button 
              key={star} 
              onClick={() => setUserRating(star)}
              className="transition-transform hover:scale-110"
            >
              <Star 
                size={32} 
                className={star <= userRating ? "fill-accent text-accent" : "text-gray-300 dark:text-muted"} 
              />
            </button>
          ))}
        </div>
        <Textarea 
          placeholder="Write your review here..."
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          className="rounded-2xl bg-white/50 dark:bg-secondary/50 border-none focus-visible:ring-accent min-h-[100px]"
        />
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
          className="w-full rounded-2xl bg-accent hover:bg-accent/90 text-white font-black"
        >
          {isSubmitting ? "Submitting..." : "Write a Review"}
        </Button>
      </div>

      <div className="space-y-4">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.id} className="p-4 bg-white dark:bg-secondary/20 rounded-3xl border border-gray-100 dark:border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={review.profiles?.avatar_url} />
                    <AvatarFallback><User size={14} /></AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-xs font-bold">{review.profiles?.full_name || "Anonymous"}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={12} 
                      className={i < review.rating ? "fill-accent text-accent" : "text-gray-300 dark:text-muted"} 
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">{review.content}</p>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="mx-auto mb-2 opacity-20" size={32} />
            <p className="text-xs font-bold">No reviews yet. Be the first to review!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductReviews;