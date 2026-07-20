import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "./UserContext";
import { toast } from "sonner";

interface Call {
  id: string;
  caller_id: string;
  receiver_id: string;
  call_type: "voice" | "video";
  call_status: "ringing" | "accepted" | "declined" | "missed" | "completed" | "busy";
  channel_name: string;
}

interface CallContextType {
  activeCall: Call | null;
  incomingCall: Call | null;
  isRinging: boolean;
  startCall: (receiverId: string, type: "voice" | "video") => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => Promise<void>;
  endCall: () => Promise<void>;
  getToken: (roomName: string, participantName: string) => Promise<{ token: string; appId: string } | null>;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);
  const [isRinging, setIsRinging] = useState(false);

  // Use refs to access latest call state inside realtime callbacks (avoids stale closure)
  const incomingCallRef = useRef<Call | null>(null);
  const activeCallRef = useRef<Call | null>(null);

  useEffect(() => { incomingCallRef.current = incomingCall; }, [incomingCall]);
  useEffect(() => { activeCallRef.current = activeCall; }, [activeCall]);

  useEffect(() => {
    if (!user?.id) return;

    // Polling fallback for incoming calls
    const pollInterval = setInterval(async () => {
      if (incomingCallRef.current || activeCallRef.current) return;
      const { data, error } = await supabase
        .from('call_logs')
        .select('*')
        .eq('receiver_id', user.id)
        .eq('call_status', 'ringing')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (data && !error) {
        setIncomingCall(data as Call);
        setIsRinging(true);
      }
    }, 3000);

    const receiverChannel = supabase
      .channel(`incoming-calls-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'call_logs',
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload) => {
          const newCall = payload.new as Call;
          if (payload.eventType === 'INSERT' && newCall.call_status === 'ringing') {
            setIncomingCall(newCall);
            setIsRinging(true);
          } else if (payload.eventType === 'UPDATE') {
            if (['completed', 'declined', 'missed'].includes(newCall.call_status)) {
              if (incomingCallRef.current?.id === newCall.id) {
                setIncomingCall(null);
                setIsRinging(false);
              }
              if (activeCallRef.current?.id === newCall.id) {
                setActiveCall(null);
              }
            } else if (newCall.call_status === 'accepted') {
              // Receiver's own UPDATE when they accept — ensure activeCall is set
              if (incomingCallRef.current?.id === newCall.id) {
                setActiveCall(newCall);
                setIncomingCall(null);
                setIsRinging(false);
              }
            }
          }
        }
      )
      .subscribe();

    const callerChannel = supabase
      .channel(`outgoing-calls-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'call_logs',
          filter: `caller_id=eq.${user.id}`,
        },
        (payload) => {
          const updatedCall = payload.new as Call;
          if (activeCallRef.current?.id === updatedCall.id || !activeCallRef.current) {
            if (updatedCall.call_status === 'accepted') {
              setActiveCall(updatedCall);
            } else if (['completed', 'declined', 'busy', 'missed'].includes(updatedCall.call_status)) {
              setActiveCall(null);
            }
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(receiverChannel);
      supabase.removeChannel(callerChannel);
    };
  // Only re-subscribe when the user changes, NOT on every call state change
  }, [user?.id]);

  const getToken = async (roomName: string, participantName: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      // Edge function requires 'channelName' and 'userAccount' (not uid)
      const { data, error } = await supabase.functions.invoke('get-agora-token', {
        body: { channelName: roomName, userAccount: participantName },
      });

      if (error) throw error;
      return { token: data.token, appId: data.appId };
    } catch (error: any) {
      console.error("Error getting Agora token:", error);
      return null;
    }
  };

  const startCall = async (receiverId: string, type: "voice" | "video") => {
    if (!user?.id) return;

    const roomName = `room-${Math.random().toString(36).substring(7)}`;
    
    const { data: newCall, error } = await supabase
      .from('call_logs')
      .insert({
        caller_id: user.id,
        receiver_id: receiverId,
        call_type: type,
        call_status: 'ringing',
        channel_name: roomName,
      })
      .select()
      .single();

    if (error) {
      toast.error("Could not start call");
      return;
    }

    setActiveCall(newCall as Call);

    // Trigger push notification to wake up receiver's device (FCM / APNs)
    supabase.functions.invoke('send-call-notification', {
      body: {
        receiverId: receiverId,
        callerId: user.id,
        callerName: user.name || "User",
        roomName: roomName,
        isVideoCall: type === 'video',
        callLogId: newCall.id,
      }
    }).then(({ data, error: fnError }) => {
      if (fnError) {
        console.error("Failed to send call notification:", fnError);
      } else {
        console.log("Call wake-up notification sent successfully:", data);
      }
    }).catch(err => {
      console.error("Error invoking send-call-notification edge function:", err);
    });
  };

  const acceptCall = async () => {
    if (!incomingCall) return;

    const { error } = await supabase
      .from('call_logs')
      .update({ call_status: 'accepted', started_at: new Date().toISOString() })
      .eq('id', incomingCall.id);

    if (error) {
      toast.error("Failed to accept call");
      return;
    }

    setActiveCall({ ...incomingCall, call_status: 'accepted' });
    setIncomingCall(null);
    setIsRinging(false);
  };

  const declineCall = async () => {
    if (!incomingCall) return;

    await supabase
      .from('call_logs')
      .update({ call_status: 'declined', ended_at: new Date().toISOString() })
      .eq('id', incomingCall.id);

    setIncomingCall(null);
    setIsRinging(false);
  };

  const endCall = async () => {
    const callToEnd = activeCall || incomingCall;
    if (!callToEnd) return;

    // If the call was never accepted, mark it as missed
    const finalStatus = callToEnd.call_status === 'ringing' ? 'missed' : 'completed';

    await supabase
      .from('call_logs')
      .update({ call_status: finalStatus, ended_at: new Date().toISOString() })
      .eq('id', callToEnd.id);

    setActiveCall(null);
    setIncomingCall(null);
    setIsRinging(false);
  };

  return (
    <CallContext.Provider value={{ 
      activeCall, 
      incomingCall, 
      isRinging, 
      startCall, 
      acceptCall, 
      declineCall, 
      endCall,
      getToken 
    }}>
      {children}
    </CallContext.Provider>
  );
};

export const useCalls = () => {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error("useCalls must be used within a CallProvider");
  }
  return context;
};
