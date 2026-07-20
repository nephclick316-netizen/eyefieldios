"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Cpu, Key, Save, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const AiConfiguration: React.FC = () => {
  const [config, setConfig] = useState({
    openrouter_key: "",
    general_model: "google/gemini-2.0-flash-001",
    search_model: "google/gemini-2.0-flash-001",
    task_model: "anthropic/claude-3.5-sonnet"
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('ai_settings').select('*');
      if (data) {
        const newConfig: any = { ...config };
        data.forEach(item => {
          if (item.setting_key in newConfig) newConfig[item.setting_key] = item.setting_value;
        });
        setConfig(newConfig);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const promises = Object.entries(config).map(([key, value]) => 
        supabase.from('ai_settings').upsert({ setting_key: key, setting_value: value }, { onConflict: 'setting_key' })
      );
      await Promise.all(promises);
      toast.success("AI Configuration updated!");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card className="bg-secondary/20 border-white/5 rounded-[2.5rem]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
              <Cpu size={20} />
            </div>
            <div>
              <CardTitle className="text-xl font-black">OpenRouter Configuration</CardTitle>
              <CardDescription>Manage AI models and API keys</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Key size={14} className="text-accent" /> OpenRouter API Key</Label>
              <Input 
                type="password" 
                value={config.openrouter_key} 
                onChange={(e) => setConfig({...config, openrouter_key: e.target.value})}
                className="rounded-xl bg-background/50 border-none h-12 font-mono"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>General Chat Model</Label>
                <Input value={config.general_model} onChange={(e) => setConfig({...config, general_model: e.target.value})} className="rounded-xl bg-background/50 border-none h-12 text-xs" />
              </div>
              <div className="space-y-2">
                <Label>Product Search Model</Label>
                <Input value={config.search_model} onChange={(e) => setConfig({...config, search_model: e.target.value})} className="rounded-xl bg-background/50 border-none h-12 text-xs" />
              </div>
              <div className="space-y-2">
                <Label>Complex Task Model</Label>
                <Input value={config.task_model} onChange={(e) => setConfig({...config, task_model: e.target.value})} className="rounded-xl bg-background/50 border-none h-12 text-xs" />
              </div>
            </div>
          </div>
          <Button onClick={handleSave} disabled={loading} className="w-full h-14 rounded-2xl bg-accent hover:bg-accent/90 text-white font-black text-lg shadow-xl shadow-accent/20 gap-2">
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} Save AI Configuration
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AiConfiguration;