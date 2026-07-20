"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check } from "lucide-react";
import { CATEGORY_METADATA, CONDITIONS, COMMON_COLORS } from "@/constants/marketplace";

interface CategoryFieldsProps {
  category: string;
  setCategory: (val: string) => void;
  subcategory: string;
  setSubcategory: (val: string) => void;
  condition: string;
  setCondition: (val: string) => void;
  selectedColors: string[];
  setSelectedColors: (val: string[] | ((prev: string[]) => string[])) => void;
  countries: string[];
  setCountries: (val: string[] | ((prev: string[]) => string[])) => void;
}

const CategoryFields: React.FC<CategoryFieldsProps> = ({
  category,
  setCategory,
  subcategory,
  setSubcategory,
  condition,
  setCondition,
  selectedColors,
  setSelectedColors,
  countries,
  setCountries
}) => {
  const selectedCat = CATEGORY_METADATA.find(c => c.id === category);

  const AVAILABLE_COUNTRIES = ["Uganda", "Kenya", "Tanzania", "Rwanda", "Congo", "USA", "UK", "France", "Japan"];

  const toggleCountry = (cName: string) => {
    setCountries(prev => 
      prev.includes(cName) 
        ? prev.filter(c => c !== cName) 
        : [...prev, cName]
    );
  };

  const toggleColor = (colorName: string) => {
    setSelectedColors(prev => 
      prev.includes(colorName) 
        ? prev.filter(c => c !== colorName) 
        : [...prev, colorName]
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Main Category</Label>
        <Select onValueChange={(v) => { setCategory(v); setSubcategory(""); setCondition(""); setSelectedColors([]); }}>
          <SelectTrigger className="rounded-2xl bg-gray-50 dark:bg-white/5 border-none h-12 font-bold">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl bg-white dark:bg-[#0B1120] border-gray-100 dark:border-white/10">
            {CATEGORY_METADATA.map(cat => (
              <SelectItem key={cat.id} value={cat.id} className="rounded-xl focus:bg-accent focus:text-white font-medium">
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {category && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Sub Category</Label>
            <Select onValueChange={setSubcategory} value={subcategory}>
              <SelectTrigger className="rounded-2xl bg-gray-50 dark:bg-white/5 border-none h-12 font-bold">
                <SelectValue placeholder="Select sub-category" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl bg-white dark:bg-[#0B1120] border-gray-100 dark:border-white/10">
                {selectedCat?.subs.map(sub => (
                  <SelectItem key={sub} value={sub} className="rounded-xl focus:bg-accent focus:text-white font-medium">
                    {sub}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCat?.hasCondition && (
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Condition</Label>
              <Select onValueChange={setCondition} value={condition}>
                <SelectTrigger className="rounded-2xl bg-gray-50 dark:bg-white/5 border-none h-12 font-bold">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl bg-white dark:bg-[#0B1120] border-gray-100 dark:border-white/10">
                  {CONDITIONS.map(c => (
                    <SelectItem key={c} value={c} className="rounded-xl focus:bg-accent focus:text-white font-medium">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedCat?.hasColor && (
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Available Colors</Label>
              <div className="flex flex-wrap gap-2 px-2">
                {COMMON_COLORS.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => toggleColor(color.name)}
                    className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                      selectedColors.includes(color.name) 
                        ? "border-accent scale-110 shadow-lg" 
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  >
                    {selectedColors.includes(color.name) && (
                      <Check size={14} className={color.name === "White" ? "text-black" : "text-white"} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2 pt-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Sell to Countries *</Label>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  if (countries.length === AVAILABLE_COUNTRIES.length) {
                    setCountries([]);
                  } else {
                    setCountries(AVAILABLE_COUNTRIES);
                  }
                }}
                className="text-xs font-bold text-accent text-left px-2"
              >
                {countries.length === AVAILABLE_COUNTRIES.length ? "Deselect All" : "Select All Countries"}
              </button>
              <div className="flex flex-wrap gap-2 px-2">
                {AVAILABLE_COUNTRIES.map((c) => (
                  <button
                    key={c}
                    onClick={(e) => { e.preventDefault(); toggleCountry(c); }}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border-2 ${
                      countries.includes(c) 
                        ? "border-accent bg-accent/10 text-accent" 
                        : "border-gray-200 dark:border-white/10 text-muted-foreground hover:border-gray-300"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryFields;