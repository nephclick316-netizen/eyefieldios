"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Zap, HelpCircle, Search } from "lucide-react";

interface QuickAction {
  label: string;
  icon: React.ElementType;
  query: string;
}

const ACTIONS: QuickAction[] = [
  { label: "Find Products", icon: ShoppingBag, query: "Show me the latest tech products in the marketplace" },
  { label: "App Features", icon: Zap, query: "What are Echoes and Pulses?" },
  { label: "Get Help", icon: HelpCircle, query: "How do I sell an item on Cascadea?" },
  { label: "Search Tips", icon: Search, query: "How does visual search work?" },
];

interface EndocardQuickActionsProps {
  onAction: (query: string) => void;
}

const EndocardQuickActions: React.FC<EndocardQuickActionsProps> = ({ onAction }) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar px-6">
      {ACTIONS.map((action, idx) => (
        <motion.button
          key={idx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          onClick={() => onAction(action.query)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-secondary/50 border border-white/5 hover:bg-accent hover:text-white transition-all whitespace-nowrap group"
        >
          <action.icon size={16} className="text-accent group-hover:text-white transition-colors" />
          <span className="text-xs font-bold">{action.label}</span>
        </motion.button>
      ))}
    </div>
  );
};

export default EndocardQuickActions;