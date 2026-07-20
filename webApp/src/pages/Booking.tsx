"use client";

import React, { useState, useMemo } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  MessageSquare, 
  ArrowLeft, 
  CheckCircle2,
  Hotel,
  Home,
  Utensils,
  Plane,
  Train,
  Briefcase,
  ChevronRight,
  Armchair,
  Coffee,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const CATEGORIES = [
  { id: 'hotel', name: 'Hotel Room', icon: <Hotel size={24} />, color: 'bg-blue-500' },
  { id: 'apartment', name: 'Book Apartment', icon: <Home size={24} />, color: 'bg-indigo-500' },
  { id: 'restaurant', name: 'Bar & Restaurant', icon: <Utensils size={24} />, color: 'bg-orange-500' },
  { id: 'plane', name: 'Plane Ticket', icon: <Plane size={24} />, color: 'bg-sky-500' },
  { id: 'train', name: 'Train Ticket', icon: <Train size={24} />, color: 'bg-emerald-500' },
  { id: 'other', name: 'Other Services', icon: <Briefcase size={24} />, color: 'bg-slate-500' },
];

const TABLES = [
  { id: 'T1', capacity: 2, status: 'available' },
  { id: 'T2', capacity: 4, status: 'available' },
  { id: 'T3', capacity: 2, status: 'occupied' },
  { id: 'T4', capacity: 6, status: 'available' },
  { id: 'T5', capacity: 4, status: 'available' },
  { id: 'T6', capacity: 2, status: 'available' },
];

const MENU_ITEMS = [
  { id: 'm1', name: 'Signature Steak', price: '$32', category: 'Main' },
  { id: 'm2', name: 'Truffle Pasta', price: '$24', category: 'Main' },
  { id: 'm3', name: 'Garden Salad', price: '$14', category: 'Starter' },
  { id: 'm4', name: 'Red Wine (Glass)', price: '$12', category: 'Drinks' },
];

