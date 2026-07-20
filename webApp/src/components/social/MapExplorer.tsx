"use client";

import React, { useState } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { 
  Utensils, ShoppingBag, Sparkles, HeartPulse, 
  Ticket, Landmark, MapPin, Star, Search, 
  Navigation, Phone, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MapExplorerProps {
  trigger: React.ReactNode;
}

const categories = [
  { id: 'food', label: 'Food & Dining', icon: Utensils, color: 'bg-orange-500' },
  { id: 'shopping', label: 'Shopping', icon: ShoppingBag, color: 'bg-blue-500' },
  { id: 'beauty', label: 'Beauty & Care', icon: Sparkles, color: 'bg-pink-500' },
  { id: 'health', label: 'Health', icon: HeartPulse, color: 'bg-red-500' },
  { id: 'entertainment', label: 'Entertainment', icon: Ticket, color: 'bg-purple-500' },
  { id: 'services', label: 'Services', icon: Landmark, color: 'bg-emerald-500' },
];

const mockPlaces = [
  { id: 1, name: "The Golden Spoon", category: "food", rating: 4.8, distance: "0.4 km", address: "123 Gourmet Ave", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop" },
  { id: 2, name: "Urban Boutique", category: "shopping", rating: 4.5, distance: "0.8 km", address: "45 Fashion St", image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop" },
  { id: 3, name: "Serenity Spa", category: "beauty", rating: 4.9, distance: "1.2 km", address: "88 Wellness Way", image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&h=300&fit=crop" },
  { id: 4, name: "City Mall", category: "shopping", rating: 4.2, distance: "2.5 km", address: "1 Central Plaza", image: "https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?w=400&h=300&fit=crop" },
  { id: 5, name: "Neon Cinema", category: "entertainment", rating: 4.6, distance: "1.5 km", address: "12 Movie Blvd", image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop" },
];

const MapExplorer: React.FC<MapExplorerProps> = ({ trigger }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPlaces = mockPlaces.filter(place => {
    const matchesCategory = activeCategory === 'all' || place.category === activeCategory;
    const matchesSearch = place.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 border-none bg-background">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-6 pb-2">
            <SheetTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
              <MapPin className="text-accent" />
              Explore Nearby
            </SheetTitle>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input 
                placeholder="Search places, services..." 
                className="pl-10 h-12 rounded-2xl bg-secondary/50 border-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </SheetHeader>

          <div className="px-6 py-2">
            <ScrollArea className="w-full whitespace-nowrap pb-4">
              <div className="flex gap-2">
                <Button 
                  variant={activeCategory === 'all' ? 'default' : 'secondary'}
                  className="rounded-full h-9 px-4 font-bold text-xs"
                  onClick={() => setActiveCategory('all')}
                >
                  All
                </Button>
                {categories.map((cat) => (
                  <Button 
                    key={cat.id}
                    variant={activeCategory === cat.id ? 'default' : 'secondary'}
                    className="rounded-full h-9 px-4 font-bold text-xs gap-2"
                    onClick={() => setActiveCategory(cat.id)}
                  >
                    <cat.icon size={14} />
                    {cat.label}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Mock Map Area */}
            <div className="h-48 bg-accent/5 relative overflow-hidden mx-6 rounded-3xl border border-accent/10">
              <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="w-12 h-12 bg-accent/20 rounded-full animate-ping absolute -inset-0" />
                  <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center relative z-10 shadow-lg shadow-accent/40">
                    <Navigation className="text-white fill-white" size={20} />
                  </div>
                </div>
              </div>
              {filteredPlaces.map((place, idx) => (
                <div 
                  key={place.id}
                  className="absolute w-3 h-3 bg-white border-2 border-accent rounded-full shadow-sm"
                  style={{ 
                    top: `${20 + (idx * 15)}%`, 
                    left: `${15 + (idx * 20)}%` 
                  }}
                />
              ))}
            </div>

            <ScrollArea className="flex-1 px-6 mt-6">
              <div className="space-y-4 pb-8">
                <h3 className="font-black text-sm uppercase tracking-widest text-muted-foreground">
                  {activeCategory === 'all' ? 'Recommended Places' : `${categories.find(c => c.id === activeCategory)?.label} Nearby`}
                </h3>
                
                {filteredPlaces.length > 0 ? (
                  filteredPlaces.map((place) => (
                    <div 
                      key={place.id}
                      className="group bg-secondary/30 hover:bg-secondary/50 rounded-3xl p-3 transition-all cursor-pointer border border-transparent hover:border-accent/10"
                    >
                      <div className="flex gap-4">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0">
                          <img src={place.image} alt={place.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div className="flex-1 min-w-0 py-1">
                          <div className="flex justify-between items-start">
                            <h4 className="font-black text-sm truncate">{place.name}</h4>
                            <div className="flex items-center gap-1 bg-accent/10 px-1.5 py-0.5 rounded-lg">
                              <Star size={10} className="text-accent fill-accent" />
                              <span className="text-[10px] font-bold text-accent">{place.rating}</span>
                            </div>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                            <MapPin size={10} />
                            {place.address} • {place.distance}
                          </p>
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" variant="ghost" className="h-7 rounded-lg px-2 text-[10px] font-bold gap-1 hover:bg-accent/10 hover:text-accent">
                              <Phone size={10} />
                              Call
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 rounded-lg px-2 text-[10px] font-bold gap-1 hover:bg-accent/10 hover:text-accent">
                              <Clock size={10} />
                              Hours
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="font-bold text-muted-foreground">No places found</p>
                    <p className="text-xs text-muted-foreground/60">Try a different category or search term</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MapExplorer;