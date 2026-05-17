import React, { useState, useRef, useEffect } from 'react';
import { Plus, UserPlus, CalendarPlus, CreditCard } from 'lucide-react';
import { Button } from './ui/Button';

interface Props {
  setActiveTab: (tab: string) => void;
}

export default function FloatingActionButton({ setActiveTab }: Props) {
  const [isFabOpen, setIsFabOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setIsFabOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={fabRef} className="fixed bottom-8 right-8 z-[100] flex flex-col-reverse items-end gap-3 group/fab pointer-events-none">
      {/* Main Button */}
      <button
        onClick={() => setIsFabOpen(!isFabOpen)}
        className="pointer-events-auto relative w-14 h-14 bg-gradient-to-tr from-sky-400 to-blue-500 text-white rounded-[20px] shadow-[0_8px_32px_rgba(56,189,248,0.4)] flex items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-[0_12px_48px_rgba(56,189,248,0.5)] p-0 z-10 before:absolute before:inset-0 before:rounded-[20px] before:border before:border-white/40 before:bg-white/10 before:backdrop-blur-md outline-none focus:outline-none focus:ring-4 focus:ring-sky-300/30"
      >
        <span className="absolute inset-0 rounded-[20px] bg-sky-300/20 animate-ping opacity-0 group-hover/fab:opacity-100 transition-opacity duration-300 pointer-events-none"></span>
        <Plus className={`w-6 h-6 relative z-10 transition-transform duration-500 ${isFabOpen ? 'rotate-[135deg]' : ''}`} />
      </button>

      {/* Secondary Buttons */}
      <div className={`flex flex-col items-end gap-3 transition-all duration-500 transform-gpu origin-bottom ${isFabOpen ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 translate-y-8 scale-95 pointer-events-none'}`}>
        <button 
          onClick={() => { setIsFabOpen(false); setActiveTab('finances'); }}
          className="flex items-center gap-3 bg-white/70 backdrop-blur-xl border border-white/60 px-5 py-3.5 text-sky-950 rounded-[18px] shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:bg-white hover:-translate-x-1 hover:shadow-[0_8px_24px_rgba(14,165,233,0.12)] transition-all duration-300 outline-none"
        >
          <span className="font-bold text-[13px] tracking-wide text-sky-900">Thu học phí</span>
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 text-amber-500 p-2 rounded-xl ring-1 ring-white shadow-sm">
            <CreditCard className="w-4 h-4" />
          </div>
        </button>
        
        <button 
          onClick={() => { setIsFabOpen(false); setActiveTab('classes'); }}
          className="flex items-center gap-3 bg-white/70 backdrop-blur-xl border border-white/60 px-5 py-3.5 text-sky-950 rounded-[18px] shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:bg-white hover:-translate-x-1 hover:shadow-[0_8px_24px_rgba(14,165,233,0.12)] transition-all duration-300 outline-none"
        >
          <span className="font-bold text-[13px] tracking-wide text-sky-900">Lên lịch học</span>
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 text-emerald-500 p-2 rounded-xl ring-1 ring-white shadow-sm">
            <CalendarPlus className="w-4 h-4" />
          </div>
        </button>

        <button 
          onClick={() => { setIsFabOpen(false); setActiveTab('students'); }}
          className="flex items-center gap-3 bg-white/70 backdrop-blur-xl border border-white/60 px-5 py-3.5 text-sky-950 rounded-[18px] shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:bg-white hover:-translate-x-1 hover:shadow-[0_8px_24px_rgba(14,165,233,0.12)] transition-all duration-300 outline-none"
        >
          <span className="font-bold text-[13px] tracking-wide text-sky-900">Thêm học viên mới</span>
          <div className="bg-gradient-to-br from-blue-50 to-sky-50 text-blue-500 p-2 rounded-xl ring-1 ring-white shadow-sm">
            <UserPlus className="w-4 h-4" />
          </div>
        </button>
      </div>
    </div>
  );
}
