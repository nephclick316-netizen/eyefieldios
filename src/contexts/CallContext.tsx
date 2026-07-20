"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { callService } from '../services/callService';
import { toast } from 'react-hot-toast';

// Import types for type-safety
import type { IAgoraRTC, IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack, IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';

interface CallState {
    peer: User;
    type: 'voice' | 'video';
    isCaller: boolean;
    status: 'ringing' | 'connected';
    channelId: string;
}

interface CallContextType {
    startCall: (peer: User, type: 'voice' | 'video') => Promise<void>;
    endCall: () => Promise<void>;
    acceptCall: () => Promise<void>;
    rejectCall: () => Promise<void>;
    activeCall: CallState | null;
    localTracks: { video?: ICameraVideoTrack; audio?: IMicrophoneAudioTrack };
    remoteUsers: IAgoraRTCRemoteUser[];
    isMuted: boolean;
    isCameraOff: boolean;
    toggleMute: () => void;
    toggleCamera: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const useCall = () => {
    const context = useContext(CallContext);
    if (!context) {
        // Return a safe dummy object if not in provider, but ideally throw error
        return {
            startCall: async () => { },
            endCall: async () => { },
            acceptCall: async () => { },
            rejectCall: async () => { },
            activeCall: null,
            localTracks: {},
            remoteUsers: [],
            isMuted: false,
            isCameraOff: false,
            toggleMute: () => { },
            toggleCamera: () => { }
        } as CallContextType;
    }
    return context;
};

const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || "";

export const CallProvider: React.FC<{ currentUser: User | null; children: React.ReactNode }> = ({ children, currentUser }) => {
    const [activeCall, setActiveCall] = useState<CallState | null>(null);
    const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
    const [localTracks, setLocalTracks] = useState<{ video?: ICameraVideoTrack; audio?: IMicrophoneAudioTrack }>({});
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);

    const clientRef = useRef<IAgoraRTCClient | null>(null);
    const agoraRef = useRef<IAgoraRTC | null>(null);
    const isMounted = useRef(true);
    // Use a ref to read activeCall inside callbacks without adding it to useEffect deps.
    // Adding activeCall to deps caused the subscription to tear down & rebuild on every
    // state change, losing incoming signals mid-call.
    const activeCallRef = useRef<CallState | null>(null);
    useEffect(() => { activeCallRef.current = activeCall; }, [activeCall]);

    useEffect(() => {
        isMounted.current = true;
        if (!currentUser) return;

        // Initialize Call signaling subscription.
        // IMPORTANT: dependency array is [currentUser] ONLY — adding activeCall here
        // caused the subscription to rebuild every time call state changed, losing events.
        const channel = callService.subscribeToCalls(currentUser.id, {
            onIncoming: (payload) => {
                // Use the ref so we don't need activeCall in the deps array.
                if (activeCallRef.current) {
                    callService.sendSignal(payload.callerId, 'call_busy', { channelId: payload.channelId });
                    return;
                }
                setActiveCall({
                    peer: payload.caller,
                    type: payload.type,
                    isCaller: false,
                    status: 'ringing',
                    channelId: payload.channelId
                });
            },
            onAccepted: async (_payload) => {
                const current = activeCallRef.current;
                if (current && current.isCaller) {
                    await joinAgoraChannel(current.channelId);
                    if (isMounted.current) {
                        setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null);
                    }
                }
            },
            onRejected: () => {
                toast.error("Call rejected");
                cleanup();
            },
            onEnded: () => {
                toast("Call ended", { icon: '📞' });
                cleanup();
            }
        });

        return () => {
            isMounted.current = false;
            callService.unsubscribe(channel);
            cleanup();
        };
    }, [currentUser]); // <-- Only re-subscribe when the logged-in user changes

    const cleanup = async () => {
        if (localTracks.audio) {
            localTracks.audio.stop();
            localTracks.audio.close();
        }
        if (localTracks.video) {
            localTracks.video.stop();
            localTracks.video.close();
        }
        if (clientRef.current) {
            await clientRef.current.leave();
        }
        if (isMounted.current) {
            setLocalTracks({});
            setRemoteUsers([]);
            setActiveCall(null);
            setIsMuted(false);
            setIsCameraOff(false);
        }
    };

    const joinAgoraChannel = async (channelId: string) => {
        if (!AGORA_APP_ID) {
            toast.error("Agora App ID is missing. Call cannot connect.");
            return;
        }

        try {
            const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
            agoraRef.current = AgoraRTC;
            
            if (!clientRef.current) {
                clientRef.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
            }

            clientRef.current.on('user-published', async (user, mediaType) => {
                await clientRef.current?.subscribe(user, mediaType);
                if (mediaType === 'video') {
                    setRemoteUsers(prev => [...prev.filter(u => u.uid !== user.uid), user]);
                }
                if (mediaType === 'audio') {
                    user.audioTrack?.play();
                }
            });

            clientRef.current.on('user-unpublished', (user) => {
                setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
            });

            await clientRef.current.join(AGORA_APP_ID, channelId, null, currentUser?.id);

            const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
            let videoTrack: ICameraVideoTrack | undefined;
            
            // Read from ref so this function doesn't need activeCall in its closure deps
            if (activeCallRef.current?.type === 'video') {
                videoTrack = await AgoraRTC.createCameraVideoTrack();
            }

            if (videoTrack) {
                await clientRef.current.publish([audioTrack, videoTrack]);
                setLocalTracks({ audio: audioTrack, video: videoTrack });
            } else {
                await clientRef.current.publish([audioTrack]);
                setLocalTracks({ audio: audioTrack });
            }

            // Log the call in history
            const callSnapshot = activeCallRef.current;
            if (callSnapshot) {
                await callService.logCall(
                    callSnapshot.isCaller ? currentUser!.id : callSnapshot.peer.id,
                    callSnapshot.isCaller ? callSnapshot.peer.id : currentUser!.id,
                    callSnapshot.type,
                    'completed'
                );
            }

        } catch (error) {
            console.error("Agora join failed", error);
            toast.error("Failed to connect to call");
            cleanup();
        }
    };

    const startCall = async (peer: User, type: 'voice' | 'video') => {
        if (!currentUser) return;
        const channelId = callService.generateChannelId();
        setActiveCall({
            peer,
            type,
            isCaller: true,
            status: 'ringing',
            channelId
        });

        await callService.sendSignal(peer.id, 'incoming_call', {
            callerId: currentUser.id,
            caller: currentUser,
            type,
            channelId
        });
    };

    const acceptCall = async () => {
        if (!activeCall || !currentUser) return;
        await callService.sendSignal(activeCall.peer.id, 'call_accepted', {
            channelId: activeCall.channelId
        });
        await joinAgoraChannel(activeCall.channelId);
    };

    const rejectCall = async () => {
        if (!activeCall) return;
        await callService.sendSignal(activeCall.peer.id, 'call_rejected', {
            channelId: activeCall.channelId
        });
        // Log missed/rejected call
        await callService.logCall(activeCall.peer.id, currentUser!.id, activeCall.type, 'rejected');
        cleanup();
    };

    const endCall = async () => {
        if (!activeCall) return;
        await callService.sendSignal(activeCall.peer.id, 'call_ended', {
            channelId: activeCall.channelId
        });
        cleanup();
    };

    const toggleMute = () => {
        if (localTracks.audio) {
            localTracks.audio.setEnabled(isMuted);
            setIsMuted(!isMuted);
        }
    };

    const toggleCamera = () => {
        if (localTracks.video) {
            localTracks.video.setEnabled(isCameraOff);
            setIsCameraOff(!isCameraOff);
        }
    };

    return (
        <CallContext.Provider value={{ 
            startCall, endCall, acceptCall, rejectCall, 
            activeCall, localTracks, remoteUsers, 
            isMuted, isCameraOff, toggleMute, toggleCamera 
        }}>
            {children}
        </CallContext.Provider>
    );
};