"use client";

import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { useUser } from "@/context/UserContext";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { LayoutDashboard, Users, Tag, Cpu, Loader2 } from "lucide-react";

import AdminOverview from "@/components/admin/AdminOverview";
import UserManagement from "@/components/admin/UserManagement";
import PromotionManagement from "@/components/admin/PromotionManagement";
import AiConfiguration from "@/components/admin/AiConfiguration";
import ReportManagement from "@/components/admin/ReportManagement";
import { ShieldAlert } from "lucide-react";

const ADMIN_EMAILS = ["nephclick@gmail.com", "eyefieldholybusiness@gmail.com"];

const Admin = () => {
  const { user, isLoading: userLoading } = useUser();
  const [users, setUsers] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [callLogs, setCallLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [usersRes, promosRes, callsRes] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('promotional_cards').select('*').order('created_at', { ascending: false }),
        supabase.from('call_logs').select('*').eq('call_status', 'completed')
      ]);
      
      const errors = [usersRes.error?.message, promosRes.error?.message, callsRes.error?.message].filter(Boolean);
      if (errors.length > 0) {
        setFetchError("Database errors: " + errors.join(", "));
      }

      if (usersRes.data) setUsers(usersRes.data);
      if (promosRes.data) setPromotions(promosRes.data);
      if (callsRes.data) setCallLogs(callsRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email && ADMIN_EMAILS.includes(user.email)) fetchData();
  }, [user]);

  if (userLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-accent" />
    </div>
  );

  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) return <Navigate to="/" />;

  return (
    <MainLayout>
      <div className="space-y-8 pb-20">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">System Control Center</p>
          </div>
          <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20 px-4 py-1 rounded-full font-black">
            SUPER ADMIN
          </Badge>
        </header>

        {fetchError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl font-bold">
            {fetchError}
          </div>
        )}

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full bg-secondary/30 p-1 rounded-2xl h-14 mb-8 overflow-x-auto no-scrollbar flex-nowrap justify-start">
            <TabsTrigger value="overview" className="flex-1 min-w-[100px] rounded-xl data-[state=active]:bg-accent data-[state=active]:text-white font-bold">
              <LayoutDashboard size={18} className="mr-2" /> Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="flex-1 min-w-[100px] rounded-xl data-[state=active]:bg-accent data-[state=active]:text-white font-bold">
              <Users size={18} className="mr-2" /> Users
            </TabsTrigger>
            <TabsTrigger value="promotions" className="flex-1 min-w-[100px] rounded-xl data-[state=active]:bg-accent data-[state=active]:text-white font-bold">
              <Tag size={18} className="mr-2" /> Promos
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex-1 min-w-[100px] rounded-xl data-[state=active]:bg-accent data-[state=active]:text-white font-bold">
              <Cpu size={18} className="mr-2" /> AI Config
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex-1 min-w-[100px] rounded-xl data-[state=active]:bg-accent data-[state=active]:text-white font-bold">
              <ShieldAlert size={18} className="mr-2" /> Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AdminOverview 
              userCount={users.length} 
              activePromos={promotions.filter(p => p.is_active).length} 
              verifiedCount={users.filter(u => u.is_verified).length} 
              callLogs={callLogs}
              userEmail={user.email}
            />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement users={users} loading={loading} onRefresh={fetchData} />
          </TabsContent>

          <TabsContent value="promotions">
            <PromotionManagement promotions={promotions} onRefresh={fetchData} adminId={user.id} />
          </TabsContent>

          <TabsContent value="ai">
            <AiConfiguration />
          </TabsContent>

          <TabsContent value="reports">
            <ReportManagement />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Admin;
