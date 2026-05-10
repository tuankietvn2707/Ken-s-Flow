import React, { useState } from 'react';
import { motion } from 'motion/react';
import { TransactionType, PaymentSource, Transaction } from '../types';
import { GoogleGenAI } from '@google/genai';
import { Plus, Minus } from 'lucide-react';
import { parseNumber, formatNumber } from './PersonalFinance';

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

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseNumber(amountStr);
    if (amount <= 0 || !description || !category) return;

    const newTx: Transaction = {
      id: Date.now().toString(),
      type,
      source,
      amount,
      description,
      category,
      date,
    };

    addTransaction(newTx);
    setAmountStr('');
    setDescription('');
    setCategory('');
  };

  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
      className="glass-panel border border-sky-300/30 text-sky-950 p-6 rounded-2xl lg:col-span-1"
    >
      <h2 className="text-xl font-semibold mb-6">Thêm Giao Dịch Mới</h2>
      <form onSubmit={handleAddTransaction} className="space-y-4">
        <div className="grid grid-cols-2 gap-2 p-1 bg-white/20 rounded-xl">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${type === 'expense' ? 'bg-white shadow-sm text-rose-600' : 'text-sky-900/60 hover:text-sky-900'}`}
          >
            <Minus className="w-4 h-4" /> Chi Tiêu
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${type === 'income' ? 'bg-white shadow-sm text-emerald-600' : 'text-sky-900/60 hover:text-sky-900'}`}
          >
            <Plus className="w-4 h-4" /> Thu Nhập
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className={`cursor-pointer py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-medium transition-all ${source === 'cash' ? 'bg-sky-50 border-sky-300 text-sky-700' : 'border-sky-300/30 text-sky-900/60 hover:border-sky-300/60'}`}>
            <input type="radio" value="cash" checked={source === 'cash'} onChange={() => setSource('cash')} className="sr-only" />
            Tiền mặt
          </label>
          <label className={`cursor-pointer py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-medium transition-all ${source === 'banking' ? 'bg-sky-50 border-sky-300 text-sky-700' : 'border-sky-300/30 text-sky-900/60 hover:border-sky-300/60'}`}>
            <input type="radio" value="banking" checked={source === 'banking'} onChange={() => setSource('banking')} className="sr-only" />
            Ngân hàng
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 opacity-80">Số tiền (VNĐ)</label>
          <input
            type="text"
            value={amountStr}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, '');
              setAmountStr(val ? formatNumber(parseInt(val, 10)) : '');
            }}
            className="w-full px-4 py-2 rounded-xl glass-panel/50 border border-sky-300/30 focus:ring-2 focus:ring-cyan-500 outline-none transition-all text-lg font-bold"
            placeholder="0"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 opacity-80">Mô tả</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescriptionBlur}
            className="w-full px-4 py-2 rounded-xl glass-panel/50 border border-sky-300/30 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
            placeholder="VD: Ăn trưa"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 opacity-80 flex items-center gap-2">
            Danh mục
            {isCategorizing && <span className="flex gap-1"><span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span><span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span><span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span></span>}
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2 rounded-xl glass-panel/50 border border-sky-300/30 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
            placeholder="VD: Ăn uống"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 opacity-80">Ngày</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2 rounded-xl glass-panel/50 border border-sky-300/30 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
        >
          Thêm Giao Dịch
        </button>
      </form>
    </motion.div>
  );
}
