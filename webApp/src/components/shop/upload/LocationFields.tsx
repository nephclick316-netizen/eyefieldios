"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, MapPin } from "lucide-react";
import { ALL_COUNTRIES } from "@/constants/marketplace";

interface LocationFieldsProps {
  country: string;
  setCountry: (val: string) => void;
  targetCountries: string;
  setTargetCountries: (val: string) => void;
}

const LocationFields: React.FC<LocationFieldsProps> = ({
  country,
  setCountry,
  targetCountries,
  setTargetCountries
}) => {
  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Primary Country</Label>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger className="rounded-2xl bg-gray-50 dark:bg-white/5 border-none h-12 font-bold">
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-muted-foreground" />
              <SelectValue placeholder="Select country" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-2xl bg-white dark:bg-[#0B1120] border-gray-100 dark:border-white/10 max-h-[300px]">
            {ALL_COUNTRIES.map(c => (
              <SelectItem key={c} value={c} className="rounded-xl font-medium">
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Target Countries / Regions</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input 
            placeholder="e.g. USA, Europe, Global" 
            value={targetCountries} 
            onChange={(e) => setTargetCountries(e.target.value)}
            className="rounded-2xl bg-gray-50 dark:bg-white/5 border-none h-12 pl-10 font-bold" 
          />
        </div>
      </div>
    </div>
  );
};

export default LocationFields;