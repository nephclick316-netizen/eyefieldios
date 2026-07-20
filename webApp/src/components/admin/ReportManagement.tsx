"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ReportManagement = () => {
  const [postReports, setPostReports] = useState<any[]>([]);
  const [productReports, setProductReports] = useState<any[]>([]);
  const [userReports, setUserReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [postsRes, productsRes, usersRes] = await Promise.all([
        supabase.from('post_reports').select('*, reporter:profiles!reporter_id(full_name, username), post:posts(content)'),
        supabase.from('product_reports').select('*, reporter:profiles!reporter_id(full_name, username), product:products(name, description)'),
        supabase.from('user_reports').select('*, reporter:profiles!reporter_id(full_name, username), reported:profiles!reported_user_id(full_name, username)')
      ]);

      if (postsRes.data) setPostReports(postsRes.data);
      if (productsRes.data) setProductReports(productsRes.data);
      if (usersRes.data) setUserReports(usersRes.data);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-secondary p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-none">
        <h3 className="text-xl font-black mb-4 flex items-center gap-2">
          <AlertTriangle className="text-accent" /> Post Reports
        </h3>
        {postReports.length === 0 ? (
          <p className="text-muted-foreground text-sm">No post reports.</p>
        ) : (
          <div className="space-y-4">
            {postReports.map((report) => (
              <div key={report.id} className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="bg-red-500/10 text-red-500 border-none font-bold">
                    {report.reason}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{new Date(report.created_at).toLocaleDateString()}</span>
                </div>
                {report.custom_reason && <p className="text-sm font-medium mb-2">Custom: {report.custom_reason}</p>}
                <p className="text-sm text-muted-foreground mb-2">Reported by: <span className="text-foreground font-bold">{report.reporter?.full_name || report.reporter?.username || 'Unknown'}</span></p>
                <div className="p-3 bg-white dark:bg-black/20 rounded-lg border border-gray-100 dark:border-none">
                  <p className="text-sm italic">"{report.post?.content || 'Post content not found'}"</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-secondary p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-none">
        <h3 className="text-xl font-black mb-4 flex items-center gap-2">
          <AlertTriangle className="text-accent" /> Product Reports
        </h3>
        {productReports.length === 0 ? (
          <p className="text-muted-foreground text-sm">No product reports.</p>
        ) : (
          <div className="space-y-4">
            {productReports.map((report) => (
              <div key={report.id} className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="bg-red-500/10 text-red-500 border-none font-bold">
                    {report.reason}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{new Date(report.created_at).toLocaleDateString()}</span>
                </div>
                {report.custom_reason && <p className="text-sm font-medium mb-2">Custom: {report.custom_reason}</p>}
                <p className="text-sm text-muted-foreground mb-2">Reported by: <span className="text-foreground font-bold">{report.reporter?.full_name || report.reporter?.username || 'Unknown'}</span></p>
                <div className="p-3 bg-white dark:bg-black/20 rounded-lg border border-gray-100 dark:border-none">
                  <p className="text-sm font-bold">{report.product?.name || 'Product not found'}</p>
                  <p className="text-sm italic text-muted-foreground">{report.product?.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-secondary p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-none">
        <h3 className="text-xl font-black mb-4 flex items-center gap-2">
          <AlertTriangle className="text-accent" /> User Reports
        </h3>
        {userReports.length === 0 ? (
          <p className="text-muted-foreground text-sm">No user reports.</p>
        ) : (
          <div className="space-y-4">
            {userReports.map((report) => (
              <div key={report.id} className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="bg-red-500/10 text-red-500 border-none font-bold">
                    {report.reason}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{new Date(report.created_at).toLocaleDateString()}</span>
                </div>
                {report.custom_reason && <p className="text-sm font-medium mb-2">Custom: {report.custom_reason}</p>}
                <p className="text-sm text-muted-foreground mb-1">Reported by: <span className="text-foreground font-bold">{report.reporter?.full_name || report.reporter?.username || 'Unknown'}</span></p>
                <p className="text-sm text-muted-foreground">Reported User: <span className="text-accent font-bold">{report.reported?.full_name || report.reported?.username || 'Unknown'}</span></p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportManagement;
