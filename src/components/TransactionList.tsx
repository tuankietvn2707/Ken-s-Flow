import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus, Trash2, Download, Archive, Check, X, AlertTriangle } from 'lucide-react';
import { Transaction, PaymentSource, FinanceHistoryRecord } from '../types';
import { formatNumber, parseNumber } from './PersonalFinance';

interface Props {
  transactions: Transaction[];
  currentCashBalance: number;
  currentBankingBalance: number;
  deleteTransaction: (id: string) => void;
  consolidateAndResetBalance: (newBalances: { cash: number; banking: number }) => Promise<void>;
}

export default function TransactionList({
  transactions, currentCashBalance, currentBankingBalance, deleteTransaction, consolidateAndResetBalance
}: Props) {
  const [showConsolidateModal, setShowConsolidateModal] = useState(false);
  const [consolidateCashStr, setConsolidateCashStr] = useState('');
  const [consolidateBankingStr, setConsolidateBankingStr] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const exportCSV = () => {
    const headers = ['Ngày', 'Loại', 'Số tiền', 'Danh mục', 'Mô tả'];
    const rows = transactions.map(t => [
      t.date || '',
      t.type === 'income' ? 'Thu' : 'Chi',
      t.amount,
      t.category || '',
      t.description || ''
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "lich_su_thu_chi.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const groupedTransactions = transactions.reduce((acc, t) => {
    const dateStr = t.date || new Date().toISOString().split('T')[0];
    const month = dateStr.substring(0, 7); // YYYY-MM
    if (!acc[month]) acc[month] = [];
    acc[month].push(t);
    return acc;
  }, {} as Record<string, Transaction[]>);

  const handleConsolidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    const cash = parseNumber(consolidateCashStr);
    const banking = parseNumber(consolidateBankingStr);
    if (cash < 0 || banking < 0) return;
    
    setIsSubmitting(true);
    try {
      await consolidateAndResetBalance({ cash, banking });
      setShowConsolidateModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <motion.div 
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
        className="glass-panel border border-sky-300/30 text-sky-950 p-6 rounded-2xl lg:col-span-2"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Giao Dịch Hiện Tại</h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setConsolidateCashStr(currentCashBalance.toString());
                setConsolidateBankingStr(currentBankingBalance.toString());
                setShowConsolidateModal(true);
              }} 
              className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Archive className="w-4 h-4" /> Chốt Sổ
            </button>
            <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-1.5 bg-sky-50/40 rounded-xl text-sm font-medium hover:bg-sky-200 transition-colors">
              <Download className="w-4 h-4" /> Xuất CSV
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {Object.keys(groupedTransactions).sort().reverse().map(month => (
            <div key={month}>
              <h3 className="text-sm font-bold opacity-60 mb-3 border-b border-sky-300/30 pb-1">{month}</h3>
              <div className="space-y-3">
                {groupedTransactions[month].map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-xl hover:glass-panel/50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {t.type === 'income' ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-medium">{t.description}</p>
                        <p className="text-xs opacity-60">{t.category || 'Khác'} • {t.date || 'Không rõ'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatNumber(t.amount)}
                      </span>
                      <button onClick={() => setConfirmDeleteId(t.id)} className="opacity-0 group-hover:opacity-100 text-rose-500 p-1 hover:bg-rose-100 rounded transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {transactions.length === 0 && <p className="text-center opacity-50 py-8">Chưa có giao dịch hoạt động nào.</p>}
        </div>
      </motion.div>

      <AnimatePresence>
        {showConsolidateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-sky-950/40 backdrop-blur-sm"
              onClick={() => setShowConsolidateModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md glass-panel border border-sky-300/30 text-sky-950 rounded-3xl shadow-2xl p-6"
            >
              <h3 className="text-xl font-bold mb-2">Chốt Sổ Kỳ Này</h3>
              <p className="text-sm opacity-70 mb-6">Thao tác này sẽ lưu toàn bộ giao dịch hiện tại vào Lịch sử và reset danh sách để bắt đầu kỳ mới. Vui lòng nhập số dư THỰC TẾ hiện tại của bạn.</p>
              
              <form onSubmit={handleConsolidate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 opacity-80">Tiền mặt thực tế (VNĐ)</label>
                  <input
                    type="text"
                    value={consolidateCashStr}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setConsolidateCashStr(val ? formatNumber(parseInt(val, 10)) : '');
                    }}
                    className="w-full px-4 py-2 rounded-xl glass-panel/50 border border-sky-300/30 focus:ring-2 focus:ring-cyan-500 outline-none"
                    required
                  />
                  <div className="flex justify-between text-xs mt-1 px-1">
                    <span className="opacity-60">Ước tính theo giao dịch:</span>
                    <span className="font-medium">{formatNumber(currentCashBalance)}đ</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 opacity-80">Số dư ngân hàng thực tế (VNĐ)</label>
                  <input
                    type="text"
                    value={consolidateBankingStr}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setConsolidateBankingStr(val ? formatNumber(parseInt(val, 10)) : '');
                    }}
                    className="w-full px-4 py-2 rounded-xl glass-panel/50 border border-sky-300/30 focus:ring-2 focus:ring-cyan-500 outline-none"
                    required
                  />
                  <div className="flex justify-between text-xs mt-1 px-1">
                    <span className="opacity-60">Ước tính theo giao dịch:</span>
                    <span className="font-medium">{formatNumber(currentBankingBalance)}đ</span>
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" disabled={isSubmitting} onClick={() => setShowConsolidateModal(false)} className="flex-1 py-2.5 rounded-xl border border-sky-300/30 font-medium hover:bg-sky-50 transition-colors disabled:opacity-50">Hủy</button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-xl bg-sky-600 text-white font-medium shadow-md hover:bg-sky-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {isSubmitting && (
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    Khóa Sổ
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sky-950/20 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 border border-sky-100 relative"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-rose-100 mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-xl font-bold text-sky-950 text-center mb-2">Xác nhận xóa giao dịch</h3>
              <p className="text-sky-700/80 text-center mb-8">
                Bạn có chắc chắn muốn xóa giao dịch này? Hành động này sẽ thay đổi số dư tài khoản của bạn và không thể hoàn tác.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-sky-700 font-medium bg-sky-50 hover:bg-sky-100 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  onClick={() => {
                    deleteTransaction(confirmDeleteId);
                    setConfirmDeleteId(null);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl text-white font-medium bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm"
                >
                  Xóa
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
