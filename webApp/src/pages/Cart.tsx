"use client";

import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, CreditCard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, totalPrice, totalItems, clearCart } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
          <div className="w-24 h-24 bg-secondary/30 rounded-[3rem] flex items-center justify-center text-muted-foreground">
            <ShoppingBag size={48} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black">Your cart is empty</h2>
            <p className="text-muted-foreground max-w-xs mx-auto">
              Looks like you haven't added anything to your cart yet.
            </p>
          </div>
          <Button 
            onClick={() => navigate("/")}
            className="rounded-2xl bg-accent hover:bg-accent/90 text-white font-black px-8 h-12"
          >
            Start Shopping
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8 pb-32">
        <header className="flex justify-between items-center">
          <h1 className="text-3xl font-black tracking-tight">My Cart</h1>
          <Button 
            variant="ghost" 
            onClick={clearCart}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 font-bold text-xs"
          >
            Clear All
          </Button>
        </header>

        <div className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {cart.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-secondary/20 p-4 rounded-[2.5rem] border border-gray-100 dark:border-white/5 flex gap-4 items-center"
              >
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-50 shrink-0">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-sm truncate">{item.title}</h3>
                  <p className="text-accent font-black text-base">
                    {item.currencySymbol}{item.price.toLocaleString()}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                  
                  <div className="flex items-center gap-3 bg-secondary/50 rounded-xl p-1">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="font-black text-xs w-4 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Order Summary */}
        <div className="fixed bottom-24 left-0 right-0 px-4 z-40">
          <div className="max-w-md mx-auto bg-white dark:bg-[#0B1120] rounded-[2.5rem] p-6 shadow-2xl border border-gray-100 dark:border-white/10 space-y-4">
            <div className="flex justify-between items-center">
              <div className="space-y-0.5">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total ({totalItems} items)</p>
                <p className="text-2xl font-black text-accent">
                  {cart[0]?.currencySymbol}{totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <Button 
                className="h-14 rounded-2xl bg-accent hover:bg-accent/90 text-white font-black px-8 gap-2 shadow-xl shadow-accent/20"
                onClick={() => toast.success("Checkout feature coming soon!")}
              >
                Checkout
                <ArrowRight size={20} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Cart;