import React, { useState } from 'react';
import { motion } from 'motion/react';
import { TransactionType, PaymentSource, Transaction } from '../types';
import { GoogleGenAI } from '@google/genai';
import { Plus, Minus, ReceiptText, Sparkles, Send } from 'lucide-react';
import { parseNumber, formatNumber } from './PersonalFinance';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface Props {
  addTransaction: (tx: Transaction) => Promise<void>;
}

export default function TransactionForm({ addTransaction }: Props) {
  const [type, setType] = useState<TransactionType>('expense');
  const [source, setSource] = useState<PaymentSource>('cash');
  const [amountStr, setAmountStr] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDescriptionBlur = async () => {
    if (!description || description.length < 3) return;
    setIsCategorizing(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error('Lỗi: Chưa cấu hình GEMINI_API_KEY.');
        setIsCategorizing(false);
        return;
      }
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Phân loại giao dịch sau vào 1 danh mục ngắn gọn (1-3 từ). Giao dịch: "${description}". Loại: ${type === 'income' ? 'Thu nhập' : 'Chi tiêu'}. Chỉ trả về tên danh mục, không giải thích. Ví dụ: Ăn uống, Lương, Mua sắm, Tiền điện.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      if (response.text) {
        setCategory(response.text.trim());
      }
    } catch (error) {
      console.error('Lỗi phân loại:', error);
    } finally {
      setIsCategorizing(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const amount = parseNumber(amountStr);
    if (amount <= 0 || !description || !category) return;

    setIsSubmitting(true);
    const newTx: Transaction = {
      id: Date.now().toString(),
      type,
      source,
      amount,
      description,
      category,
      date,
    };

    try {
      await addTransaction(newTx);
      setAmountStr('');
      setDescription('');
      setCategory('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
      className="lg:col-span-1 bg-white/60 backdrop-blur-2xl border border-white shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[32px] overflow-hidden"
    >
      <div className="px-8 py-6 border-b border-white/40 bg-white/40">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm">
            <ReceiptText className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-extrabold text-sky-950 tracking-tight">Thêm Giao Dịch</h2>
        </div>
      </div>
      
      <div className="p-8">
        <form onSubmit={handleAddTransaction} className="space-y-5">
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-sky-50/80 rounded-2xl border border-sky-100/50">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-2 px-3 rounded-xl text-[13px] font-bold transition-all flex items-center justify-center gap-2 relative ${type === 'expense' ? 'text-rose-700 shadow-sm bg-white' : 'text-sky-900/50 hover:text-sky-900'}`}
            >
              <div className={`p-1 rounded-full ${type === 'expense' ? 'bg-rose-100 text-rose-600' : 'bg-transparent'}`}>
                <Minus className="w-3.5 h-3.5" />
              </div>
              Chi Tiêu
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-2 px-3 rounded-xl text-[13px] font-bold transition-all flex items-center justify-center gap-2 relative ${type === 'income' ? 'text-emerald-700 shadow-sm bg-white' : 'text-sky-900/50 hover:text-sky-900'}`}
            >
              <div className={`p-1 rounded-full ${type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-transparent'}`}>
                <Plus className="w-3.5 h-3.5" />
              </div>
              Thu Nhập
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className={`cursor-pointer py-3 px-4 rounded-[16px] border flex flex-col items-center justify-center gap-1.5 transition-all text-center ${source === 'cash' ? 'bg-sky-50 border-sky-200 text-sky-800 shadow-[0_2px_10px_rgba(14,165,233,0.06)]' : 'border-sky-100 bg-white/50 text-sky-900/50 hover:border-sky-300/50 hover:bg-white'} group`}>
              <input type="radio" value="cash" checked={source === 'cash'} onChange={() => setSource('cash')} className="sr-only" />
              <span className={`text-[13px] font-extrabold tracking-wide uppercase transition-colors ${source === 'cash' ? 'text-sky-700' : 'group-hover:text-sky-900/70'}`}>Tiền mặt</span>
            </label>
            <label className={`cursor-pointer py-3 px-4 rounded-[16px] border flex flex-col items-center justify-center gap-1.5 transition-all text-center ${source === 'banking' ? 'bg-blue-50 border-blue-200 text-blue-800 shadow-[0_2px_10px_rgba(59,130,246,0.06)]' : 'border-sky-100 bg-white/50 text-sky-900/50 hover:border-sky-300/50 hover:bg-white'} group`}>
              <input type="radio" value="banking" checked={source === 'banking'} onChange={() => setSource('banking')} className="sr-only" />
              <span className={`text-[13px] font-extrabold tracking-wide uppercase transition-colors ${source === 'banking' ? 'text-blue-700' : 'group-hover:text-blue-900/70'}`}>Ngân hàng</span>
            </label>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-sky-950/60 uppercase tracking-widest pl-1">Số tiền (VNĐ)</label>
            <div className={`relative flex items-center transition-all duration-300 rounded-[16px] border ${type === 'expense' ? 'focus-within:ring-2 focus-within:ring-rose-200 focus-within:border-rose-300 bg-rose-50/30' : 'focus-within:ring-2 focus-within:ring-emerald-200 focus-within:border-emerald-300 bg-emerald-50/30'}`}>
              <span className={`absolute left-4 font-bold text-lg ${type === 'expense' ? 'text-rose-500' : 'text-emerald-500'}`}>đ</span>
              <Input
                type="text"
                value={amountStr}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setAmountStr(val ? formatNumber(parseInt(val, 10)) : '');
                }}
                className={`pl-10 text-xl font-extrabold bg-transparent border-0 focus-visible:ring-0 shadow-none py-3 ${type === 'expense' ? 'text-rose-700' : 'text-emerald-700'} placeholder-opacity-40`}
                placeholder="0"
                required
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-sky-950/60 uppercase tracking-widest pl-1">Mô tả</label>
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
              placeholder="VD: Mua cà phê sáng"
              className="bg-white/80 border-sky-200/60 focus:border-sky-400 focus:ring-sky-400/20 py-2.5 rounded-[12px]"
              required
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="flex items-center justify-between text-xs font-bold text-sky-950/60 uppercase tracking-widest pl-1 pr-1">
              <span>Danh mục</span>
              {isCategorizing && (
                <span className="flex items-center gap-1 text-[10px] text-sky-500 bg-sky-50 px-2 py-0.5 rounded-full normal-case tracking-normal">
                  <Sparkles className="w-3 h-3 animate-pulse" /> AI đang phân loại...
                </span>
              )}
            </label>
            <Input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="VD: Ăn uống"
              className={`bg-white/80 border-sky-200/60 focus:border-sky-400 focus:ring-sky-400/20 py-2.5 rounded-[12px] transition-all ${isCategorizing ? 'opacity-50' : 'opacity-100'}`}
              required
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-sky-950/60 uppercase tracking-widest pl-1">Ngày</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-white/80 border-sky-200/60 focus:border-sky-400 focus:ring-sky-400/20 py-2.5 rounded-[12px] text-sky-900 font-medium"
              required
            />
          </div>
          
          <Button
            type="submit"
            disabled={isSubmitting || isCategorizing}
            className={`w-full mt-4 h-12 rounded-[16px] text-[15px] font-bold shadow-[0_4px_16px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)] transition-all duration-300 flex items-center justify-center gap-2 ${type === 'expense' ? 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white' : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white'}`}
          >
            {isSubmitting ? (
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : <Send className="w-4 h-4" />}
            Lưu Giao Dịch
          </Button>
        </form>
      </div>
    </motion.div>
  );
}
