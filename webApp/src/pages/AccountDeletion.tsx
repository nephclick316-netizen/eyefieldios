import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, UserX, AlertTriangle, ShieldAlert } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/context/UserContext";

const DELETION_REASONS = [
  "Privacy concerns",
  "Too many bugs or technical issues",
  "I don't find the app useful anymore",
  "I'm using a different account",
  "Found a better alternative",
  "Other"
];

const AccountDeletion = () => {
  const { user } = useUser();
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !reason) {
      toast.error("Please fill out your email and select a reason.");
      return;
    }

    if (user && user.email !== email) {
      toast.error("The email you entered doesn't match your account email.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Store the request in user_reports as an account deletion request
      const { error } = await supabase
        .from("user_reports")
        .insert({
          reporter_id: user?.id, // Optional if logged out, but we use it if logged in
          reported_user_id: user?.id,
          reason: "ACCOUNT_DELETION",
          details: `Reason: ${reason}\nEmail: ${email}\nCustom Message: ${message || 'None'}`
        });

      if (error) throw error;

      if (user) {
        await supabase.auth.signOut();
      }

      toast.success("Your account deletion request has been submitted successfully.", {
        duration: 5000,
        icon: <ShieldAlert className="text-accent" />
      });
      setIsSuccess(true);
      
    } catch (error: any) {
      console.error("Error submitting deletion request:", error);
      toast.error("There was an error submitting your request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white dark:bg-secondary/20 rounded-[3rem] p-10 border border-gray-100 dark:border-white/5 text-center space-y-6 shadow-2xl">
          <div className="w-24 h-24 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto">
            <UserX size={48} />
          </div>
          <h1 className="text-2xl font-black text-foreground">Request Received</h1>
          <p className="text-muted-foreground">
            We have received your account deletion request. Our administration team will process it and completely remove your data within 7-14 business days.
          </p>
          <div className="pt-6">
            <Link to="/">
              <Button className="w-full rounded-2xl h-14 bg-accent hover:bg-accent/90 text-white font-bold text-lg">
                Return to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 pb-24">
      <div className="w-full max-w-xl">
        <Link to="/settings" className="inline-flex items-center gap-2 text-muted-foreground hover:text-accent font-bold mb-8 transition-colors">
          <ArrowLeft size={20} /> Back to Settings
        </Link>
        
        <div className="bg-white dark:bg-secondary/20 rounded-[3rem] p-8 md:p-12 border border-gray-100 dark:border-white/5 shadow-2xl">
          <div className="text-center space-y-4 mb-10">
            <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={36} />
            </div>
            <h1 className="text-3xl font-black text-foreground">Delete Account</h1>
            <p className="text-muted-foreground max-w-sm mx-auto">
              We're sad to see you go. Please fill out this form to request your account and data deletion.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground ml-2">Email Address</label>
              <Input 
                type="email"
                placeholder="Enter the email associated with your account"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-14 rounded-2xl bg-secondary/30 border-none focus-visible:ring-accent"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground ml-2">Why are you leaving?</label>
              <select 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                className="w-full h-14 rounded-2xl bg-secondary/30 border-none px-4 text-sm focus:ring-2 focus:ring-accent focus:outline-none appearance-none"
              >
                <option value="" disabled>Select a reason...</option>
                {DELETION_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground ml-2">Additional Comments (Optional)</label>
              <Textarea 
                placeholder="Tell us more about your experience or why you decided to delete your account..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[120px] rounded-2xl bg-secondary/30 border-none focus-visible:ring-accent resize-none pt-4"
              />
            </div>

            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3 mt-8">
              <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-red-500/90 font-medium">
                Warning: Deleting your account is permanent. All your data, messages, products, and followers will be permanently removed.
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full rounded-2xl h-14 bg-red-500 hover:bg-red-600 text-white font-black text-lg transition-colors mt-8"
            >
              {isSubmitting ? "Submitting Request..." : "Request Account Deletion"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AccountDeletion;
