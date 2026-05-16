import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus, Trash2, Download, Archive, Check, X, AlertTriangle, FileText, ArrowRight } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';
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
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
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

  return (
    <>
      <motion.div 
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
        className="bg-white/60 backdrop-blur-md border border-white shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[32px] lg:col-span-2 overflow-hidden flex flex-col"
      >
        <div className="px-8 py-6 border-b border-white/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-sky-950 tracking-tight">Giao Dịch Gần Đây</h2>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              onClick={() => {
                setConsolidateCashStr(currentCashBalance.toString());
                setConsolidateBankingStr(currentBankingBalance.toString());
                setShowConsolidateModal(true);
              }} 
              className="bg-sky-500 hover:bg-sky-600 text-white rounded-[14px] shadow-[0_4px_16px_rgba(14,165,233,0.3)] hover:shadow-[0_8px_24px_rgba(14,165,233,0.4)] transition-all flex-1 sm:flex-none border border-transparent hover:border-sky-400"
            >
              <Archive className="w-4 h-4 mr-2" />
              Chốt Sổ
            </Button>
            <Button
              variant="outline"
              onClick={exportCSV} 
              className="rounded-[14px] bg-white hover:bg-sky-50 border border-sky-100 flex-1 sm:flex-none shadow-sm text-sky-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Xuất CSV
            </Button>
          </div>
        </div>

        <div className="p-8 flex-1 min-h-0 bg-white/20">
          {Object.keys(groupedTransactions).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 opacity-60">
              <div className="w-20 h-20 bg-gradient-to-tr from-sky-100 to-sky-50 -rotate-6 rounded-[24px] flex items-center justify-center mb-6 border border-white shadow-sm">
                <FileText className="w-10 h-10 text-sky-300" />
              </div>
              <p className="text-lg font-bold text-sky-900 mb-2">Chưa có giao dịch nào</p>
              <p className="text-sm font-medium text-sky-600 mt-1 max-w-xs text-center leading-relaxed">Hãy thêm giao dịch mới để bắt đầu theo dõi dòng tiền của bạn</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.keys(groupedTransactions).sort().reverse().map((month, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                  key={month}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <h3 className="text-sm font-extrabold uppercase tracking-widest text-sky-900/60">{month.replace('-', '/')}</h3>
                    <div className="h-px bg-sky-200/50 flex-1 rounded-full"></div>
                  </div>
                  
                  <div className="space-y-3">
                    {groupedTransactions[month].map(t => (
                      <div key={t.id} className="flex items-center justify-between p-4 bg-white/70 backdrop-blur-sm rounded-[20px] border border-white shadow-[0_4px_16px_rgba(0,0,0,0.02)] group hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden">
                        
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center shadow-sm border ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                            {t.type === 'income' ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="font-extrabold text-[15px] text-sky-950 tracking-tight leading-tight mb-1">{t.description}</p>
                            <p className="text-[13px] font-medium text-sky-900/50 flex items-center gap-2">
                              <span className="bg-sky-100/50 px-2 py-0.5 rounded-full text-sky-800">{t.category || 'Khác'}</span>
                              <span className="opacity-70">{t.date}</span>
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <span className={`font-extrabold text-[17px] ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {t.type === 'income' ? '+' : '-'}{formatNumber(t.amount)} <span className="text-sm opacity-60">đ</span>
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setConfirmDeleteId(t.id)} 
                            className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-white hover:bg-rose-500 transition-all h-9 w-9 rounded-xl shadow-sm border border-transparent hover:border-rose-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      <Modal
        isOpen={showConsolidateModal}
        onClose={() => setShowConsolidateModal(false)}
        title="Chốt Sổ Kỳ Này"
        maxWidth="md"
        footer={
          <>
            <Button variant="outline" disabled={isSubmitting} onClick={() => setShowConsolidateModal(false)} className="flex-1 rounded-[14px]">
              Hủy
            </Button>
            <Button
              onClick={(e) => {
                 const form = document.getElementById('consolidate-form') as HTMLFormElement;
                 form?.requestSubmit();
              }}
              disabled={isSubmitting}
              className="flex-1 rounded-[14px] bg-sky-500 hover:bg-sky-600 text-white shadow-[0_4px_16px_rgba(14,165,233,0.3)] transition-all"
            >
              {isSubmitting && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              Khóa Sổ
            </Button>
          </>
        }
      >
        <div className="pt-2">
          <div className="p-4 bg-sky-50 rounded-[16px] border border-sky-100 mb-6">
            <p className="text-[14px] leading-relaxed text-sky-800 font-medium">Thao tác này sẽ lưu toàn bộ giao dịch hiện tại vào Lịch sử và reset danh sách để bắt đầu kỳ mới. Vui lòng nhập số dư THỰC TẾ hiện tại của bạn.</p>
          </div>
          
          <form id="consolidate-form" onSubmit={async (e) => {
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
          }} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-sky-950/60 uppercase tracking-widest pl-1">Tiền mặt thực tế (VNĐ)</label>
              <Input
                type="text"
                value={consolidateCashStr}
                onChange={(e) => {
                   const val = e.target.value.replace(/[^0-9]/g, '');
                   setConsolidateCashStr(val ? formatNumber(parseInt(val, 10)) : '');
                }}
                className="font-bold text-lg border-sky-200 focus:border-sky-400 py-3 rounded-[14px]"
                required
              />
              <div className="flex justify-between items-center text-[13px] mt-1.5 px-2 text-sky-900 border-t border-sky-100 pt-2">
                <span className="opacity-60 font-medium">Ước tính theo sổ sách:</span>
                <span className="font-extrabold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-100">{formatNumber(currentCashBalance)} đ</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-xs font-bold text-sky-950/60 uppercase tracking-widest pl-1">Ngân hàng thực tế (VNĐ)</label>
              <Input
                type="text"
                value={consolidateBankingStr}
                onChange={(e) => {
                   const val = e.target.value.replace(/[^0-9]/g, '');
                   setConsolidateBankingStr(val ? formatNumber(parseInt(val, 10)) : '');
                }}
                className="font-bold text-lg border-sky-200 focus:border-sky-400 py-3 rounded-[14px]"
                required
              />
              <div className="flex justify-between items-center text-[13px] mt-1.5 px-2 text-sky-900 border-t border-sky-100 pt-2">
                <span className="opacity-60 font-medium">Ước tính theo sổ sách:</span>
                <span className="font-extrabold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-100">{formatNumber(currentBankingBalance)} đ</span>
              </div>
            </div>
          </form>
        </div>
      </Modal>

      <Modal
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        maxWidth="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)} className="flex-1 rounded-[14px]">
              Hủy
            </Button>
            <Button 
              variant="danger" 
              onClick={() => {
                if (confirmDeleteId) deleteTransaction(confirmDeleteId);
                setConfirmDeleteId(null);
              }}
              className="flex-1 rounded-[14px]"
            >
              Xóa
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center pt-2 pb-2">
          <div className="flex items-center justify-center w-14 h-14 rounded-[20px] bg-rose-50 border border-rose-100 mb-5 shadow-sm">
            <AlertTriangle className="w-7 h-7 text-rose-500" />
          </div>
          <h3 className="text-xl font-extrabold text-sky-950 text-center mb-2 tracking-tight">Xóa giao dịch</h3>
          <p className="text-sky-700/80 text-center text-[15px] leading-relaxed">
            Bạn có muốn xóa giao dịch này? Hành động này sẽ thay đổi số dư và không thể hoàn tác.
          </p>
        </div>
      </Modal>
    </>
  );
}
