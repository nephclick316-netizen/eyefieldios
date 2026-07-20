"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronDown, Plus, LogIn } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UploadModal from "./UploadModal";
import aiRobot from "@/assets/ai-robot.png";
import { CURRENCIES } from "@/constants/marketplace";

interface MarketplaceHeaderProps {
  user: any;
  currency: any;
  setCurrency: (curr: any) => void;
  onRefresh: () => void;
}

const MarketplaceHeader: React.FC<MarketplaceHeaderProps> = ({ user, currency, setCurrency, onRefresh }) => {
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between gap-4 bg-white dark:bg-transparent -mx-4 px-4 py-4 sticky top-0 z-20 backdrop-blur-md bg-opacity-80">
      <div className="flex items-center shrink-0">
        <h5 className="text-xl font-black tracking-tighter text-foreground leading-none">EyeField</h5>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        {user ? (
          <>
            <Button
              variant="outline"
              onClick={() => navigate("/endocard")}
              className="h-12 rounded-2xl bg-white dark:bg-secondary border-gray-200 dark:border-none shadow-sm hover:bg-gray-50 transition-colors px-3 gap-2"
            >
              <img src={aiRobot} alt="Endocard" className="w-8 h-8 object-contain" />
              <span className="text-[10px] font-black text-accent uppercase tracking-widest">Endocard</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-12 rounded-2xl bg-white dark:bg-secondary border-gray-200 dark:border-none px-3 sm:px-4 gap-2 font-black text-xs shadow-sm">
                  <span className="text-lg">{currency.flag}</span>
                  <span className="hidden xs:inline">{currency.code}</span>
                  <ChevronDown size={14} className="text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl bg-white dark:bg-secondary border-gray-100 dark:border-white/10 p-2">
                <div className="max-h-[300px] overflow-y-auto no-scrollbar">
                  {CURRENCIES.map((curr) => (
                    <DropdownMenuItem 
                      key={curr.code} 
                      onClick={() => setCurrency(curr)} 
                      className={`rounded-xl font-bold text-xs py-2.5 flex items-center justify-between ${currency.code === curr.code ? 'bg-accent/10 text-accent' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{curr.flag}</span>
                        <span>{curr.code}</span>
                      </div>
                      <span className="text-muted-foreground opacity-50">{curr.symbol}</span>
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <UploadModal 
              trigger={
                <button className="w-12 h-12 rounded-2xl bg-white dark:bg-secondary border border-gray-200 dark:border-none flex items-center justify-center text-accent hover:bg-gray-50 transition-colors shadow-sm">
                  <Plus size={24} />
                </button>
              }
              onSuccess={onRefresh}
            />
          </>
        ) : (
          <Button 
            onClick={() => navigate("/login")}
            className="h-12 rounded-2xl bg-[#000080] hover:bg-[#000066] text-white font-black px-6 gap-2 shadow-lg shadow-blue-900/20"
          >
            <LogIn size={18} />
            Login
          </Button>
        )}
      </div>
    </header>
  );
};

export default MarketplaceHeader;