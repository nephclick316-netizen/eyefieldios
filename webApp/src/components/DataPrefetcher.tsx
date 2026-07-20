import React, { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/context/UserContext';

const DataPrefetcher: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const { user } = useUser();

  useEffect(() => {
    if (!user?.id) return;

    const prefetchData = async () => {
      // Prefetch Echoes
      await queryClient.prefetchQuery({
        queryKey: ['echoes'],
        queryFn: async () => {
          const { data } = await supabase
            .from('posts')
            .select('*, profiles(full_name, username, avatar_url)')
            .order('created_at', { ascending: false });
          return data;
        },
      });

      // Prefetch Pulses
      await queryClient.prefetchQuery({
        queryKey: ['pulses'],
        queryFn: async () => {
          const { data } = await supabase
            .from('pulses')
            .select('*, profiles:user_id(full_name, username, avatar_url)')
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: true });
          return data;
        },
      });

      // Prefetch Chats (using chat_participants join)
      await queryClient.prefetchQuery({
        queryKey: ['chats', user.id],
        queryFn: async () => {
          const { data } = await supabase
            .from('chat_rooms')
            .select('*')
            .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
          return data;
        },
      });

      // Prefetch Calls
      await queryClient.prefetchQuery({
        queryKey: ['call_logs', user.id],
        queryFn: async () => {
          const { data } = await supabase
            .from('call_logs')
            .select(`
              *,
              caller:profiles!calls_caller_id_fkey(id, name:full_name, avatar_url),
              receiver:profiles!calls_receiver_id_fkey(id, name:full_name, avatar_url)
            `)
            .or(`caller_id.eq.${user.id},receiver_id.eq.${user.id}`)
            .order('created_at', { ascending: false });
          return data;
        },
      });

      // Prefetch Profile
      await queryClient.prefetchQuery({
        queryKey: ['profile', user.id],
        queryFn: async () => {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          return data;
        },
      });
    };

    prefetchData();

    // Set up background refresh interval (every 30 seconds)
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['echoes'] });
      queryClient.invalidateQueries({ queryKey: ['pulses'] });
      queryClient.invalidateQueries({ queryKey: ['chats', user.id] });
      queryClient.invalidateQueries({ queryKey: ['call_logs', user.id] });
    }, 30000);

    return () => clearInterval(interval);
  }, [user?.id, queryClient]);

  return <>{children}</>;
};

export default DataPrefetcher;
