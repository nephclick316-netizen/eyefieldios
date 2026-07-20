import React, { useState } from 'react';
import { X, Search, FileText, Image as ImageIcon, File, List, Calendar } from 'lucide-react';
import { Message } from '../../types';
import { format } from 'date-fns';

interface ChatSearchOverlayProps {
    messages: Message[];
    onClose: () => void;
    onMessageSelect: (messageId: string) => void;
}

type TabType = 'All' | 'Text' | 'Images' | 'Documents';

export const ChatSearchOverlay: React.FC<ChatSearchOverlayProps> = ({ messages, onClose, onMessageSelect }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<TabType>('All');
    
    // Calendar State
    const [showCalendar, setShowCalendar] = useState(false);
    const [filterDate, setFilterDate] = useState<{ day: number, month: number, year: number } | null>(null);
    
    const [selDay, setSelDay] = useState<number>(new Date().getDate());
    const [selMonth, setSelMonth] = useState<number>(new Date().getMonth() + 1);
    const [selYear, setSelYear] = useState<number>(new Date().getFullYear());

    // Filter messages based on search, tab, and date
    const filteredMessages = messages.filter(msg => {
        // 1. Text Search Filter
        const matchesSearch = msg.content?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
        if (searchQuery && !matchesSearch) return false;

        // 2. Tab Filter
        if (activeTab === 'Text' && msg.message_type !== 'text') return false;
        if (activeTab === 'Images' && msg.message_type !== 'image') return false;
        if (activeTab === 'Documents' && msg.message_type !== 'document') return false;

        // 3. Date Filter
        if (filterDate) {
            const msgDate = new Date(msg.created_at);
            if (
                msgDate.getDate() !== filterDate.day || 
                msgDate.getMonth() + 1 !== filterDate.month || 
                msgDate.getFullYear() !== filterDate.year
            ) {
                return false;
            }
        }

        return true;
    });

    const tabs: { id: TabType; icon: React.ReactNode; label: string }[] = [
        { id: 'All', icon: <List size={16} />, label: 'All' },
        { id: 'Text', icon: <FileText size={16} />, label: 'Text' },
        { id: 'Images', icon: <ImageIcon size={16} />, label: 'Images' },
        { id: 'Documents', icon: <File size={16} />, label: 'Docs' },
    ];

    const applyDateFilter = () => {
        setFilterDate({ day: selDay, month: selMonth, year: selYear });
        setShowCalendar(false);
    };

    const clearDateFilter = () => {
        setFilterDate(null);
        setShowCalendar(false);
    };

    // Generate options for selects
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const months = [
        { val: 1, label: 'Jan' }, { val: 2, label: 'Feb' }, { val: 3, label: 'Mar' },
        { val: 4, label: 'Apr' }, { val: 5, label: 'May' }, { val: 6, label: 'Jun' },
        { val: 7, label: 'Jul' }, { val: 8, label: 'Aug' }, { val: 9, label: 'Sep' },
        { val: 10, label: 'Oct' }, { val: 11, label: 'Nov' }, { val: 12, label: 'Dec' }
    ];
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

    return (
        <div className="fixed inset-0 z-[3000] bg-white dark:bg-black p-6 flex flex-col animate-in slide-in-from-right duration-300 pt-safe">
            <header className="flex justify-between items-center mb-6">
                <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-900 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                    <X size={24} />
                </button>
                <h2 className="text-sm font-black uppercase tracking-widest text-navy-950 dark:text-white">Search Chat</h2>
                <div className="w-10" />
            </header>

            {/* Search Bar */}
            <div className="relative mb-4">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search messages..."
                    className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-navy-950 dark:focus:ring-white transition-all text-navy-950 dark:text-white placeholder:text-slate-500"
                />
            </div>

            {/* Calendar Toggle Button */}
            <button 
                onClick={() => setShowCalendar(!showCalendar)} 
                className={`flex items-center justify-between w-full p-4 rounded-2xl mb-6 transition-colors ${filterDate ? 'bg-navy-950 text-white dark:bg-white dark:text-black' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300'}`}
            >
                <span className="text-sm font-bold">
                    {filterDate ? `Filtered: ${filterDate.day} ${months.find(m => m.val === filterDate.month)?.label} ${filterDate.year}` : 'Filter by Date'}
                </span>
                <Calendar size={18} />
            </button>

            {/* Calendar Picker */}
            {showCalendar && (
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl mb-6 flex flex-col gap-4 border border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2">
                    <div className="flex gap-2">
                        <select 
                            value={selMonth} 
                            onChange={e => setSelMonth(Number(e.target.value))} 
                            className="flex-1 p-3 rounded-xl bg-white dark:bg-black border border-slate-200 dark:border-slate-700 text-sm font-bold outline-none"
                        >
                            {months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                        </select>
                        <select 
                            value={selDay} 
                            onChange={e => setSelDay(Number(e.target.value))} 
                            className="flex-1 p-3 rounded-xl bg-white dark:bg-black border border-slate-200 dark:border-slate-700 text-sm font-bold outline-none"
                        >
                            {days.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <select 
                            value={selYear} 
                            onChange={e => setSelYear(Number(e.target.value))} 
                            className="flex-1 p-3 rounded-xl bg-white dark:bg-black border border-slate-200 dark:border-slate-700 text-sm font-bold outline-none"
                        >
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={clearDateFilter} className="flex-1 p-3 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm">Clear</button>
                        <button onClick={applyDateFilter} className="flex-1 p-3 bg-navy-950 text-white dark:bg-white dark:text-black rounded-xl font-bold text-sm">Apply</button>
                    </div>
                </div>
            )}

            {/* Media Tabs */}
            <div className="flex bg-slate-100 dark:bg-white/5 rounded-2xl p-1 mb-6">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === tab.id
                                ? 'bg-white dark:bg-black shadow-sm text-navy-950 dark:text-white'
                                : 'text-slate-500 hover:text-navy-950 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                            }`}
                    >
                        {tab.icon}
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pb-10">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">
                    {filteredMessages.length} Results
                </div>

                {filteredMessages.length === 0 ? (
                    <div className="text-center py-20 opacity-40 flex flex-col items-center">
                        <Search size={32} className="mb-4 text-navy-950 dark:text-white" />
                        <h3 className="font-black uppercase tracking-widest text-xs mb-2">No Matches</h3>
                        <p className="text-[10px] font-medium normal-case max-w-[200px]">
                            Try adjusting your search terms or filters.
                        </p>
                    </div>
                ) : (
                    filteredMessages.map(msg => (
                        <div
                            key={msg.id}
                            onClick={() => onMessageSelect(msg.id)}
                            className="bg-slate-50 dark:bg-white/5 p-4 rounded-[20px] cursor-pointer hover:bg-slate-100 dark:hover:bg-white/10 transition-colors border border-slate-100 dark:border-white/5"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold text-navy-950/70 dark:text-white/70">
                                    {msg.profiles?.displayName || 'Unknown'}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 capitalize bg-slate-200 dark:bg-white/10 px-2 py-0.5 rounded-full">
                                    {format(new Date(msg.created_at), 'MMM d, yyyy • h:mm a')}
                                </span>
                            </div>

                            {msg.message_type === 'image' && msg.media_url ? (
                                <div className="flex items-center gap-3 mt-2 text-sm text-navy-950 dark:text-white font-medium">
                                    <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-white/10 overflow-hidden flex-shrink-0">
                                        <img src={msg.media_url} alt="Shared image" className="w-full h-full object-cover" />
                                    </div>
                                    <span>Photo</span>
                                </div>
                            ) : msg.message_type === 'document' ? (
                                <div className="flex items-center gap-3 mt-2 text-sm text-navy-950 dark:text-white font-medium">
                                    <div className="w-10 h-10 rounded-lg bg-navy-50 text-navy-950 dark:bg-white/10 dark:text-white flex items-center justify-center flex-shrink-0">
                                        <FileText size={20} />
                                    </div>
                                    <span>Document</span>
                                </div>
                            ) : (
                                <p className="text-sm text-navy-950 dark:text-white font-medium opacity-90 line-clamp-3 leading-relaxed">
                                    {msg.content}
                                </p>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};