"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCalls } from "@/context/CallContext";
import { useUser } from "@/context/UserContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PhoneOff, Phone, Loader2, Video } from "lucide-react";

const ConnectingCallOverlay = () => {
    const { activeCall, incomingCall, acceptCall, declineCall, endCall } = useCalls();
    const { user } = useUser();
    const [otherProfile, setOtherProfile] = useState<any>(null);

    const call = incomingCall || (activeCall?.call_status === 'ringing' ? activeCall : null);
    const isIncoming = !!incomingCall;

    useEffect(() => {
        if (call && user) {
            const otherId = call.caller_id === user.id ? call.receiver_id : call.caller_id;
            supabase
                .from('profiles')
                .select('name, avatar_url')
                .eq('id', otherId)
                .single()
                .then(({ data }) => setOtherProfile(data));
            
            if (isIncoming) {
                const audio = new Audio('/ringtone.mp3');
                audio.loop = true;
                audio.play().catch(() => console.log("Autoplay blocked"));
                return () => {
                    audio.pause();
                    audio.currentTime = 0;
                };
            }
        }
    }, [call, user, isIncoming]);

    if (!call) return null;

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[120] bg-slate-950 flex flex-col items-center justify-center overflow-hidden"
            >
                {/* Background Ambient Glow */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 blur-[120px] rounded-full" />
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
                </div>

                <div className="relative z-10 w-full h-full flex flex-col items-center justify-between p-8 py-20 md:py-24">
                    <div className="flex flex-col items-center gap-10 text-center mt-12">
                        <div className="relative">
                            <motion.div
                                animate={{ 
                                    scale: [1, 1.08, 1],
                                    boxShadow: [
                                        "0 0 0 0px rgba(var(--primary), 0)",
                                        "0 0 0 20px rgba(var(--primary), 0.1)",
                                        "0 0 0 0px rgba(var(--primary), 0)"
                                    ]
                                }}
                                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                                className="relative rounded-full p-1 bg-gradient-to-tr from-primary/50 to-accent/50"
                            >
                                <Avatar className="w-40 h-40 md:w-56 md:h-56 border-4 border-slate-950 shadow-2xl">
                                    <AvatarImage src={otherProfile?.avatar_url} className="object-cover" />
                                    <AvatarFallback className="bg-slate-900 text-5xl font-black text-white">
                                        {otherProfile?.name?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                            </motion.div>

                            <motion.div 
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.5, type: "spring" }}
                                className="absolute -bottom-2 -right-2 z-20"
                            >
                                <Avatar className="w-16 h-16 md:w-24 md:h-24 border-4 border-slate-950 shadow-xl">
                                    <AvatarImage src={user?.avatar} className="object-cover" />
                                    <AvatarFallback className="bg-slate-800 font-black text-white">
                                        {user?.name?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                            </motion.div>

                            <div className="absolute -top-2 -left-2 bg-accent p-3 rounded-full text-white shadow-lg z-30 border-4 border-slate-950">
                                {call.call_type === 'video' ? <Video size={20} /> : <Phone size={20} />}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-lg">
                                {otherProfile?.name || (isIncoming ? "Incoming Call..." : "Connecting...")}
                            </h2>
                            <div className="flex items-center justify-center gap-3 px-6 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                                <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary animate-pulse">
                                    {isIncoming 
                                        ? (call.call_type === 'video' ? 'Incoming Video Call' : 'Incoming Voice Call')
                                        : (call.call_type === 'video' ? 'Calling (Video)...' : 'Calling (Voice)...')
                                    }
                                </span>
                                {!isIncoming && <Loader2 size={14} className="animate-spin text-primary" />}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-8 w-full max-w-sm">
                        {isIncoming ? (
                            <>
                                <Button 
                                    size="icon" 
                                    variant="destructive" 
                                    className="h-20 w-20 md:h-24 md:w-24 rounded-full shadow-2xl bg-red-500 hover:bg-red-600 transition-all hover:scale-110 active:scale-95 border-4 border-white/10"
                                    onClick={declineCall}
                                >
                                    <PhoneOff size={32} className="rotate-[135deg]" />
                                </Button>
                                <div className="flex-1" />
                                <Button 
                                    size="icon" 
                                    className="h-20 w-20 md:h-24 md:w-24 rounded-full shadow-2xl bg-green-500 hover:bg-green-600 transition-all hover:scale-110 active:scale-95 border-4 border-white/10"
                                    onClick={acceptCall}
                                >
                                    <Phone size={32} />
                                </Button>
                            </>
                        ) : (
                            <div className="w-full flex justify-center">
                                <Button 
                                    size="icon" 
                                    variant="destructive" 
                                    className="h-20 w-20 md:h-24 md:w-24 rounded-full shadow-2xl bg-red-500 hover:bg-red-600 transition-all hover:scale-110 active:scale-95 border-4 border-white/10"
                                    onClick={endCall}
                                >
                                    <PhoneOff size={32} className="rotate-[135deg]" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ConnectingCallOverlay;