"use client";

import React, { useState } from 'react';
import { X, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ReportOverlayProps {
  contentId: string;
  onClose: () => void;
  onReport: (reason: string) => Promise<void>;
}

export const ReportOverlay: React.FC<ReportOverlayProps> = ({ contentId, onClose, onReport }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const reasons = [
    'Inappropriate Content',
    'Spam or Misleading',
    'Harassment',
    'Intellectual Property Violation',
    'Other'
  ];

  const handleSubmit = async () => {
    if (!reason) return;
    setLoading(true);
    try {
      await onReport(reason);
      toast.success('Report Transmitted');
      onClose();
    } catch (error) {
      toast.error('Transmission Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1500] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[40px] p-8 space-y-6 shadow-2xl">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3 text-red-500">
            <AlertTriangle size={24} />
            <h2 className="text-xl font-black tracking-tight">Report Signal</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
            <X size={20} />
          </button>
        </div>

        <p className="text-xs font-medium text-slate-500 leading-relaxed">
          Help us maintain the EyeField integrity. Select a reason for flagging this transmission.
        </p>

        <div className="space-y-2">
          {reasons.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={`w-full text-left p-4 rounded-2xl text-xs font-bold transition-all ${
                reason === r 
                  ? 'bg-navy-950 text-white' 
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !reason}
          className="w-full bg-red-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
          Submit Report
        </button>
      </div>
    </div>
  );
};