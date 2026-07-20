"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Trash2, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import VoicePlayer from "./VoicePlayer";
import { motion, AnimatePresence } from "framer-motion";

interface VoiceRecorderProps {
  onSend: (blob: Blob) => void;
  onCancel: () => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSend, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const chunks = useRef<Blob[]>([]);

  useEffect(() => {
    startRecording();
    return () => {
      stopRecording();
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      chunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
        setIsRecording(false);
        if (timerInterval.current) clearInterval(timerInterval.current);
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      
      timerInterval.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleSend = () => {
    if (audioBlob) {
      onSend(audioBlob);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 w-full bg-secondary/50 rounded-[2.5rem] px-6 py-2"
    >
      {isRecording ? (
        <>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="font-black text-sm tabular-nums">{formatTime(recordingTime)}</span>
            <div className="flex-1 h-1 bg-accent/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-accent"
                animate={{ width: ["0%", "100%"] }}
                transition={{ duration: 60, ease: "linear" }}
              />
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={stopRecording}
            className="text-red-500 hover:bg-red-500/10 rounded-full"
          >
            <Square size={20} fill="currentColor" />
          </Button>
        </>
      ) : (
        <>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onCancel}
            className="text-muted-foreground hover:text-red-500 rounded-full"
          >
            <Trash2 size={20} />
          </Button>
          
          <div className="flex-1">
            {previewUrl && <VoicePlayer url={previewUrl} className="min-w-0" />}
          </div>

          <Button 
            onClick={handleSend}
            className="bg-accent hover:bg-accent/90 text-white rounded-full w-12 h-12 shadow-lg shadow-accent/20"
          >
            <Send size={20} />
          </Button>
        </>
      )}
    </motion.div>
  );
};

export default VoiceRecorder;