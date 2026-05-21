import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Clock, FileSpreadsheet, CheckCircle, Trash2, AlertTriangle } from 'lucide-react';
import { FinanceHistoryRecord, formatVND } from '../types';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';

interface Props {
  financeHistory: FinanceHistoryRecord[];
  deleteFinanceHistory: (batchIdStr: string) => Promise<void>;
}

export default function FinanceHistory({ financeHistory, deleteFinanceHistory }: Props) {
  const [selectedHistoryRecord, setSelectedHistoryRecord] = useState<FinanceHistoryRecord | null>(null);
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);

  const groupedHistory = financeHistory.reduce((acc, record) => {
    const dateStr = new Date(record.timestamp).toISOString().split('T')[0];
    const month = dateStr.substring(0, 7); // YYYY-MM
    if (!acc[month]) acc[month] = [];
    acc[month].push(record);
    return acc;
  }, {} as Record<string, FinanceHistoryRecord[]>);

  const handleDelete = async () => {
    if (!deletingRecordId) return;
    await deleteFinanceHistory(deletingRecordId);
    setDeletingRecordId(null);
    if (selectedHistoryRecord?.id === deletingRecordId) {
      setSelectedHistoryRecord(null);
    }
  };

  return (
    <>
      <motion.div 
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
        className="bg-white/50 backdrop-blur-3xl border border-white dark:border-slate-700 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[40px] overflow-hidden"
      >
        <div className="px-10 py-8 border-b border-white dark:border-slate-700/50 bg-white/30 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent"></div>
            <Clock className="w-6 h-6 relative z-10" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-sky-950 dark:text-sky-50 tracking-tight">Lịch Sử Giao Dịch</h2>
            <p className="text-[15px] font-medium text-sky-900 dark:text-sky-100/60 mt-1">Các phiên thu học phí</p>
          </div>
        </div>
        
        <div className="p-10 bg-white/20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Object.keys(groupedHistory).sort().reverse().map((month, mIdx) => (
              <motion.div 
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: mIdx * 0.1 }}
                key={month} className="space-y-4"
              >
                <div className="flex items-center gap-3 mb-5">
                  <h3 className="text-[13px] font-black uppercase tracking-widest text-sky-950 dark:text-sky-50/40">{month.replace('-', '/')}</h3>
                  <div className="h-px bg-white/60 dark:bg-slate-900/60 flex-1 rounded-full"></div>
                </div>
                
                <div className="space-y-4">
                  {groupedHistory[month].map(record => {
                    const date = new Date(record.timestamp);
                    return (
                      <div 
                        key={record.id} 
                        onClick={() => setSelectedHistoryRecord(record)}
                        className="p-5 bg-white/70 backdrop-blur-md rounded-[24px] border border-white dark:border-slate-700 shadow-[0_4px_16px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.06)] hover:-translate-y-1 cursor-pointer transition-all duration-300 group flex flex-col gap-4 relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-sky-200/50 transition-colors"></div>
                        
                        <div className="flex items-start justify-between relative z-10 w-full">
                          <div>
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="font-extrabold text-sky-950 dark:text-sky-50 text-[15px] max-w-[150px] truncate">{record.studentName}</span>
                              <span className="text-[11px] font-bold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-100 shadow-sm">{date.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <p className="text-[13px] font-medium text-sky-900 dark:text-sky-100/50">{date.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setDeletingRecordId(record.id);
                               }}
                               className="w-8 h-8 rounded-full bg-white border border-rose-100 shadow-sm flex items-center justify-center text-rose-400 group-hover:text-rose-600 group-hover:bg-rose-50 transition-colors z-20 hover:scale-110"
                               title="Xóa giao dịch"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                             <div className="w-8 h-8 rounded-full bg-white border border-sky-100 shadow-sm flex items-center justify-center text-sky-400 group-hover:text-sky-600 group-hover:bg-sky-50 transition-colors">
                               <ChevronRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
                             </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-4 pt-4 border-t border-sky-100/50 relative z-10 w-full justify-between items-center">
                           <div className="flex items-center gap-1.5 text-sky-700/80 bg-sky-50/80 px-2 py-1 rounded-lg">
                             <CheckCircle className="w-3.5 h-3.5 text-sky-500" />
                             <span className="text-[12px] font-bold">{record.unpaidSessions} buổi</span>
                           </div>
                           <span className="text-[16px] font-extrabold text-emerald-600">+{formatVND(record.amount)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      <Modal
        isOpen={!!selectedHistoryRecord}
        onClose={() => setSelectedHistoryRecord(null)}
        maxWidth="lg"
        title={
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[16px] bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-sky-950 dark:text-sky-50 tracking-tight">Chi Tiết Biên Lai</h3>
              <p className="text-[14px] font-medium text-sky-900 dark:text-sky-100/60 mt-1">{selectedHistoryRecord ? new Date(selectedHistoryRecord.timestamp).toLocaleString('vi-VN') : ''}</p>
            </div>
          </div>
        }
      >
        {selectedHistoryRecord && (
          <div className="pt-4 space-y-6">
             <div className="p-6 bg-gradient-to-br from-white to-emerald-50 rounded-[24px] border border-emerald-100 shadow-[0_4px_16px_rgba(0,0,0,0.02)] text-center">
               <p className="text-[13px] font-bold text-sky-950 dark:text-sky-50/50 uppercase tracking-widest mb-1">{selectedHistoryRecord.studentName}</p>
               <h4 className="text-3xl font-black text-emerald-600">{formatVND(selectedHistoryRecord.amount)}</h4>
             </div>
             <div>
               <h4 className="font-extrabold text-sky-950 dark:text-sky-50 text-base mb-3 border-b border-sky-100 pb-2">Thông tin thanh toán</h4>
               <div className="space-y-3">
                 <div className="flex justify-between items-center text-[14px]">
                   <span className="text-sky-700/70 font-medium">Học viên</span>
                   <span className="font-bold text-sky-950 dark:text-sky-50">{selectedHistoryRecord.studentName}</span>
                 </div>
                 <div className="flex justify-between items-center text-[14px]">
                   <span className="text-sky-700/70 font-medium">Số buổi đã thu</span>
                   <span className="font-bold text-sky-950 dark:text-sky-50">{selectedHistoryRecord.unpaidSessions} buổi</span>
                 </div>
                 <div className="flex justify-between items-center text-[14px]">
                   <span className="text-sky-700/70 font-medium">Mã giao dịch</span>
                   <span className="font-bold text-sky-950 dark:text-sky-50">{selectedHistoryRecord.id}</span>
                 </div>
               </div>
             </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!deletingRecordId}
        onClose={() => setDeletingRecordId(null)}
        maxWidth="sm"
        title="Xóa lịch sử giao dịch"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeletingRecordId(null)} className="flex-1 font-semibold rounded-[16px]">
              Hủy
            </Button>
            <Button 
              variant="danger" 
              onClick={handleDelete}
              className="flex-1 font-semibold rounded-[16px]"
            >
              Xóa lịch sử
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center pt-2 pb-6">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-rose-50 to-red-50 border border-white dark:border-slate-700 shadow-[0_4px_16px_rgba(244,63,94,0.1)] ring-1 ring-rose-100 mb-6 relative">
            <div className="absolute inset-0 bg-rose-400/20 rounded-full animate-ping opacity-50"></div>
            <AlertTriangle className="w-8 h-8 text-rose-500 relative z-10" />
          </div>
          <p className="text-sky-800 dark:text-sky-200/90 text-center text-[15px] leading-relaxed max-w-[260px]">
            Bạn có chắc muốn xoá lịch sử giao dịch này? Hành động này sẽ hoàn tác cả các buổi học đã được đánh dấu là <span className="font-bold text-emerald-600">Đã thanh toán</span>.
          </p>
        </div>
      </Modal>
    </>
  );
}
