"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingBag, Tag } from "lucide-react";
import { CURRENCIES } from "@/constants/marketplace";

interface PricingFieldsProps {
  hasPrice: boolean;
  currencyCode: string;
  setCurrencyCode: (val: string) => void;
  price: string;
  setPrice: (val: string) => void;
  discountPrice: string;
  setDiscountPrice: (val: string) => void;
  isLimitedEdition: boolean;
  setIsLimitedEdition: (val: boolean) => void;
  deadline: string;
  setDeadline: (val: string) => void;
}

const PricingFields: React.FC<PricingFieldsProps> = ({
  hasPrice,
  currencyCode,
  setCurrencyCode,
  price,
  setPrice,
  discountPrice,
  setDiscountPrice,
  isLimitedEdition,
  setIsLimitedEdition,
  deadline,
  setDeadline
}) => {
  return (
    <div className="grid grid-cols-1 gap-4">
      {hasPrice && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Price</Label>
            <div className="flex gap-2">
              <Select value={currencyCode} onValueChange={setCurrencyCode}>
                <SelectTrigger className="w-[100px] rounded-2xl bg-gray-50 dark:bg-white/5 border-none h-12 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl bg-white dark:bg-[#0B1120] border-gray-100 dark:border-white/10">
                  {CURRENCIES.map(curr => (
                    <SelectItem key={curr.code} value={curr.code} className="rounded-xl font-bold">
                      {curr.flag} {curr.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input 
                type="number" 
                placeholder="0.00" 
                className="flex-1 rounded-2xl bg-gray-50 dark:bg-white/5 border-none h-12 font-bold"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 ml-2">
              <Tag size={12} className="text-accent" />
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Discount Price (Optional)</Label>
            </div>
            <Input 
              type="number" 
              placeholder="Sale price..." 
              className="rounded-2xl bg-accent/5 border-dashed border-accent/20 h-12 font-bold focus-visible:ring-accent"
              value={discountPrice}
              onChange={(e) => setDiscountPrice(e.target.value)}
            />
          </div>
        </div>
      )}
      <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/10">
        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            checked={isLimitedEdition} 
            onChange={(e) => setIsLimitedEdition(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
          />
          <span className="text-sm font-bold">Limited Edition (Optional)</span>
        </label>

        {isLimitedEdition && (
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Deadline (Optional)</Label>
            <Input 
              type="date" 
              value={deadline} 
              onChange={(e) => setDeadline(e.target.value)}
              className="rounded-2xl bg-gray-50 dark:bg-white/5 border-none h-12 font-bold" 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PricingFields;