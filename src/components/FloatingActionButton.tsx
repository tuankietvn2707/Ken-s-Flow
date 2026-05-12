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
    <div ref={fabRef} className="fixed bottom-8 right-8 z-50 flex flex-col-reverse items-end gap-3">
      {/* Main Button */}
      <Button
        onClick={() => setIsFabOpen(!isFabOpen)}
        className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:bg-blue-700 p-0"
      >
        <Plus className={`w-6 h-6 transition-transform duration-300 ${isFabOpen ? 'rotate-45' : ''}`} />
      </Button>

      {/* Secondary Buttons */}
      <div className={`flex flex-col items-end gap-3 transition-all duration-300 origin-bottom ${isFabOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <Button 
          variant="outline"
          onClick={() => { setIsFabOpen(false); setActiveTab('finances'); }}
          className="flex items-center gap-3 bg-white/80 backdrop-blur-md border border-sky-200 px-4 py-6 text-sky-950 rounded-xl shadow-sm hover:bg-white hover:text-sky-700 transition-colors"
        >
          <span className="font-medium text-sm">Thu học phí</span>
          <div className="bg-orange-100 text-orange-600 p-1.5 rounded-lg">
            <CreditCard className="w-4 h-4" />
          </div>
        </Button>
        
        <Button 
          variant="outline"
          onClick={() => { setIsFabOpen(false); setActiveTab('classes'); }}
          className="flex items-center gap-3 bg-white/80 backdrop-blur-md border border-sky-200 px-4 py-6 text-sky-950 rounded-xl shadow-sm hover:bg-white hover:text-sky-700 transition-colors"
        >
          <span className="font-medium text-sm">Lên lịch học</span>
          <div className="bg-green-100 text-green-600 p-1.5 rounded-lg">
            <CalendarPlus className="w-4 h-4" />
          </div>
        </Button>

        <Button 
          variant="outline"
          onClick={() => { setIsFabOpen(false); setActiveTab('students'); }}
          className="flex items-center gap-3 bg-white/80 backdrop-blur-md border border-sky-200 px-4 py-6 text-sky-950 rounded-xl shadow-sm hover:bg-white hover:text-sky-700 transition-colors"
        >
          <span className="font-medium text-sm">Thêm học viên mới</span>
          <div className="bg-blue-100 text-blue-600 p-1.5 rounded-lg">
            <UserPlus className="w-4 h-4" />
          </div>
        </Button>
      </div>
    </div>
  );
}
