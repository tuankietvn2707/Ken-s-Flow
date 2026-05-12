import React, { useState } from 'react';
import { motion } from 'motion/react';
import { TransactionType, PaymentSource, Transaction } from '../types';
import { GoogleGenAI } from '@google/genai';
import { Plus, Minus } from 'lucide-react';
import { parseNumber, formatNumber } from './PersonalFinance';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';

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
      initial={{ y: 20, opacity: 0 }} 
      animate={{ y: 0, opacity: 1 }} 
      transition={{ delay: 0.4 }}
      className="lg:col-span-1"
    >
      <Card>
        <CardHeader>
          <CardTitle>Thêm Giao Dịch Mới</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddTransaction} className="space-y-4">
            <div className="grid grid-cols-2 gap-2 p-1 bg-sky-50 rounded-xl">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setType('expense')}
                className={`py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${type === 'expense' ? 'bg-white shadow-sm text-rose-600 hover:text-rose-700 hover:bg-white' : 'text-sky-900/60 hover:text-sky-900'}`}
              >
                <Minus className="w-4 h-4 mr-2" /> Chi Tiêu
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setType('income')}
                className={`py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${type === 'income' ? 'bg-white shadow-sm text-emerald-600 hover:text-emerald-700 hover:bg-white' : 'text-sky-900/60 hover:text-sky-900'}`}
              >
                <Plus className="w-4 h-4 mr-2" /> Thu Nhập
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className={`cursor-pointer py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-medium transition-all ${source === 'cash' ? 'bg-sky-50 border-sky-300 text-sky-700' : 'border-sky-100 text-sky-900/60 hover:border-sky-300/60'}`}>
                <input type="radio" value="cash" checked={source === 'cash'} onChange={() => setSource('cash')} className="sr-only" />
                Tiền mặt
              </label>
              <label className={`cursor-pointer py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-medium transition-all ${source === 'banking' ? 'bg-sky-50 border-sky-300 text-sky-700' : 'border-sky-100 text-sky-900/60 hover:border-sky-300/60'}`}>
                <input type="radio" value="banking" checked={source === 'banking'} onChange={() => setSource('banking')} className="sr-only" />
                Ngân hàng
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-sky-900/80">Số tiền (VNĐ)</label>
              <Input
                type="text"
                value={amountStr}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setAmountStr(val ? formatNumber(parseInt(val, 10)) : '');
                }}
                className="text-lg font-bold"
                placeholder="0"
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-sky-900/80">Mô tả</label>
              <Input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescriptionBlur}
                placeholder="VD: Ăn trưa"
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-sky-900/80 flex items-center gap-2">
                Danh mục
                {isCategorizing && <span className="flex gap-1"><span className="w-1 h-1 bg-sky-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span><span className="w-1 h-1 bg-sky-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span><span className="w-1 h-1 bg-sky-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span></span>}
              </label>
              <Input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="VD: Ăn uống"
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-sky-900/80">Ngày</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            
            <Button
              type="submit"
              disabled={isSubmitting || isCategorizing}
              className="w-full mt-2"
              size="lg"
            >
              {isSubmitting && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              Thêm Giao Dịch
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
