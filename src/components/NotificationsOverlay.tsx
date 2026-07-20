"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, Bell, Heart, MessageCircle, UserPlus, Activity, CheckCheck, Star } from 'lucide-react';
import { notificationService, Notification } from '../services/notificationService';
import { toast } from 'react-hot-toast';
import LoadingEye from './LoadingEye';

export const NotificationsOverlay: React.FC<{ userId: string; onClose: () => void }> = ({ userId, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    fetchNotifications();
    return () => {
      isMounted.current = false;
    };
  }, [userId]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getNotifications(userId);
      if (isMounted.current) setNotifications(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load notifications");
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead(userId);
      if (isMounted.current) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
      toast.success("All signals cleared");
    } catch (error) {
      toast.error("Failed to clear signals");
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'echo_like':
      case 'pulse_like':
        return <Heart size={16} className="text-red-500 fill-red-500" />;
      case 'echo_comment':
      case 'pulse_comment':
      case 'message':
        return <MessageCircle size={16} className="text-blue-600" />;
      case 'follow':
        return <UserPlus size={16} className="text-blue-600" />;
      case 'product_rating':
      case 'product_comment':
        return <Star size={16} className="text-yellow-500 fill-yellow-500" />;
      default:
        return <Activity size={16} className="text-slate-400" />;
    }
  };

  const getMessage = (n: Notification) => {
    switch (n.type) {
      case 'echo_like': return 'liked your echo';
      case 'pulse_like': return 'liked your pulse';
      case 'echo_comment': return 'commented on your echo';
      case 'pulse_comment': return 'commented on your pulse';
      case 'follow': return 'started following you';
      case 'message': return `sent you a message: ${n.message}`;
      case 'product_rating': return 'rated your product';
      case 'product_comment': return `commented on your product: "${n.message}"`;
      default: return n.message || 'sent you a signal';
    }
  };

  return (
    <div className="fixed inset-0 z-[1400] bg-white dark:bg-black flex flex-col animate-in slide-in-from-right duration-300 pt-safe">
      <header className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-black/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-900 rounded-full active:scale-90 transition-transform">
            <X size={20} />
          </button>
          <h2 className="text-sm font-black uppercase tracking-widest">Neural Alerts</h2>
        </div>
        <button 
          onClick={handleMarkAllRead}
          className="p-2 text-navy-950 dark:text-navy-300 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-colors"
          title="Mark all as read"
        >
          <CheckCheck size={20} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
        {loading ? (
          <div className="flex justify-center py-20"><LoadingEye /></div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-20 gap-4">
            <Bell size={48} />
            <p className="font-black uppercase tracking-widest text-xs">No alerts detected</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div 
              key={n.id} 
              className={`flex items-center gap-4 p-4 rounded-[28px] border transition-all ${
                n.isRead 
                  ? 'bg-white dark:bg-slate-900/40 border-slate-50 dark:border-slate-800 opacity-60' 
                  : 'bg-slate-50 dark:bg-slate-900 border-navy-950/5 dark:border-white/5 shadow-sm'
              }`}
            >
              <div className="relative">
                <img src={n.actor.avatar} className="w-12 h-12 rounded-2xl object-cover border border-slate-100" alt="" />
                <div className="absolute -bottom-1 -right-1 p-1.5 bg-white dark:bg-black rounded-full shadow-lg border border-slate-100 dark:border-slate-800">
                  {getIcon(n.type)}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium leading-relaxed">
                  <span className="font-black">@{n.actor.username}</span> {getMessage(n)}
                </p>
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-1">
                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.createdAt).toLocaleDateString()}
                </p>
              </div>

              {!n.isRead && (
                <div className="w-2 h-2 bg-blue-600 rounded-full" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};