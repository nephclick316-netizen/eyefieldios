"use client";

import React from "react";
import { Truck, RefreshCcw, ShieldCheck } from "lucide-react";

const ProductTrustBadges = () => {
  return (
    <div className="flex gap-4 p-4 bg-white dark:bg-secondary/30 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
      <div className="flex-1 flex flex-col items-center gap-1 border-r border-gray-100 dark:border-white/5">
        <Truck size={18} className="text-accent" />
        <span className="text-[10px] font-bold">Fast Shipping</span>
      </div>
      <div className="flex-1 flex flex-col items-center gap-1 border-r border-gray-100 dark:border-white/5">
        <RefreshCcw size={18} className="text-accent" />
        <span className="text-[10px] font-bold">7-Day Return</span>
      </div>
      <div className="flex-1 flex flex-col items-center gap-1">
        <ShieldCheck size={18} className="text-accent" />
        <span className="text-[10px] font-bold">Secure Pay</span>
      </div>
    </div>
  );
};

export default ProductTrustBadges;