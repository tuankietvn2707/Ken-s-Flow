import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Plus, Minus, X } from 'lucide-react';
import { FinanceHistoryRecord } from '../types';
import { formatNumber } from './PersonalFinance';

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
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}
        className="glass-panel border border-theme text-theme-primary p-6 rounded-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Lịch Sử Giao Dịch Đã Gộp</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.keys(groupedHistory).sort().reverse().map(month => (
            <div key={month} className="space-y-3">
              <h3 className="text-sm font-bold opacity-60 border-b border-theme pb-1">{month}</h3>
              {groupedHistory[month].map(record => {
                const date = new Date(record.timestamp);
                const income = record.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
                const expense = record.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
                return (
                  <div 
                    key={record.id} 
                    onClick={() => setSelectedHistoryRecord(record)}
                    className="p-4 glass-panel rounded-xl border border-theme hover:bg-theme-section cursor-pointer transition-all group flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium flex items-center gap-2">Chốt sổ <span className="text-xs font-normal opacity-70 bg-sky-200 px-2 py-0.5 rounded">{date.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</span></p>
                      <p className="text-xs opacity-70 mt-1">{date.toLocaleDateString('vi-VN')}</p>
                      <div className="mt-2 flex gap-3 text-xs">
                        <span className="text-emerald-600">+{formatNumber(income)}</span>
                        <span className="text-rose-600">-{formatNumber(expense)}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-theme-muted group-hover:text-cyan-600 transform group-hover:translate-x-1 transition-all" />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {selectedHistoryRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-sky-950/40 backdrop-blur-sm"
              onClick={() => setSelectedHistoryRecord(null)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl max-h-[85vh] flex flex-col glass-panel border border-theme text-theme-primary rounded-3xl shadow-2xl p-0 overflow-hidden"
            >
              <div className="p-6 border-b border-theme flex justify-between items-center glass-panel backdrop-blur-md sticky top-0 z-10">
                <div>
                  <h3 className="text-xl font-bold">Chi Tiết Kỳ Giao Dịch</h3>
                  <p className="text-sm opacity-70 mt-1">Chốt sổ: {new Date(selectedHistoryRecord.timestamp).toLocaleString('vi-VN')}</p>
                </div>
                <button onClick={() => setSelectedHistoryRecord(null)} className="p-2 bg-sky-100 text-sky-600 rounded-full hover:bg-sky-200 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-sky-50 rounded-xl border border-theme">
                    <p className="text-sm opacity-70 mb-1">Số dư tiền mặt</p>
                    <p className="text-lg font-bold text-theme-secondary">{formatNumber(selectedHistoryRecord.balancesSnapshot.cash)}đ</p>
                  </div>
                  <div className="p-4 bg-sky-50 rounded-xl border border-theme">
                    <p className="text-sm opacity-70 mb-1">Số dư ngân hàng</p>
                    <p className="text-lg font-bold text-theme-secondary">{formatNumber(selectedHistoryRecord.balancesSnapshot.banking)}đ</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-theme-primary sticky top-0 glass-panel backdrop-blur-sm px-2 py-2 rounded">Ghi nhận giao dịch ({selectedHistoryRecord.transactions.length})</h4>
                  {selectedHistoryRecord.transactions.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-theme-section border border-theme">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                          {t.type === 'income' ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{t.description}</p>
                          <p className="text-xs opacity-60">{t.category || 'Khác'} • {t.date || 'Không rõ'}</p>
                        </div>
                      </div>
                      <span className={`font-bold text-sm ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatNumber(t.amount)}
                      </span>
                    </div>
                  ))}
                  {selectedHistoryRecord.transactions.length === 0 && (
                    <p className="text-center opacity-50 py-4 text-sm">Không có giao dịch nào trong kỳ này.</p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
