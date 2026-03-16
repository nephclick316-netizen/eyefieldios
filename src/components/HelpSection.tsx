import React, { useState, useContext } from 'react';
import { Bot, ChevronRight, Plus, Mail, Send, Loader2 } from 'lucide-react';
import { SettingsContext } from '../App';
import { EndocardOverlay } from './EndocardOverlay';
import { toast } from 'react-hot-toast';

export const HelpSection: React.FC<{ onBack: () => void }> = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showAI, setShowAI] = useState(false);
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [sending, setSending] = useState(false);

  const faqs = [
    { q: "What is the Cascadea Marketplace?", a: "Cascadea is our curated luxury exchange for high-end products and services." },
    { q: "Who is Endocard?", a: "Endocard is your personal AI concierge powered by Gemini, designed to handle scheduling and marketplace assistance." },
    { q: "How do I delete a message?", a: "Long-press or tap the three dots next to your message in a chat to reveal the delete option." },
    { q: "Are my chats secure?", a: "Yes, all direct signals within the EyeField are encrypted end-to-end." }
  ];

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactSubject || !contactMessage) return;
    
    setSending(true);
    // Simulate sending email to loko@nephta.click
    setTimeout(() => {
      toast.success("Message transmitted to support.");
      setContactSubject('');
      setContactMessage('');
      setSending(false);
    }, 1500);
  };

  return (
    <div className="p-6 space-y-10 pb-20 overflow-y-auto no-scrollbar">
      <div className="space-y-4">
         <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 border-b pb-2">Concierge Feed</h3>
         <button 
           onClick={() => setShowAI(true)}
           className="w-full flex items-center justify-between p-6 bg-navy-950 text-white rounded-[32px] shadow-xl active:scale-95 transition-all"
         >
           <div className="flex items-center gap-4">
             <div className="p-3 bg-white/10 rounded-2xl"><Bot size={24} /></div>
             <div className="text-left"><p className="font-black text-sm">Ask Endocard AI</p><p className="text-[10px] opacity-60">Concierge Active</p></div>
           </div>
           <ChevronRight size={18} />
         </button>
      </div>

      <div className="space-y-4">
         <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 border-b pb-2">FAQ Matrix</h3>
         <div className="space-y-2">
           {faqs.map((f, i) => (
             <div key={i} className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 transition-all shadow-sm">
               <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left active:bg-slate-100 dark:active:bg-slate-800 transition-colors">
                 <span className="text-xs font-black pr-4">{f.q}</span>
                 <div className={`p-1 rounded-full transition-transform ${openFaq === i ? 'bg-emerald-500 text-white rotate-45' : 'bg-slate-200 dark:bg-slate-700'}`}>
                   <Plus size={16} />
                 </div>
               </button>
               {openFaq === i && <div className="px-6 pb-6 text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed animate-in slide-in-from-top-2">{f.a}</div>}
             </div>
           ))}
         </div>
      </div>

      <div className="space-y-4">
         <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 border-b pb-2">Direct Support</h3>
         <form onSubmit={handleContactSubmit} className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[32px] space-y-4 border border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Subject"
                value={contactSubject}
                onChange={e => setContactSubject(e.target.value)}
                className="w-full bg-white dark:bg-black border-none rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                required
              />
            </div>
            <textarea 
              placeholder="Describe your issue..."
              value={contactMessage}
              onChange={e => setContactMessage(e.target.value)}
              className="w-full bg-white dark:bg-black border-none rounded-2xl py-4 px-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
              rows={4}
              required
            />
            <button 
              type="submit"
              disabled={sending}
              className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Transmit Message
            </button>
         </form>
      </div>

      <div className="pt-10 text-center opacity-30">
        <p className="text-[10px] font-black uppercase tracking-[4px]">EyeField v2.5.0 Alpha</p>
      </div>

      {showAI && <EndocardOverlay onClose={() => setShowAI(false)} />}
    </div>
  );
};