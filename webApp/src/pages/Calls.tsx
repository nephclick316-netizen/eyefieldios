"use client";

import React, { useState, useEffect, useMemo } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Video, Search, Plus, ArrowUpRight, ArrowDownLeft, Loader2, Trash2, RefreshCw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/context/UserContext";
import { useCalls } from "@/context/CallContext";
import aiRobot from "@/assets/ai-robot.png";
import { toast } from "sonner";
import { isToday, isYesterday, format } from "date-fns";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Calls = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { startCall } = useCalls();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [callLogs, setCallLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchCallLogs = async (silent = false) => {
    if (!user?.id) return;
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    
    const { data, error } = await supabase
      .from('call_logs')
      .select(`
        *,
        caller:profiles!calls_caller_id_fkey(id, name:full_name, avatar_url),
        receiver:profiles!calls_receiver_id_fkey(id, name:full_name, avatar_url)
      `)
      .or(`caller_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (data) {
      const formatted = data.map(call => {
        const isOutgoing = call.caller_id === user.id;
        const otherParticipant = isOutgoing ? call.receiver : call.caller;
        
        return {
          id: call.id,
          otherUserId: otherParticipant?.id,
          name: otherParticipant?.name || 'Unknown',
          avatar: otherParticipant?.avatar_url,
          type: isOutgoing ? 'outgoing' : 'incoming',
          status: call.call_status,
          isVideo: call.call_type === 'video',
          created_at: call.created_at,
          time: new Date(call.created_at).toLocaleString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        };
      });
      setCallLogs(formatted);
    }
    setLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchCallLogs();

    const channel = supabase
      .channel('calls-history-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'call_logs' }, () => fetchCallLogs(true))
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const handleDeleteCall = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const { error } = await supabase
      .from('call_logs')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Failed to delete call log");
      return;
    }

    setCallLogs(prev => prev.filter(log => log.id !== id));
    toast.success("Call log deleted");
  };

  const filteredLogs = useMemo(() => {
    let logs = callLogs;
    
    if (activeTab === "missed") {
      logs = logs.filter(log => log.status === "missed");
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      logs = logs.filter(log => log.name.toLowerCase().includes(query));
    }

    return logs;
  }, [callLogs, activeTab, searchQuery]);

  const groupedLogs = useMemo(() => {
    const today: any[] = [];
    const olderGroups: { [key: string]: any[] } = {};
    
    filteredLogs.forEach(log => {
      const date = new Date(log.created_at);
      if (isToday(date)) {
        today.push(log);
      } else {
        let dateLabel = format(date, 'MMM d, yyyy');
        if (isYesterday(date)) {
          dateLabel = 'Yesterday';
        }
        
        if (!olderGroups[dateLabel]) {
          olderGroups[dateLabel] = [];
        }
        olderGroups[dateLabel].push(log);
      }
    });
    
    return { 
      today, 
      older: Object.entries(olderGroups).map(([date, logs]) => ({ date, logs }))
    };
  }, [filteredLogs]);

  const CallCard = ({ log }: { log: any }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white dark:bg-secondary/20 hover:bg-secondary/40 p-4 rounded-[2.5rem] border border-white/5 transition-all group flex items-center gap-4 shadow-xl shadow-indigo-100/30 dark:shadow-none"
    >
      <div className="relative">
        <Avatar className="w-16 h-16 border-2 border-accent/20">
          <AvatarImage src={log.avatar} />
          <AvatarFallback>{log.name[0]}</AvatarFallback>
        </Avatar>
        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center ${
          log.status === 'missed' ? 'bg-red-500' : 'bg-accent'
        }`}>
          {log.type === 'incoming' ? <ArrowDownLeft size={12} className="text-white" /> : <ArrowUpRight size={12} className="text-white" />}
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className={`font-black text-base truncate ${log.status === "missed" ? "text-red-500" : "text-foreground"}`}>
          {log.name}
        </h3>
        <p className="text-xs text-muted-foreground font-medium mt-0.5">
          {log.time} · {log.isVideo ? 'Video Call' : 'Voice Call'}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <button 
          onClick={() => startCall(log.otherUserId, 'voice')}
          className="w-12 h-12 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-all flex items-center justify-center"
        >
          <Phone size={20} />
        </button>
        <button 
          onClick={() => startCall(log.otherUserId, 'video')}
          className="w-12 h-12 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-all flex items-center justify-center"
        >
          <Video size={20} />
        </button>
        <button 
          onClick={(e) => handleDeleteCall(e, log.id)}
          className="w-10 h-10 rounded-full text-red-500 hover:bg-red-500/10 transition-all flex items-center justify-center"
          title="Delete call log"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </motion.div>
  );

  const totalOlderCount = useMemo(() => {
    return groupedLogs.older.reduce((acc, group) => acc + group.logs.length, 0);
  }, [groupedLogs.older]);

  return (
    <MainLayout>
      <div className="space-y-8">
        <header className="flex justify-between items-center bg-white dark:bg-transparent -mx-4 px-4 py-4 sticky top-0 z-20 backdrop-blur-md bg-opacity-80">
          <div className="flex items-center gap-4">
            <h5 className="text-xl font-black tracking-tighter text-foreground leading-none">EyeField</h5>
            {isRefreshing && (
              <div className="flex items-center gap-2 text-accent animate-pulse">
                <RefreshCw size={14} className="animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest">Updating</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white dark:bg-secondary/50 px-3 py-1.5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/endocard")}
                className="h-8 w-8 rounded-xl shadow-sm hover:bg-gray-50 transition-colors p-1 flex items-center justify-center overflow-hidden"
              >
                <img src={aiRobot} alt="Endocard AI" className="w-full h-full object-contain" />
              </Button>
              <span className="text-[10px] font-black text-accent uppercase tracking-widest">Endocard</span>
            </div>
            <button 
              onClick={() => navigate("/contacts")}
              className="w-11 h-11 rounded-2xl bg-[#000080] flex items-center justify-center text-white hover:bg-[#000066] shadow-lg shadow-blue-900/20 transition-all"
            >
              <Plus size={24} />
            </button>
          </div>
        </header>

        <div className="flex items-center gap-6">
          <h1 className="text-4xl font-black tracking-tight">Calls</h1>
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search call history..." 
              className="pl-11 h-12 rounded-2xl bg-secondary/30 border-none focus-visible:ring-accent"
            />
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="w-full bg-secondary/30 rounded-[2rem] p-1.5 h-14 border border-white/5">
            <TabsTrigger 
              value="all" 
              className="flex-1 rounded-[1.5rem] data-[state=active]:bg-[#000080] data-[state=active]:text-white data-[state=active]:shadow-lg font-black text-xs uppercase tracking-widest transition-all"
            >
              Recent
            </TabsTrigger>
            <TabsTrigger 
              value="missed" 
              className="flex-1 rounded-[1.5rem] data-[state=active]:bg-[#000080] data-[state=active]:text-white data-[state=active]:shadow-lg font-black text-xs uppercase tracking-widest transition-all"
            >
              Missed
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
            <p className="text-sm font-bold text-muted-foreground">Loading calls...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Today's Calls */}
            {groupedLogs.today.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-4">Today</h3>
                <div className="grid gap-4">
                  <AnimatePresence mode="popLayout">
                    {groupedLogs.today.map((log) => (
                      <CallCard key={log.id} log={log} />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Older Calls */}
            {groupedLogs.older.length > 0 && (
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="older-calls" className="border-none">
                  <AccordionTrigger className="hover:no-underline py-2 px-4 rounded-2xl hover:bg-secondary/10 transition-colors">
                    <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                      Older Calls ({totalOlderCount})
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 space-y-8">
                    {groupedLogs.older.map((group) => (
                      <div key={group.date} className="space-y-4">
                        <h4 className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] ml-4">
                          {group.date}
                        </h4>
                        <div className="grid gap-4">
                          <AnimatePresence mode="popLayout">
                            {group.logs.map((log) => (
                              <CallCard key={log.id} log={log} />
                            ))}
                          </AnimatePresence>
                        </div>
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

            {filteredLogs.length === 0 && (
              <div className="text-center py-20 space-y-4">
                <div className="w-24 h-24 bg-secondary/30 rounded-[2.5rem] flex items-center justify-center mx-auto text-muted-foreground border border-white/5">
                  <Phone size={40} />
                </div>
                <div className="space-y-1">
                  <p className="text-foreground font-black">No {activeTab === "missed" ? "missed" : "recent"} calls</p>
                  <p className="text-xs text-muted-foreground">Your call logs will appear here</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Calls;
