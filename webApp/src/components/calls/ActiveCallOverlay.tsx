"use client";

import React, { useEffect, useState, useRef } from "react";
import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack, IRemoteUser } from "agora-rtc-sdk-ng";
import { motion, AnimatePresence } from "framer-motion";
import { useCalls } from "@/context/CallContext";
import { useUser } from "@/context/UserContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PhoneOff, Mic, MicOff, Video, VideoOff, Minimize2, Maximize2 } from "lucide-react";
import { toast } from "sonner";

const ActiveCallOverlay = () => {
    const { activeCall, endCall, getToken } = useCalls();
    const { user } = useUser();
    const [credentials, setCredentials] = useState<{ token: string; appId: string } | null>(null);
    const [recipientProfile, setRecipientProfile] = useState<any>(null);
    const [isMinimized, setIsMinimized] = useState(false);

    // Agora States
    const [isConnected, setIsConnected] = useState(false);
    const [isMicMuted, setIsMicMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [remoteUsers, setRemoteUsers] = useState<IRemoteUser[]>([]);
    const [callDuration, setCallDuration] = useState(0);

    // Refs for tracks and client
    const clientRef = useRef<IAgoraRTCClient | null>(null);
    const localAudioRef = useRef<IMicrophoneAudioTrack | null>(null);
    const localVideoRef = useRef<ICameraVideoTrack | null>(null);
    
    // Div refs for video rendering
    const localPlayElRef = useRef<HTMLDivElement | null>(null);
    const remotePlayElRef = useRef<HTMLDivElement | null>(null);

    // Fetch call details & token
    useEffect(() => {
        if (activeCall && activeCall.call_status === 'accepted' && user) {
            getToken(activeCall.channel_name, user.id).then((creds) => {
                if (creds) {
                    setCredentials(creds);
                } else {
                    toast.error("Failed to fetch call token");
                    endCall();
                }
            });
            
            const otherId = activeCall.caller_id === user.id ? activeCall.receiver_id : activeCall.caller_id;
            supabase
                .from('profiles')
                .select('name, avatar_url, username, full_name')
                .eq('id', otherId)
                .single()
                .then(({ data }) => {
                    if (data) {
                        setRecipientProfile({
                            id: otherId,
                            name: data.full_name || data.name || data.username || "User",
                            avatar_url: data.avatar_url
                        });
                    }
                });
        }
    }, [activeCall, user, getToken]);

    // Timer for call duration
    useEffect(() => {
        if (!isConnected) return;
        const interval = setInterval(() => {
            setCallDuration(prev => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [isConnected]);

    // Agora Lifecycle management
    useEffect(() => {
        if (!credentials || !activeCall || !user) return;

        const initAgora = async () => {
            try {
                // 1. Create client
                const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
                clientRef.current = client;

                // 2. Set up event listeners
                client.on("user-published", async (remoteUser, mediaType) => {
                    await client.subscribe(remoteUser, mediaType);
                    
                    if (mediaType === "video") {
                        setRemoteUsers(prev => {
                            if (prev.find(u => u.uid === remoteUser.uid)) return prev;
                            return [...prev, remoteUser];
                        });
                    }
                    if (mediaType === "audio") {
                        remoteUser.audioTrack?.play();
                    }
                });

                client.on("user-unpublished", (remoteUser, mediaType) => {
                    if (mediaType === "video") {
                        setRemoteUsers(prev => prev.filter(u => u.uid !== remoteUser.uid));
                    }
                });

                client.on("user-left", (remoteUser) => {
                    setRemoteUsers(prev => prev.filter(u => u.uid !== remoteUser.uid));
                });

                // 3. Join the channel
                await client.join(
                    credentials.appId,
                    activeCall.channel_name,
                    credentials.token,
                    user.id // Use the Supabase UUID string to match the token
                );

                // 4. Create and publish local tracks
                const isVideo = activeCall.call_type === "video";
                if (isVideo) {
                    const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
                    localAudioRef.current = audioTrack;
                    localVideoRef.current = videoTrack;
                    
                    await client.publish([audioTrack, videoTrack]);
                    setIsConnected(true);
                } else {
                    const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
                    localAudioRef.current = audioTrack;
                    await client.publish([audioTrack]);
                    setIsConnected(true);
                }
            } catch (err: any) {
                console.error("Agora initialization failed:", err);
                const errorMsg = err?.message || err?.name || JSON.stringify(err);
                toast.error(`Failed to connect to Agora: ${errorMsg}`);
                endCall();
            }
        };

        initAgora();

        // 30 seconds limit timeout
        const callLimitTimeout = setTimeout(() => {
            toast.info("Call ended (30-second limit reached)");
            endCall();
        }, 30000);

        return () => {
            clearTimeout(callLimitTimeout);
            // Cleanup on destroy
            const cleanup = async () => {
                localAudioRef.current?.close();
                localVideoRef.current?.close();
                if (clientRef.current) {
                    await clientRef.current.leave();
                }
            };
            cleanup();
        };
    }, [credentials, activeCall, user]);

    // Handle Local Play Element Binding
    useEffect(() => {
        if (isConnected && localVideoRef.current && localPlayElRef.current && !isCameraOff) {
            localVideoRef.current.play(localPlayElRef.current);
        }
    }, [isConnected, isCameraOff]);

    // Handle Remote Play Element Binding
    useEffect(() => {
        const remoteVideoTrack = remoteUsers[0]?.videoTrack;
        if (isConnected && remoteVideoTrack && remotePlayElRef.current) {
            remoteVideoTrack.play(remotePlayElRef.current);
        }
    }, [isConnected, remoteUsers]);

    if (!activeCall || activeCall.call_status !== 'accepted' || !credentials) return null;

    const formatTime = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const toggleMute = () => {
        if (!localAudioRef.current) return;
        const newMuted = !isMicMuted;
        setIsMicMuted(newMuted);
        localAudioRef.current.setEnabled(!newMuted);
    };

    const toggleCamera = () => {
        if (!localVideoRef.current) return;
        const newCameraOff = !isCameraOff;
        setIsCameraOff(newCameraOff);
        localVideoRef.current.setEnabled(!newCameraOff);
    };

    if (isMinimized) {
        return (
            <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="fixed top-4 right-4 z-[200] flex items-center gap-3 p-2 pr-4 rounded-full bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl cursor-pointer"
                onClick={() => setIsMinimized(false)}
            >
                <Avatar className="w-10 h-10 border-2 border-accent">
                    <AvatarImage src={recipientProfile?.avatar_url} className="object-cover" />
                    <AvatarFallback className="bg-slate-800 text-xs font-black text-white">
                        {recipientProfile?.name?.[0]}
                    </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Ongoing Call</span>
                    <span className="text-xs font-bold text-accent">{recipientProfile?.name}</span>
                </div>
                <div className="flex items-center gap-2 ml-2">
                    <Button 
                        size="icon" 
                        variant="destructive" 
                        className="h-8 w-8 rounded-full bg-red-500 hover:bg-red-600"
                        onClick={(e) => { e.stopPropagation(); endCall(); }}
                    >
                        <PhoneOff size={14} />
                    </Button>
                </div>
            </motion.div>
        );
    }

    const isVideo = activeCall.call_type === "video";

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[120] bg-slate-950 flex flex-col items-center justify-center overflow-hidden"
            >
                <div className="relative w-full h-full bg-black overflow-hidden flex flex-col justify-between">
                    
                    {/* Render Video Panels (if video call) */}
                    <div className="absolute inset-0 z-0 flex items-center justify-center bg-slate-950">
                        {!isConnected ? (
                            <div className="flex flex-col items-center gap-4">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
                                <p className="text-white/60 font-black uppercase tracking-widest text-xs">Connecting Call...</p>
                            </div>
                        ) : isVideo ? (
                            // Video Layout
                            <div className="relative w-full h-full">
                                {/* Remote Video Container */}
                                <div 
                                    ref={remotePlayElRef} 
                                    className="w-full h-full object-cover bg-slate-900"
                                    style={{ display: remoteUsers.length > 0 ? "block" : "none" }}
                                />
                                
                                {remoteUsers.length === 0 && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 gap-4">
                                        <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center animate-pulse">
                                            <VideoOff className="text-white/20" size={32} />
                                        </div>
                                        <p className="text-white/40 font-black uppercase tracking-widest text-xs">Waiting for participant...</p>
                                    </div>
                                )}

                                {/* Local Video PIP */}
                                {!isCameraOff && (
                                    <div 
                                        ref={localPlayElRef}
                                        className="absolute top-12 right-6 z-20 w-32 h-48 md:w-44 md:h-60 rounded-3xl overflow-hidden border-2 border-white/15 shadow-2xl bg-slate-900"
                                    />
                                )}
                            </div>
                        ) : (
                            // Voice Layout
                            <div className="flex flex-col items-center gap-6">
                                <div className="relative">
                                    <div className="absolute -inset-4 bg-accent/20 rounded-full blur-xl animate-pulse" />
                                    <Avatar className="w-32 h-32 border-4 border-white/10 relative">
                                        <AvatarImage src={recipientProfile?.avatar_url} className="object-cover" />
                                        <AvatarFallback className="bg-slate-800 text-3xl font-black text-white">
                                            {recipientProfile?.name?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                                <div className="text-center space-y-1">
                                    <h3 className="text-2xl font-black text-white">{recipientProfile?.name}</h3>
                                    <p className="text-xs text-white/50 uppercase tracking-widest font-bold">Voice Call Active</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Top Bar Details */}
                    <div className="z-10 p-6 flex items-center justify-between w-full bg-gradient-to-b from-black/50 to-transparent">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-black text-white/80 uppercase tracking-widest px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10">
                                {formatTime(callDuration)}
                            </span>
                        </div>
                        <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-10 w-10 rounded-full text-white bg-white/5 hover:bg-white/10 border border-white/10"
                            onClick={() => setIsMinimized(true)}
                        >
                            <Minimize2 size={18} />
                        </Button>
                    </div>

                    {/* Bottom Action Controls */}
                    <div className="z-10 p-8 flex justify-center items-center gap-6 w-full bg-gradient-to-t from-black/60 to-transparent">
                        {/* Audio Toggle */}
                        <Button
                            size="icon"
                            variant="ghost"
                            className={`h-14 w-14 rounded-full border border-white/10 ${isMicMuted ? "bg-red-500 text-white hover:bg-red-600" : "bg-white/10 text-white hover:bg-white/20"}`}
                            onClick={toggleMute}
                        >
                            {isMicMuted ? <MicOff size={22} /> : <Mic size={22} />}
                        </Button>

                        {/* End Call */}
                        <Button
                            size="icon"
                            variant="destructive"
                            className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 hover:scale-105 transition-transform"
                            onClick={endCall}
                        >
                            <PhoneOff size={26} />
                        </Button>

                        {/* Camera Toggle (if video) */}
                        {isVideo && (
                            <Button
                                size="icon"
                                variant="ghost"
                                className={`h-14 w-14 rounded-full border border-white/10 ${isCameraOff ? "bg-red-500 text-white hover:bg-red-600" : "bg-white/10 text-white hover:bg-white/20"}`}
                                onClick={toggleCamera}
                            >
                                {isCameraOff ? <VideoOff size={22} /> : <Video size={22} />}
                            </Button>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ActiveCallOverlay;