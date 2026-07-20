"use client";

import React from "react";
import { MessageSquare, ShoppingCart, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ProductActionBarProps {
  user: any;
  sellerId?: string;
  isAddingToCart: boolean;
  onAddToCart: () => void;
  onChatClick: () => void;
}

const ProductActionBar: React.FC<ProductActionBarProps> = ({
  user,
  sellerId,
  isAddingToCart,
  onAddToCart,
  onChatClick
}) => {
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-24 left-0 right-0 px-4 z-40">
      <div className="max-w-md mx-auto flex gap-3">
        {user ? (
          <>
            <Button 
              variant="outline" 
              onClick={onChatClick}
              className="flex-1 h-14 rounded-2xl border-gray-200 dark:border-white/10 bg-white/80 dark:bg-secondary/80 backdrop-blur-lg font-black gap-2"
            >
              <MessageSquare size={20} className="text-accent" />
              Chat
            </Button>
            <Button 
              onClick={onAddToCart}
              disabled={isAddingToCart}
              className="flex-[2] h-14 rounded-2xl bg-[#000080] hover:bg-[#000080]/90 text-white font-black shadow-xl shadow-[#000080]/20 gap-2"
            >
              {isAddingToCart ? <Loader2 className="animate-spin" size={20} /> : <ShoppingCart size={20} />}
              Add to Cart
            </Button>
          </>
        ) : (
          <Button 
            onClick={() => navigate("/login")}
            className="w-full h-14 rounded-2xl bg-[#000080] hover:bg-[#000066] text-white font-black shadow-xl shadow-blue-900/20 gap-2"
          >
            <LogIn size={20} />
            Login to Purchase
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProductActionBar;