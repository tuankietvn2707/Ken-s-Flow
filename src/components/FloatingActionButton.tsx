import React, { useState, useRef, useEffect } from 'react';
import { Plus, UserPlus, CalendarPlus, CreditCard } from 'lucide-react';

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
    <div ref={fabRef} className="fixed bottom-8 right-8 z-50 flex flex-col-reverse items-end gap-3">
      {/* Main Button */}
      <button
        onClick={() => setIsFabOpen(!isFabOpen)}
        className="w-14 h-14 bg-[#2563EB] text-white rounded-full shadow-[0_4px_14px_rgba(37,99,235,0.4)] flex items-center justify-center transition-all duration-300 hover:bg-blue-700 hover:shadow-[0_6px_20px_rgba(37,99,235,0.5)] focus:outline-none"
      >
        <Plus className={`w-6 h-6 transition-transform duration-300 ${isFabOpen ? 'rotate-45' : ''}`} />
      </button>

      {/* Secondary Buttons */}
      <div className={`flex flex-col items-end gap-3 transition-all duration-300 origin-bottom ${isFabOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <button 
          onClick={() => { setIsFabOpen(false); setActiveTab('finances'); }}
          className="flex items-center gap-3 glass-panel px-4 py-2.5 rounded-xl shadow-[0_4px_16px_rgba(14,165,233,0.1)] text-sky-900 hover:glass-panel/80 hover:text-sky-600 transition-colors"
        >
          <span className="font-medium text-sm">Thu học phí</span>
          <div className="bg-orange-100 text-orange-600 p-1.5 rounded-xl">
            <CreditCard className="w-4 h-4" />
          </div>
        </button>
        
        <button 
          onClick={() => { setIsFabOpen(false); setActiveTab('classes'); }}
          className="flex items-center gap-3 glass-panel px-4 py-2.5 rounded-xl shadow-[0_4px_16px_rgba(14,165,233,0.1)] text-sky-900 hover:glass-panel/80 hover:text-sky-600 transition-colors"
        >
          <span className="font-medium text-sm">Lên lịch học</span>
          <div className="bg-green-100 text-green-600 p-1.5 rounded-xl">
            <CalendarPlus className="w-4 h-4" />
          </div>
        </button>

        <button 
          onClick={() => { setIsFabOpen(false); setActiveTab('students'); }}
          className="flex items-center gap-3 glass-panel px-4 py-2.5 rounded-xl shadow-[0_4px_16px_rgba(14,165,233,0.1)] text-sky-900 hover:glass-panel/80 hover:text-sky-600 transition-colors"
        >
          <span className="font-medium text-sm">Thêm học viên mới</span>
          <div className="bg-blue-100 text-blue-600 p-1.5 rounded-xl">
            <UserPlus className="w-4 h-4" />
          </div>
        </button>
      </div>
    </div>
  );
}