const Booking = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'category' | 'details' | 'confirmed'>('category');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedMenu, setSelectedMenu] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categoryData = useMemo(() => 
    CATEGORIES.find(c => c.id === selectedCategory), 
  [selectedCategory]);

  const handleCategorySelect = (id: string) => {
    setSelectedCategory(id);
    setStep('details');
  };

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setStep('confirmed');
      toast.success("Booking request sent successfully!");
    }, 1500);
  };

  const toggleMenuItem = (id: string) => {
    setSelectedMenu(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  if (step === 'confirmed') {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-8">
            <CheckCircle2 size={48} />
          </motion.div>
          <h1 className="text-4xl font-black tracking-tight mb-4">Booking Confirmed!</h1>
          <p className="text-muted-foreground max-w-md mx-auto text-lg font-medium mb-8">
            Your {categoryData?.name} request has been sent. Check your chat for confirmation from the provider.
          </p>
          <Button onClick={() => navigate("/")} className="rounded-2xl bg-[#0B1120] hover:bg-[#1e293b] text-white font-black px-10 h-14 text-lg shadow-xl">
            Return Home
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-10 pb-24">
        <header className="flex items-center gap-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => step === 'details' ? setStep('category') : navigate(-1)}
            className="rounded-full bg-white dark:bg-secondary shadow-md hover:scale-110 transition-transform"
          >
            <ArrowLeft size={24} />
          </Button>
          <div>
            <h1 className="text-4xl font-black tracking-tight">
              {step === 'category' ? 'What are we booking?' : `Book ${categoryData?.name}`}
            </h1>
            <p className="text-muted-foreground font-medium">
              {step === 'category' ? 'Select a category to get started' : 'Fill in the details for your reservation'}
            </p>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {step === 'category' ? (
            <motion.div 
              key="categories"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className="group relative flex flex-col items-start p-8 rounded-[2.5rem] bg-white dark:bg-secondary/20 border border-gray-100 dark:border-white/5 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all text-left overflow-hidden"
                >
                  <div className={`w-14 h-14 rounded-2xl ${cat.color} flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                    {cat.icon}
                  </div>
                  <h3 className="text-xl font-black mb-2">{cat.name}</h3>
                  <p className="text-sm text-muted-foreground font-medium">Instant booking with verified providers</p>
                  <div className="mt-6 flex items-center text-accent font-black text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    Select Category <ChevronRight size={14} className="ml-1" />
                  </div>
                  <div className={`absolute top-0 right-0 w-32 h-32 ${cat.color} opacity-[0.03] rounded-full -mr-16 -mt-16`} />
                </button>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid lg:grid-cols-[1fr,400px] gap-10"
            >
              <div className="space-y-8">
                {/* Date Selection */}
                <section className="bg-white dark:bg-secondary/20 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                      <CalendarIcon size={20} />
                    </div>
                    <h2 className="text-2xl font-black">Select Date</h2>
                  </div>
                  <div className="flex justify-center">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      className="rounded-3xl border-none p-4 bg-gray-50/50 dark:bg-black/20"
                      disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                    />
                  </div>
                </section>

                {/* Restaurant Specific: Table Selection */}
                {selectedCategory === 'restaurant' && (
                  <section className="bg-white dark:bg-secondary/20 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-xl">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                        <Armchair size={20} />
                      </div>
                      <h2 className="text-2xl font-black">Choose a Table</h2>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {TABLES.map((table) => (
                        <button
                          key={table.id}
                          disabled={table.status === 'occupied'}
                          onClick={() => setSelectedTable(table.id)}
                          className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                            selectedTable === table.id 
                              ? 'border-orange-500 bg-orange-500/5' 
                              : table.status === 'occupied'
                                ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                                : 'border-gray-100 hover:border-orange-200'
                          }`}
                        >
                          <span className="font-black text-lg">{table.id}</span>
                          <span className="text-[10px] font-bold uppercase text-muted-foreground">{table.capacity} Seats</span>
                          {table.status === 'occupied' && <Badge variant="secondary" className="text-[8px]">Occupied</Badge>}
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {/* Restaurant Specific: Food Menu */}
                {selectedCategory === 'restaurant' && (
                  <section className="bg-white dark:bg-secondary/20 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-xl">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <Coffee size={20} />
                      </div>
                      <h2 className="text-2xl font-black">Pre-order Food</h2>
                    </div>
                    <div className="space-y-3">
                      {MENU_ITEMS.map((item) => (
                        <div 
                          key={item.id}
                          onClick={() => toggleMenuItem(item.id)}
                          className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                            selectedMenu.includes(item.id) ? 'border-emerald-500 bg-emerald-500/5' : 'border-gray-50 hover:border-emerald-100'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <Checkbox checked={selectedMenu.includes(item.id)} />
                            <div>
                              <p className="font-black">{item.name}</p>
                              <p className="text-xs text-muted-foreground font-medium">{item.category}</p>
                            </div>
                          </div>
                          <span className="font-black text-emerald-600">{item.price}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Travel Specific: Class Selection */}
                {(selectedCategory === 'plane' || selectedCategory === 'train') && (
                  <section className="bg-white dark:bg-secondary/20 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-xl">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500">
                        <Info size={20} />
                      </div>
                      <h2 className="text-2xl font-black">Travel Class</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {['Economy', 'Business', 'First Class', 'Premium'].map((cls) => (
                        <Button key={cls} variant="outline" className="h-16 rounded-2xl font-black text-lg border-2 hover:border-sky-500 hover:bg-sky-50">
                          {cls}
                        </Button>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              <aside className="space-y-6">
                <div className="bg-[#0B1120] text-white p-8 rounded-[2.5rem] shadow-2xl sticky top-24">
                  <form onSubmit={handleBooking} className="space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                        <Clock size={20} className="text-accent" />
                      </div>
                      <h2 className="text-xl font-black">Finalize Booking</h2>
                    </div>

                    <div className="space-y-5">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Arrival Time</Label>
                        <Input required type="time" className="h-14 rounded-2xl bg-white/5 border-white/10 font-bold text-white" />
                      </div>

                      {selectedCategory === 'hotel' || selectedCategory === 'apartment' ? (
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Number of Guests</Label>
                          <Input required type="number" min="1" placeholder="2" className="h-14 rounded-2xl bg-white/5 border-white/10 font-bold text-white" />
                        </div>
                      ) : null}

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Special Requests</Label>
                        <Textarea placeholder="Any specific needs?" className="rounded-2xl bg-white/5 border-white/10 min-h-[100px] resize-none font-medium text-white" />
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                      <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-400">
                        <span>Category</span>
                        <span className="text-white">{categoryData?.name}</span>
                      </div>
                      {selectedTable && (
                        <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-400">
                          <span>Table</span>
                          <span className="text-white">{selectedTable}</span>
                        </div>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      disabled={isSubmitting || !date}
                      className="w-full h-16 rounded-2xl bg-accent hover:bg-accent/90 text-white font-black text-lg shadow-xl shadow-accent/20 gap-3"
                    >
                      {isSubmitting ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (
                        <>
                          <MessageSquare size={20} />
                          Confirm Booking
                        </>
                      )}
                    </Button>
                  </form>
                </div>
              </aside>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  );
};

export default Booking;