"use client";

import React from "react";
import { User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface ProductSellerProps {
  seller: {
    handle: string;
    name: string;
    avatar_url?: string;
  };
}

const ProductSeller: React.FC<ProductSellerProps> = ({ seller }) => {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate(`/profile/${seller.handle}`)}
      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-secondary/20 rounded-2xl cursor-pointer hover:bg-gray-100 dark:hover:bg-secondary/40 transition-colors"
    >
      <Avatar className="h-10 w-10 border-2 border-accent/20">
        <AvatarImage src={seller.avatar_url} />
        <AvatarFallback className="bg-accent/10 text-accent">
          <User size={20} />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="text-xs font-black uppercase tracking-widest text-muted-foreground">Seller</div>
        <div className="text-sm font-bold">{seller.name}</div>
      </div>
      <Badge variant="outline" className="rounded-full text-[10px] font-black border-accent/20 text-accent">
        Visit Profile
      </Badge>
    </div>
  );
};

export default ProductSeller;