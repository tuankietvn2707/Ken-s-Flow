import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Plus, Minus, X, Clock, FileSpreadsheet } from 'lucide-react';
import { FinanceHistoryRecord } from '../types';
import { formatNumber } from './PersonalFinance';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';

interface Props {
  financeHistory: FinanceHistoryRecord[];
}

export default function FinanceHistory({ financeHistory }: Props) {
  const [selectedHistoryRecord, setSelectedHistoryRecord] = useState<FinanceHistoryRecord | null>(null);

  const groupedHistory = financeHistory.reduce((acc, record) => {
    const dateStr = new Date(record.timestamp).toISOString().split('T')[0];
    const month = dateStr.substring(0, 7); // YYYY-MM
    if (!acc[month]) acc[month] = [];
    acc[month].push(record);
    return acc;
  }, {} as Record<string, FinanceHistoryRecord[]>);

  return (
    <>
      <motion.div 
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
        className="bg-white/50 backdrop-blur-3xl border border-white shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[40px] overflow-hidden"
      >
        <div className="px-10 py-8 border-b border-white/50 bg-white/30 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent"></div>
            <Clock className="w-6 h-6 relative z-10" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-sky-950 tracking-tight">Lịch Sử Giao Dịch</h2>
            <p className="text-[15px] font-medium text-sky-900/60 mt-1">Các kỳ đã chốt sổ</p>
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
                  <h3 className="text-[13px] font-black uppercase tracking-widest text-sky-950/40">{month.replace('-', '/')}</h3>
                  <div className="h-px bg-white/60 flex-1 rounded-full"></div>
                </div>
                
                <div className="space-y-4">
                  {groupedHistory[month].map(record => {
                    const date = new Date(record.timestamp);
                    const income = record.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
                    const expense = record.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
                    return (
                      <div 
                        key={record.id} 
                        onClick={() => setSelectedHistoryRecord(record)}
                        className="p-5 bg-white/70 backdrop-blur-md rounded-[24px] border border-white shadow-[0_4px_16px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.06)] hover:-translate-y-1 cursor-pointer transition-all duration-300 group flex flex-col gap-4 relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-sky-200/50 transition-colors"></div>
                        
                        <div className="flex items-start justify-between relative z-10 w-full">
                          <div>
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="font-extrabold text-sky-950 text-[15px]">Chốt sổ</span>
                              <span className="text-[11px] font-bold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-100 shadow-sm">{date.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <p className="text-[13px] font-medium text-sky-900/50">{date.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-white border border-sky-100 shadow-sm flex items-center justify-center text-sky-400 group-hover:text-sky-600 group-hover:bg-sky-50 transition-colors">
                            <ChevronRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                        
                        <div className="flex gap-4 pt-4 border-t border-sky-100/50 relative z-10 w-full justify-between">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-sky-950/40 uppercase tracking-widest mb-1 pl-0.5">Tổng thu</span>
                            <span className="text-[15px] font-extrabold text-emerald-600">+{formatNumber(income)}</span>
                          </div>
                          <div className="w-px bg-sky-100/50"></div>
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-sky-950/40 uppercase tracking-widest mb-1 pl-0.5">Tổng chi</span>
                            <span className="text-[15px] font-extrabold text-rose-600">-{formatNumber(expense)}</span>
                          </div>
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
        maxWidth="2xl"
        title={
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[16px] bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-sky-950 tracking-tight">Chi Tiết Kỳ Giao Dịch</h3>
              <p className="text-[14px] font-medium text-sky-900/60 mt-1">Chốt sổ: {selectedHistoryRecord ? new Date(selectedHistoryRecord.timestamp).toLocaleString('vi-VN') : ''}</p>
            </div>
          </div>
        }
      >
        {selectedHistoryRecord && (
          <div className="pt-6 max-h-[65vh] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-6 bg-gradient-to-br from-white to-sky-50 rounded-[24px] border border-sky-100 shadow-[0_4px_16px_rgba(0,0,0,0.02)]">
                <p className="text-[12px] font-bold text-sky-950/50 uppercase tracking-widest mb-2">Số dư tiền mặt</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl font-black text-sky-950">{formatNumber(selectedHistoryRecord.balancesSnapshot.cash)}</p>
                  <span className="font-bold text-sm text-sky-950/50">VNĐ</span>
                </div>
              </div>
              <div className="p-6 bg-gradient-to-br from-white to-blue-50 rounded-[24px] border border-blue-100 shadow-[0_4px_16px_rgba(0,0,0,0.02)]">
                <p className="text-[12px] font-bold text-sky-950/50 uppercase tracking-widest mb-2">Số dư ngân hàng</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl font-black text-blue-950">{formatNumber(selectedHistoryRecord.balancesSnapshot.banking)}</p>
                  <span className="font-bold text-sm text-blue-950/50">VNĐ</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h4 className="font-extrabold text-sky-950 text-base">Chi tiết giao dịch</h4>
                <span className="bg-sky-100 text-sky-700 px-2.5 py-0.5 rounded-full text-[13px] font-bold">{selectedHistoryRecord.transactions.length}</span>
                <div className="flex-1 h-px bg-sky-100"></div>
              </div>
              
              <div className="space-y-3 pt-2">
                {selectedHistoryRecord.transactions.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-4 rounded-[20px] bg-white border border-sky-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)] transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center border shadow-sm ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                        {t.type === 'income' ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-extrabold text-[15px] text-sky-950 mb-1">{t.description}</p>
                        <p className="text-[13px] font-medium text-sky-900/50 flex items-center gap-2">
                          <span className="bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-100/50">{t.category || 'Khác'}</span>
                          <span className="opacity-70">{t.date}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`font-black text-[16px] ${t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatNumber(t.amount)}
                      </span>
                      <span className="text-[12px] font-bold opacity-50">đ</span>
                    </div>
                  </div>
                ))}
                {selectedHistoryRecord.transactions.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 opacity-60">
                    <p className="text-[15px] font-medium text-sky-800">Không có giao dịch nào trong kỳ này.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
