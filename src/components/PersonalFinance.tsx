import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Plus, Minus, Target, Download, Trash2, Edit2, Check, X, MessageCircle } from 'lucide-react';
import FinanceChatbot from './FinanceChatbot';
import { GoogleGenAI } from '@google/genai';

// Types
export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  category: string;
  date: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
}

const COLORS = ['#BAE1FF', '#BAFFC9', '#FFDFBA', '#FFFFBA', '#FFB3BA', '#E0BBE4', '#957DAD', '#D291BC', '#FEC8D8', '#FFDFD3'];

// Format number with commas
export const formatNumber = (num: number) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// Parse formatted number
export const parseNumber = (str: string) => {
  return parseInt(str.replace(/,/g, ''), 10) || 0;
};

export default function PersonalFinance() {
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('pf_transactions', []);
  const [goals, setGoals] = useLocalStorage<Goal[]>('pf_goals', []);
  const [initialBalance, setInitialBalance] = useLocalStorage<number>('pf_initial_balance', 0);

  // Form state
  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isCategorizing, setIsCategorizing] = useState(false);

  // Goal form state
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalTargetStr, setGoalTargetStr] = useState('');

  // Deposit form state
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositAmountStr, setDepositAmountStr] = useState('');

  // Calculate totals
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const currentBalance = initialBalance + totalIncome - totalExpense;

  // AI Categorization
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
      amount,
      description,
      category,
      date,
    };

    setTransactions([newTx, ...transactions]);
    setAmountStr('');
    setDescription('');
    setCategory('');
  };

  const handleDeleteTransaction = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa giao dịch này?')) {
      setTransactions(transactions.filter(t => t.id !== id));
    }
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseNumber(goalTargetStr);
    if (target <= 0 || !goalName) return;

    const newGoal: Goal = {
      id: Date.now().toString(),
      name: goalName,
      targetAmount: target,
      currentAmount: 0,
    };

    setGoals([...goals, newGoal]);
    setGoalName('');
    setGoalTargetStr('');
    setShowGoalForm(false);
  };

  const handleDeleteGoal = (id: string) => {
    if (window.confirm('Xóa mục tiêu này?')) {
      setGoals(goals.filter(g => g.id !== id));
    }
  };

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoalId) return;
    const amount = parseNumber(depositAmountStr);
    if (amount <= 0) return;

    const goal = goals.find(g => g.id === depositGoalId);
    if (!goal) return;

    // Update goal
    setGoals(goals.map(g => g.id === depositGoalId ? { ...g, currentAmount: g.currentAmount + amount } : g));

    // Add expense transaction
    const newTx: Transaction = {
      id: Date.now().toString(),
      type: 'expense',
      amount,
      description: `Nạp tiền vào mục tiêu: ${goal.name}`,
      category: 'Tiết kiệm',
      date: new Date().toISOString().split('T')[0],
    };
    setTransactions([newTx, ...transactions]);

    setDepositGoalId(null);
    setDepositAmountStr('');
  };

  const exportCSV = () => {
    const headers = ['Ngày', 'Loại', 'Số tiền', 'Danh mục', 'Mô tả'];
    const rows = transactions.map(t => [
      t.date,
      t.type === 'income' ? 'Thu' : 'Chi',
      t.amount,
      t.category,
      t.description
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

  // Chart Data
  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
  
  const pieData = Object.keys(expensesByCategory).map(key => ({
    name: key,
    value: expensesByCategory[key]
  }));

  const monthlyData = transactions.reduce((acc, t) => {
    const month = t.date.substring(0, 7); // YYYY-MM
    if (!acc[month]) acc[month] = { name: month, income: 0, expense: 0 };
    if (t.type === 'income') acc[month].income += t.amount;
    else acc[month].expense += t.amount;
    return acc;
  }, {} as Record<string, { name: string, income: number, expense: number }>);

  const barData = Object.values(monthlyData).sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name));

  // Group transactions by month
  const groupedTransactions = transactions.reduce((acc, t) => {
    const month = t.date.substring(0, 7);
    if (!acc[month]) acc[month] = [];
    acc[month].push(t);
    return acc;
  }, {} as Record<string, Transaction[]>);

  return (
    <div className="min-h-screen transition-colors duration-500 bg-[#f0f9ff] text-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-blue-500">
            Theo dõi Thu - Chi
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/50 px-3 py-1.5 rounded-xl border border-white/20">
              <span className="text-sm opacity-70">Số dư ban đầu:</span>
              <input 
                type="text"
                value={formatNumber(initialBalance)}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setInitialBalance(val ? parseInt(val, 10) : 0);
                }}
                className="w-24 bg-transparent outline-none font-medium text-right"
              />
              <span className="text-sm opacity-70">đ</span>
            </div>
          </div>
        </div>

        {/* 1. Dashboard Cards */}
        <motion.div 
          initial="hidden" animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <DashboardCard title="Tổng Số Dư" amount={currentBalance} color="text-blue-600" />
          <DashboardCard title="Tổng Thu" amount={totalIncome} color="text-emerald-600" />
          <DashboardCard title="Tổng Chi" amount={totalExpense} color="text-rose-600" />
        </motion.div>

        {/* 2. Charts */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="glass-card p-6 rounded-2xl h-80 flex flex-col">
            <h2 className="text-lg font-semibold mb-4">Cơ Cấu Chi Tiêu</h2>
            <div className="flex-1 min-h-0">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatNumber(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center opacity-50 text-sm">Chưa có dữ liệu chi tiêu</div>
              )}
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl h-80 flex flex-col">
            <h2 className="text-lg font-semibold mb-4">Thu / Chi Theo Tháng</h2>
            <div className="flex-1 min-h-0">
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} dy={10} />
                    <YAxis 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fill: '#64748b' }} 
                      tickFormatter={(value) => value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value} 
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${formatNumber(value)} đ`, undefined]} 
                      cursor={{fill: '#f1f5f9'}}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="income" name="Thu nhập" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="expense" name="Chi tiêu" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center opacity-50 text-sm">Chưa có dữ liệu</div>
              )}
            </div>
          </div>
        </motion.div>

        {/* 3. Financial Goals */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
          className="glass-card p-6 rounded-2xl"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Mục Tiêu Tiết Kiệm</h2>
            <button onClick={() => setShowGoalForm(!showGoalForm)} className="p-1.5 bg-cyan-100 text-cyan-600 rounded-lg hover:bg-cyan-200 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <AnimatePresence>
            {showGoalForm && (
              <motion.form 
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                onSubmit={handleAddGoal} className="mb-4 space-y-3 overflow-hidden"
              >
                <input
                  type="text" placeholder="Tên mục tiêu" value={goalName} onChange={e => setGoalName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-white/50 border border-slate-200 outline-none" required
                />
                <input
                  type="text" placeholder="Số tiền cần đạt" value={goalTargetStr}
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setGoalTargetStr(val ? formatNumber(parseInt(val, 10)) : '');
                  }}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-white/50 border border-slate-200 outline-none" required
                />
                <button type="submit" className="w-full py-2 text-sm bg-cyan-500 text-white rounded-lg">Thêm</button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map(goal => {
              const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
              const isDepositing = depositGoalId === goal.id;
              return (
                <div key={goal.id} className="p-4 bg-white/40 rounded-xl border border-white/20 relative group">
                  <button onClick={() => handleDeleteGoal(goal.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-rose-500 transition-opacity">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-4">
                    {/* SVG Circle Progress */}
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-200" />
                        <motion.path 
                          initial={{ strokeDasharray: "0, 100" }}
                          animate={{ strokeDasharray: `${percent}, 100` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="url(#gradient)" strokeWidth="3" strokeDasharray={`${percent}, 100`} 
                        />
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#06b6d4" />
                            <stop offset="100%" stopColor="#3b82f6" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">{percent}%</div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{goal.name}</h3>
                      <p className="text-xs opacity-70 mt-1">{formatNumber(goal.currentAmount)} / {formatNumber(goal.targetAmount)}</p>
                      <button 
                        onClick={() => setDepositGoalId(isDepositing ? null : goal.id)}
                        className="mt-2 text-xs text-cyan-600 font-medium hover:underline"
                      >
                        Nạp tiền
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isDepositing && (
                      <motion.form 
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        onSubmit={handleDeposit} className="mt-3 flex gap-2 overflow-hidden"
                      >
                        <input
                          type="text" placeholder="Số tiền" value={depositAmountStr}
                          onChange={e => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setDepositAmountStr(val ? formatNumber(parseInt(val, 10)) : '');
                          }}
                          className="flex-1 px-2 py-1 text-sm rounded bg-white/50 border border-slate-200 outline-none" required
                        />
                        <button type="submit" className="px-3 py-1 bg-cyan-500 text-white text-sm rounded">Nạp</button>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
            {goals.length === 0 && <p className="text-sm opacity-60 col-span-full py-4">Chưa có mục tiêu nào.</p>}
          </div>
        </motion.div>

        {/* 4. Add Transaction & Transaction History */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Transaction Form */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
            className="glass-card p-6 rounded-2xl lg:col-span-1 h-fit"
          >
            <h2 className="text-xl font-semibold mb-4">Thêm Giao Dịch</h2>
            
            {/* Toggle Type */}
            <div className="flex p-1 bg-slate-200/50 rounded-xl mb-6 relative">
              <div 
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-all duration-300 ease-out ${type === 'income' ? 'left-1' : 'left-[calc(50%+2px)]'}`}
              />
              <button
                type="button"
                onClick={() => setType('income')}
                className={`flex-1 py-2 text-sm font-medium z-10 transition-colors ${type === 'income' ? 'text-emerald-600' : 'text-slate-500'}`}
              >
                Thu Nhập
              </button>
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`flex-1 py-2 text-sm font-medium z-10 transition-colors ${type === 'expense' ? 'text-rose-600' : 'text-slate-500'}`}
              >
                Chi Tiêu
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 opacity-80">Số tiền</label>
                <input
                  type="text"
                  value={amountStr}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setAmountStr(val ? formatNumber(parseInt(val, 10)) : '');
                  }}
                  className="w-full px-4 py-2 rounded-xl bg-white/50 border border-slate-200 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
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
                  className="w-full px-4 py-2 rounded-xl bg-white/50 border border-slate-200 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
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
                  className="w-full px-4 py-2 rounded-xl bg-white/50 border border-slate-200 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
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
                  className="w-full px-4 py-2 rounded-xl bg-white/50 border border-slate-200 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
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

          {/* Transaction History */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
            className="glass-card p-6 rounded-2xl lg:col-span-2"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Lịch Sử Giao Dịch</h2>
              <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors">
                <Download className="w-4 h-4" /> Xuất CSV
              </button>
            </div>

            <div className="space-y-6">
              {Object.keys(groupedTransactions).sort().reverse().map(month => (
                <div key={month}>
                  <h3 className="text-sm font-bold opacity-60 mb-3 border-b border-slate-200 pb-1">{month}</h3>
                  <div className="space-y-3">
                    {groupedTransactions[month].map(t => (
                      <div key={t.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/50 transition-colors group">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                            {t.type === 'income' ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="font-medium">{t.description}</p>
                            <p className="text-xs opacity-60">{t.category} • {t.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {t.type === 'income' ? '+' : '-'}{formatNumber(t.amount)}
                          </span>
                          <button onClick={() => handleDeleteTransaction(t.id)} className="opacity-0 group-hover:opacity-100 text-rose-500 p-1 hover:bg-rose-100 rounded transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {transactions.length === 0 && <p className="text-center opacity-50 py-8">Chưa có giao dịch nào.</p>}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Chatbot FAB */}
      <FinanceChatbot transactions={transactions} goals={goals} setTransactions={setTransactions} />

      <style>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
        }
      `}</style>
    </div>
  );
}

// Number Counter Component
function DashboardCard({ title, amount, color }: { title: string, amount: number, color: string }) {
  const [displayAmount, setDisplayAmount] = useState(0);

  useEffect(() => {
    const duration = 300; // 0.3s
    const steps = 20;
    const stepTime = duration / steps;
    const diff = amount - displayAmount;
    
    if (diff === 0) return;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      setDisplayAmount(prev => {
        const next = prev + (diff / steps);
        return currentStep >= steps ? amount : next;
      });
      if (currentStep >= steps) clearInterval(interval);
    }, stepTime);

    return () => clearInterval(interval);
  }, [amount]);

  return (
    <motion.div variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }} className="glass-card p-6 rounded-2xl relative overflow-hidden">
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br from-white/40 to-transparent rounded-full blur-xl"></div>
      <h3 className="text-sm font-medium opacity-70 mb-2">{title}</h3>
      <p className={`text-3xl font-bold ${color}`}>
        {formatNumber(Math.round(displayAmount))} <span className="text-lg opacity-70">đ</span>
      </p>
    </motion.div>
  );
}
