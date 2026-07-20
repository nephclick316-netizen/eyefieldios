"use client";

import React, { useEffect, useRef } from 'react';
import { 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video as VideoIcon, 
  VideoOff, 
  Phone, 
  X,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { useCall } from '../../contexts/CallContext';

export const CallOverlay: React.FC = () => {
    const { 
        activeCall, 
        endCall, 
        acceptCall, 
        rejectCall, 
        localTracks, 
        remoteUsers,
        isMuted,
        isCameraOff,
        toggleMute,
        toggleCamera
    } = useCall();

    const localVideoRef = useRef<HTMLDivElement>(null);
    const remoteVideoRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    useEffect(() => {
        if (activeCall?.status === 'connected' && localTracks.video && localVideoRef.current) {
            localTracks.video.play(localVideoRef.current);
        }
    }, [activeCall?.status, localTracks.video]);

    useEffect(() => {
        remoteUsers.forEach(user => {
            const container = remoteVideoRefs.current[user.uid];
            if (container && user.videoTrack) {
                user.videoTrack.play(container);
            }
        });
    }, [remoteUsers]);

    if (!activeCall) return null;

    return (
        <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-between text-white animate-in fade-in duration-500 overflow-hidden">
            {/* Remote Video (Full Screen) */}
            <div className="absolute inset-0 flex items-center justify-center">
                {activeCall.status === 'connected' && remoteUsers.length > 0 ? (
                    remoteUsers.map(user => (
                        <div 
                            key={user.uid} 
                            ref={el => { remoteVideoRefs.current[user.uid] = el; }}
                            className="w-full h-full object-cover"
                        />
                    ))
                ) : (
                    <div className="flex flex-col items-center gap-6 animate-pulse">
                        <img 
                            src={activeCall.peer.avatar} 
                            className="w-32 h-32 rounded-full border-4 border-brand-primary object-cover shadow-2xl" 
                            alt="" 
                        />
                        <div className="text-center">
                            <h2 className="text-3xl font-bold">{activeCall.peer.displayName}</h2>
                            <p className="text-slate-400 mt-2 uppercase tracking-[4px] font-black text-xs">
                                {activeCall.status === 'ringing' ? (activeCall.isCaller ? 'Calling...' : 'Incoming Call') : 'Connecting...'}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Local Video (PIP) */}
            {activeCall.status === 'connected' && (
                <div className="absolute top-12 right-6 w-32 h-44 rounded-2xl bg-slate-900 border-2 border-white/20 overflow-hidden shadow-2xl z-50">
                    <div ref={localVideoRef} className="w-full h-full object-cover" />
                    {isCameraOff && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                            <VideoOff size={24} className="text-white/40" />
                        </div>
                    )}
                </div>
            )}

            {/* Header Info (Connected state) */}
            {activeCall.status === 'connected' && (
                <div className="absolute top-12 left-6 z-50 px-4 py-2 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10">
                    <div className="flex items-center gap-3">
                        <img src={activeCall.peer.avatar} className="w-8 h-8 rounded-full border border-white/40" alt="" />
                        <div>
                            <p className="text-sm font-bold">{activeCall.peer.displayName}</p>
                            <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest">Connected</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Bar */}
            <div className="absolute bottom-12 left-0 w-full px-6 flex flex-col items-center gap-12 z-50">
                {activeCall.status === 'ringing' && !activeCall.isCaller ? (
                    <div className="flex items-center gap-16 animate-in slide-in-from-bottom duration-500">
                        <button 
                            onClick={rejectCall}
                            className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/40 hover:scale-110 active:scale-95 transition-all"
                        >
                            <PhoneOff size={32} />
                        </button>
                        <button 
                            onClick={acceptCall}
                            className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/40 hover:scale-110 active:scale-95 transition-all outline outline-8 outline-green-500/20"
                        >
                            <Phone size={40} className="animate-bounce" />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-6 p-4 bg-white/10 backdrop-blur-2xl rounded-[40px] border border-white/20 shadow-2xl animate-in slide-in-from-bottom duration-500">
                        <button 
                            onClick={toggleMute}
                            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 hover:bg-white/20'}`}
                        >
                            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                        </button>
                        
                        <button 
                            onClick={toggleCamera}
                            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isCameraOff ? 'bg-red-500 text-white' : 'bg-white/10 hover:bg-white/20'}`}
                        >
                            {isCameraOff ? <VideoOff size={24} /> : <VideoIcon size={24} />}
                        </button>

                        <button 
                            onClick={endCall}
                            className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/40 hover:scale-110 hover:rotate-12 active:scale-95 transition-all"
                        >
                            <PhoneOff size={28} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
