import React, { useState } from 'react';
import { X, Send, RefreshCw, Link as LinkIcon, MapPin } from 'lucide-react';
import { getEndocardResponse } from '../services/geminiService';

export const EndocardOverlay: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string; grounding?: any[] }[]>([
    { role: 'bot', text: 'Hello! I am Endocard. How can I assist you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    const location = { lat: 37.7749, lng: -122.4194 };
    const result = await getEndocardResponse(userText, location);
    
    setMessages(prev => [...prev, { role: 'bot', text: result.text || 'No response', grounding: result.grounding }]);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[1200] bg-white dark:bg-black flex flex-col animate-in slide-in-from-right duration-300">
      <header className="p-4 flex items-center justify-between border-b pt-safe">
        <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-900 rounded-full"><X size={20} /></button>
        <h2 className="text-sm font-black uppercase tracking-widest">Endocard AI</h2>
        <div className="w-10" />
      </header>
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} gap-2`}>
            <div className={`max-w-[85%] p-4 rounded-3xl ${m.role === 'user' ? 'bg-navy-950 text-white' : 'bg-slate-50 dark:bg-slate-900'}`}>
              <p className="text-sm leading-relaxed">{m.text}</p>
            </div>
            {m.grounding && m.grounding.length > 0 && (
              <div className="flex flex-wrap gap-2 max-w-[85%] px-1 mt-1">
                {m.grounding.map((chunk: any, idx: number) => {
                  const web = chunk.web;
                  const maps = chunk.maps;
                  if (web) {
                    return (
                      <a key={idx} href={web.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-blue-500 font-bold flex items-center gap-1 hover:bg-slate-200 transition-colors shadow-sm">
                        <LinkIcon size={10} /> {web.title || 'Search Source'}
                      </a>
                    );
                  }
                  if (maps) {
                    return (
                      <a key={idx} href={maps.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-orange-500 font-bold flex items-center gap-1 hover:bg-slate-200 transition-colors shadow-sm">
                        <MapPin size={10} /> {maps.title || 'View Location'}
                      </a>
                    );
                  }
                  return null;
                })}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="p-4 border-t safe-bottom">
        <div className="bg-slate-100 dark:bg-slate-900 rounded-[32px] p-2 flex items-center gap-2">
          <input 
            type="text" 
            placeholder="Ask Endocard..."
            className="flex-1 bg-transparent border-none outline-none px-4 py-2 text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button onClick={handleSend} className="p-3 bg-navy-950 text-white rounded-full disabled:opacity-50" disabled={loading}>
            {loading ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
};