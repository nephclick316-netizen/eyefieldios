"use client";

import React from "react";

interface ProductSpecsProps {
  description: string;
  minOrder: string;
  condition: string;
}

const ProductSpecs: React.FC<ProductSpecsProps> = ({ description, minOrder, condition }) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Description</h2>
        <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">{description}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-gray-50 dark:bg-secondary/20 rounded-2xl border border-gray-100 dark:border-white/5">
          <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Min. Order</div>
          <div className="text-sm font-bold">{minOrder || "1 piece"}</div>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-secondary/20 rounded-2xl border border-gray-100 dark:border-white/5">
          <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Condition</div>
          <div className="text-sm font-bold">{condition || "New"}</div>
        </div>
      </div>
    </div>
  );
};

export default ProductSpecs;