"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { formatDistanceToNow, isPast } from "date-fns";
import { Loader2, Edit2, Check, X, Calendar as CalendarIcon } from "lucide-react";

interface Payment {
  id?: string;
  service_name: string;
  due_date: string;
}

const DEFAULT_PAYMENTS = [
  { service_name: "Supabase", due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
  { service_name: "Google Cloud", due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
  { service_name: "Agora", due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
  { service_name: "Redis", due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
];

interface PlatformPaymentsProps {
  userEmail: string;
}

const PlatformPayments: React.FC<PlatformPaymentsProps> = ({ userEmail }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<string | null>(null);
  const [editDate, setEditDate] = useState<string>("");
  const [fetchError, setFetchError] = useState<string | null>(null);

  const canEdit = userEmail === "nephclick@gmail.com";

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase.from('platform_payments').select('*').order('service_name');
      if (error) {
        setFetchError(error.message);
        setPayments(DEFAULT_PAYMENTS);
      } else if (data && data.length > 0) {
        setPayments(data);
      } else {
        setPayments(DEFAULT_PAYMENTS);
      }
    } catch (e) {
      setPayments(DEFAULT_PAYMENTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleSave = async (serviceName: string) => {
    if (!editDate) return;
    try {
      const { error } = await supabase
        .from('platform_payments')
        .upsert({ service_name: serviceName, due_date: new Date(editDate).toISOString(), updated_at: new Date().toISOString() }, { onConflict: 'service_name' });
      
      if (error) throw error;
      
      toast.success(`${serviceName} payment date updated`);
      setEditingService(null);
      fetchPayments();
    } catch (error) {
      toast.error(`Failed to update. Note: Run the SQL migration for platform_payments if it doesn't exist.`);
      setPayments(prev => prev.map(p => p.service_name === serviceName ? { ...p, due_date: new Date(editDate).toISOString() } : p));
      setEditingService(null);
    }
  };

  if (loading) {
    return (
      <Card className="bg-secondary/20 border-white/5 rounded-[2.5rem]">
        <CardContent className="p-8 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-secondary/20 border-white/5 rounded-[2.5rem]">
      <CardHeader>
        <CardTitle className="text-xl font-black">Platform Payments & Subscriptions</CardTitle>
        {fetchError && (
          <p className="text-xs text-red-500 font-bold mt-2">Error connecting to DB: {fetchError}. Showing default values.</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {payments.map((payment) => {
            const date = new Date(payment.due_date);
            const isOverdue = isPast(date);
            const timeRemaining = formatDistanceToNow(date, { addSuffix: true });
            
            return (
              <div key={payment.service_name} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-background/30 rounded-2xl border border-white/5">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isOverdue ? 'bg-red-500/10 text-red-500' : 'bg-accent/10 text-accent'}`}>
                    <CalendarIcon size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{payment.service_name}</p>
                    <p className={`text-xs ${isOverdue ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {isOverdue ? 'Overdue' : 'Due'} {timeRemaining}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {editingService === payment.service_name ? (
                    <div className="flex items-center gap-2">
                      <Input 
                        type="date" 
                        className="bg-secondary/50 border-white/10"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                      />
                      <Button size="icon" variant="ghost" onClick={() => handleSave(payment.service_name)} className="text-green-500 hover:text-green-600 hover:bg-green-500/10">
                        <Check size={18} />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setEditingService(null)} className="text-red-500 hover:text-red-600 hover:bg-red-500/10">
                        <X size={18} />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm font-medium mr-4">
                        {date.toLocaleDateString()}
                      </div>
                      {canEdit && (
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="text-muted-foreground hover:text-accent"
                          onClick={() => {
                            setEditingService(payment.service_name);
                            setEditDate(date.toISOString().split('T')[0]);
                          }}
                        >
                          <Edit2 size={16} />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default PlatformPayments;
