"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, ShieldCheck, XCircle, UserX, Loader2, Ban, PlayCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface UserManagementProps {
  users: any[];
  loading: boolean;
  onRefresh: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, loading, onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const toggleVerification = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: !currentStatus })
        .eq('id', userId);

      if (error) throw error;
      toast.success(`User ${!currentStatus ? 'verified' : 'unverified'} successfully`);
      onRefresh();
    } catch (error) {
      toast.error("Failed to update verification status.");
    }
  };

  const toggleSuspend = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) throw error;
      toast.success(`User ${newStatus === 'suspended' ? 'suspended' : 'unsuspended'} successfully`);
      onRefresh();
    } catch (error) {
      toast.error("Failed to update user status.");
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This will remove their profile and content.")) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) throw error;
      toast.success("User deleted");
      onRefresh();
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const filteredUsers = users.filter(u => 
    (u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.username || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <Input 
          placeholder="Search users by name or handle..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-14 rounded-2xl bg-secondary/30 border-none focus-visible:ring-accent"
        />
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : filteredUsers.map((u) => (
          <Card key={u.id} className="bg-secondary/20 border-white/5 rounded-[2rem] overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-14 h-14 border-2 border-accent/10">
                    <AvatarImage src={u.avatar_url} />
                    <AvatarFallback>{u.full_name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-lg">{u.full_name || 'User'}</h3>
                      {u.is_verified && <ShieldCheck size={18} className="text-accent" />}
                      {u.status === 'suspended' && <span className="text-xs bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full font-bold">Suspended</span>}
                    </div>
                    <p className="text-sm text-muted-foreground">@{u.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => toggleVerification(u.id, u.is_verified)}
                    className={`rounded-xl font-bold ${u.is_verified ? 'text-red-500 border-red-500/20 hover:bg-red-500/10' : 'text-accent border-accent/20 hover:bg-accent/10'}`}
                  >
                    {u.is_verified ? <XCircle size={16} className="mr-2" /> : <ShieldCheck size={16} className="mr-2" />}
                    {u.is_verified ? 'Unverify' : 'Verify'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => toggleSuspend(u.id, u.status)}
                    className={`rounded-xl font-bold ${u.status === 'suspended' ? 'text-green-500 border-green-500/20 hover:bg-green-500/10' : 'text-orange-500 border-orange-500/20 hover:bg-orange-500/10'}`}
                  >
                    {u.status === 'suspended' ? <PlayCircle size={16} className="mr-2" /> : <Ban size={16} className="mr-2" />}
                    {u.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                  </Button>
                  <button 
                    onClick={() => deleteUser(u.id)}
                    className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <UserX size={20} />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UserManagement;