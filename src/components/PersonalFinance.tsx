import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Plus, Minus, Target, Download, Trash2, Edit2, Check, X, MessageCircle, Archive, History, Calendar, ChevronRight } from 'lucide-react';
import FinanceChatbot from './FinanceChatbot';
import { GoogleGenAI } from '@google/genai';
import { Transaction, Goal, TransactionType, PaymentSource, FinanceHistoryRecord } from '../types';

const COLORS = ['#BAE1FF', '#BAFFC9', '#FFDFBA', '#FFFFBA', '#FFB3BA', '#E0BBE4', '#957DAD', '#D291BC', '#FEC8D8', '#FFDFD3'];

// Format number with commas
export const formatNumber = (num: number | undefined | null) => {
  if (num === undefined || num === null || isNaN(Number(num))) return "0";
  return Number(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// Parse formatted number
export const parseNumber = (str: string) => {
  return parseInt(str.replace(/,/g, ''), 10) || 0;
};

export interface PersonalFinanceProps {
  transactions: Transaction[];
  financeHistory: FinanceHistoryRecord[];
  goals: Goal[];
  initialBalance: { cash: number; banking: number };
  addTransaction: (tx: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addGoal: (goal: Goal) => Promise<void>;
  updateGoal: (goal: Goal) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  updateInitialBalance: (balance: { cash: number; banking: number }) => Promise<void>;
  consolidateAndResetBalance: (newBalances: { cash: number; banking: number }) => Promise<void>;
}

export default function PersonalFinance({
  transactions,
  financeHistory,
  goals,
  initialBalance,
  addTransaction,
  deleteTransaction,
  addGoal,
  updateGoal,
  deleteGoal,
  updateInitialBalance,
  consolidateAndResetBalance
}: PersonalFinanceProps) {
  // Form state
  const [type, setType] = useState<TransactionType>('expense');
  const [source, setSource] = useState<PaymentSource>('cash');
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

  // Consolidate Modal State
  const [showConsolidateModal, setShowConsolidateModal] = useState(false);
  const [consolidateCashStr, setConsolidateCashStr] = useState('');
  const [consolidateBankingStr, setConsolidateBankingStr] = useState('');

  // History Detail Modal State
  const [selectedHistoryRecord, setSelectedHistoryRecord] = useState<FinanceHistoryRecord | null>(null);

  // Chatbot state
  const [showChatbot, setShowChatbot] = useState(false);

  // Local state for initial balance inputs to prevent lag
  const [localCash, setLocalCash] = useState((initialBalance?.cash || 0).toString());
  const [localBanking, setLocalBanking] = useState((initialBalance?.banking || 0).toString());

  useEffect(() => {
    setLocalCash((initialBalance?.cash || 0).toString());
    setLocalBanking((initialBalance?.banking || 0).toString());
  }, [initialBalance]);

  // Calculate totals
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
  
  const cashIncome = transactions.filter(t => t.type === 'income' && t.source === 'cash').reduce((sum, t) => sum + (t.amount || 0), 0);
  const cashExpense = transactions.filter(t => t.type === 'expense' && t.source === 'cash').reduce((sum, t) => sum + (t.amount || 0), 0);
  const currentCashBalance = (initialBalance.cash || 0) + cashIncome - cashExpense;

  const bankingIncome = transactions.filter(t => t.type === 'income' && t.source === 'banking').reduce((sum, t) => sum + (t.amount || 0), 0);
  const bankingExpense = transactions.filter(t => t.type === 'expense' && t.source === 'banking').reduce((sum, t) => sum + (t.amount || 0), 0);
  const currentBankingBalance = (initialBalance.banking || 0) + bankingIncome - bankingExpense;
  
  const currentBalance = currentCashBalance + currentBankingBalance;

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

  const handleDeleteTransaction = (id: string) => {
    deleteTransaction(id);
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

    addGoal(newGoal);
    setGoalName('');
    setGoalTargetStr('');
    setShowGoalForm(false);
  };

  const handleConsolidate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cash = parseNumber(consolidateCashStr);
    const banking = parseNumber(consolidateBankingStr);
    if (cash < 0 || banking < 0) return;
    await consolidateAndResetBalance({ cash, banking });
    setShowConsolidateModal(false);
  };

  const handleDeleteGoal = (id: string) => {
    deleteGoal(id);
  };

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoalId) return;
    const amount = parseNumber(depositAmountStr);
    if (amount <= 0) return;

    const goal = goals.find(g => g.id === depositGoalId);
    if (!goal) return;

    // Update goal
    const updatedGoal = { ...goal, currentAmount: goal.currentAmount + amount };
    updateGoal(updatedGoal);

    // Add expense transaction
    const newTx: Transaction = {
      id: Date.now().toString(),
      type: 'expense',
      source: 'banking', // Default to banking for deposit
      amount,
      description: `Nạp tiền vào mục tiêu: ${goal.name}`,
      category: 'Tiết kiệm',
      date: new Date().toISOString().split('T')[0],
    };
    addTransaction(newTx);

    setDepositGoalId(null);
    setDepositAmountStr('');
  };

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

  // Chart Data
  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const cat = t.category || 'Khác';
      acc[cat] = (acc[cat] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
  
  const pieData = Object.keys(expensesByCategory).map(key => ({
    name: key,
    value: expensesByCategory[key]
  }));

  const monthlyData = transactions.reduce((acc, t) => {
    const dateStr = t.date || new Date().toISOString().split('T')[0];
    const month = dateStr.substring(0, 7); // YYYY-MM
    if (!acc[month]) acc[month] = { name: month, income: 0, expense: 0 };
    if (t.type === 'income') acc[month].income += t.amount;
    else acc[month].expense += t.amount;
    return acc;
  }, {} as Record<string, { name: string, income: number, expense: number }>);

  const barData = Object.values(monthlyData).sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name));

  // Group transactions by month
  const sortedTransactions = [...transactions].sort((a, b) => {
    // Primary sort by date descending
    const dateA = a.date || '';
    const dateB = b.date || '';
    if (dateA !== dateB) return dateB.localeCompare(dateA);
    // Secondary sort by ID (timestamp) descending
    return b.id.localeCompare(a.id);
  });

  const groupedTransactions = sortedTransactions.reduce((acc, t) => {
    const dateStr = t.date || new Date().toISOString().split('T')[0];
    const month = dateStr.substring(0, 7);
    if (!acc[month]) acc[month] = [];
    acc[month].push(t);
    return acc;
  }, {} as Record<string, Transaction[]>);

  const groupedHistory = financeHistory.reduce((acc, r) => {
    const date = new Date(r.timestamp);
    if (isNaN(date.getTime())) return acc;
    const dateStr = date.toISOString().split('T')[0];
    const month = dateStr.substring(0, 7);
    if (!acc[month]) acc[month] = [];
    acc[month].push(r);
    return acc;
  }, {} as Record<string, FinanceHistoryRecord[]>);

  return (
    <div className="min-h-screen transition-colors duration-500 bg-[#f0f9ff] text-sky-900">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-blue-500">
            Theo dõi Thu - Chi
          </h1>
          <div className="flex items-center gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 glass-panel/50 px-3 py-1.5 rounded-xl border border-white/20">
              <span className="text-sm opacity-70">Tiền mặt:</span>
              <input 
                type="text"
                value={localCash === '' ? '' : formatNumber(Number(localCash) || 0)}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setLocalCash(val);
                }}
                onBlur={() => {
                  const val = parseInt(localCash, 10) || 0;
                  updateInitialBalance({ ...initialBalance, cash: val });
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = parseInt(localCash, 10) || 0;
                    updateInitialBalance({ ...initialBalance, cash: val });
                    e.currentTarget.blur();
                  }
                }}
                className="w-24 bg-transparent outline-none font-medium text-right"
              />
              <span className="text-sm opacity-70">đ</span>
            </div>
            <div className="flex items-center gap-2 glass-panel/50 px-3 py-1.5 rounded-xl border border-white/20">
              <span className="text-sm opacity-70">Ngân hàng:</span>
              <input 
                type="text"
                value={localBanking === '' ? '' : formatNumber(Number(localBanking) || 0)}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setLocalBanking(val);
                }}
                onBlur={() => {
                  const val = parseInt(localBanking, 10) || 0;
                  updateInitialBalance({ ...initialBalance, banking: val });
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = parseInt(localBanking, 10) || 0;
                    updateInitialBalance({ ...initialBalance, banking: val });
                    e.currentTarget.blur();
                  }
                }}
                className="w-24 bg-transparent outline-none font-medium text-right"
              />
              <span className="text-sm opacity-70">đ</span>
            </div>
          </div>
          </div>
        </div>

        {/* 1. Dashboard Cards */}
        <div className="space-y-6">
          <motion.div 
            initial="hidden" animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
            }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <DashboardCard title="Tổng Số Dư" amount={currentBalance} color="text-sky-600" />
            <DashboardCard title="Tiền Mặt" amount={currentCashBalance} color="text-emerald-600" />
            <DashboardCard title="Ngân Hàng" amount={currentBankingBalance} color="text-blue-600" />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto"
          >
            <DashboardCard title="Thu Nhập" amount={totalIncome} color="text-emerald-600" />
            <DashboardCard title="Chi Tiêu" amount={totalExpense} color="text-rose-600" />
          </motion.div>
        </div>

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
            <button onClick={() => setShowGoalForm(!showGoalForm)} className="p-1.5 bg-cyan-100 text-cyan-600 rounded-xl hover:bg-cyan-200 transition-colors">
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
                  className="w-full px-3 py-2 text-sm rounded-xl glass-panel/50 border border-sky-300/40 outline-none" required
                />
                <input
                  type="text" placeholder="Số tiền cần đạt" value={goalTargetStr}
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setGoalTargetStr(val ? formatNumber(parseInt(val, 10)) : '');
                  }}
                  className="w-full px-3 py-2 text-sm rounded-xl glass-panel/50 border border-sky-300/40 outline-none" required
                />
                <button type="submit" className="w-full py-2 text-sm bg-cyan-500 text-white rounded-xl">Thêm</button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map(goal => {
              const percent = goal.targetAmount ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0;
              const isDepositing = depositGoalId === goal.id;
              return (
                <div key={goal.id} className="p-4 glass-panel/40 rounded-xl border border-white/20 relative group">
                  <button onClick={() => handleDeleteGoal(goal.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-rose-500 transition-opacity">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-4">
                    {/* SVG Circle Progress */}
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" className="text-sky-300/50" />
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
                          className="flex-1 px-2 py-1 text-sm rounded glass-panel/50 border border-sky-300/40 outline-none" required
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
            <div className="flex p-1 bg-sky-200/50 rounded-xl mb-4 relative">
              <div 
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-sm transition-all duration-300 ease-out ${type === 'income' ? 'left-1' : 'left-[calc(50%+2px)]'}`}
              />
              <button
                type="button"
                onClick={() => setType('income')}
                className={`flex-1 py-2 text-sm font-medium z-10 transition-colors ${type === 'income' ? 'text-emerald-600' : 'text-sky-700/80'}`}
              >
                Thu Nhập
              </button>
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`flex-1 py-2 text-sm font-medium z-10 transition-colors ${type === 'expense' ? 'text-rose-600' : 'text-sky-700/80'}`}
              >
                Chi Tiêu
              </button>
            </div>

            {/* Toggle Source */}
            <div className="flex p-1 bg-sky-200/50 rounded-xl mb-6 relative">
              <div 
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-sm transition-all duration-300 ease-out ${source === 'cash' ? 'left-1' : 'left-[calc(50%+2px)]'}`}
              />
              <button
                type="button"
                onClick={() => setSource('cash')}
                className={`flex-1 py-2 text-sm font-medium z-10 transition-colors ${source === 'cash' ? 'text-sky-900' : 'text-sky-700/80'}`}
              >
                Tiền mặt
              </button>
              <button
                type="button"
                onClick={() => setSource('banking')}
                className={`flex-1 py-2 text-sm font-medium z-10 transition-colors ${source === 'banking' ? 'text-sky-900' : 'text-sky-700/80'}`}
              >
                Ngân hàng
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
                  className="w-full px-4 py-2 rounded-xl glass-panel/50 border border-sky-300/40 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
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
                  className="w-full px-4 py-2 rounded-xl glass-panel/50 border border-sky-300/40 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
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
                  className="w-full px-4 py-2 rounded-xl glass-panel/50 border border-sky-300/40 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
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
                  className="w-full px-4 py-2 rounded-xl glass-panel/50 border border-sky-300/40 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
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
                <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-1.5 bg-sky-100/50 rounded-xl text-sm font-medium hover:bg-sky-200 transition-colors">
                  <Download className="w-4 h-4" /> Xuất CSV
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {Object.keys(groupedTransactions).sort().reverse().map(month => (
                <div key={month}>
                  <h3 className="text-sm font-bold opacity-60 mb-3 border-b border-sky-300/40 pb-1">{month}</h3>
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
                          <button onClick={() => handleDeleteTransaction(t.id)} className="opacity-0 group-hover:opacity-100 text-rose-500 p-1 hover:bg-rose-100 rounded transition-all">
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
        </div>

        {/* Consolidate History Section */}
        {financeHistory.length > 0 && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}
            className="glass-card p-6 rounded-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Lịch Sử Giao Dịch Đã Gộp</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.keys(groupedHistory).sort().reverse().map(month => (
                <div key={month} className="space-y-3">
                  <h3 className="text-sm font-bold opacity-60 border-b border-sky-300/40 pb-1">{month}</h3>
                  {groupedHistory[month].map(record => {
                    const date = new Date(record.timestamp);
                    const income = record.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
                    const expense = record.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
                    return (
                      <div 
                        key={record.id} 
                        onClick={() => setSelectedHistoryRecord(record)}
                        className="p-4 bg-white/40 rounded-xl border border-white/20 hover:bg-white/60 cursor-pointer transition-all group flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium flex items-center gap-2">Chốt sổ <span className="text-xs font-normal opacity-70 bg-sky-200 px-2 py-0.5 rounded">{date.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</span></p>
                          <p className="text-xs opacity-70 mt-1">{date.toLocaleDateString('vi-VN')}</p>
                          <div className="mt-2 flex gap-3 text-xs">
                            <span className="text-emerald-600">+{formatNumber(income)}</span>
                            <span className="text-rose-600">-{formatNumber(expense)}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-sky-600/50 group-hover:text-cyan-600 transform group-hover:translate-x-1 transition-all" />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Consolidate Modal */}
      <AnimatePresence>
        {showConsolidateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-sky-950/40 backdrop-blur-sm"
              onClick={() => setShowConsolidateModal(false)}
            />
            <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 10 }} 
               animate={{ opacity: 1, scale: 1, y: 0 }} 
               exit={{ opacity: 0, scale: 0.95, y: 10 }}
               className="glass-panel rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative z-10"
            >
              <div className="flex items-center justify-between p-4 border-b border-sky-300/30">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Archive className="w-5 h-5 text-cyan-600" />
                  Gộp Lịch Sử & Chốt Sổ
                </h3>
                <button onClick={() => setShowConsolidateModal(false)} className="p-1 hover:bg-sky-100/50 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-sky-700/80" />
                </button>
              </div>
              <form onSubmit={handleConsolidate} className="p-6 space-y-4">
                <p className="text-sm text-sky-700/80">
                  Thao tác này sẽ lưu lại toàn bộ giao dịch hiện tại thành 1 bản ghi lịch sử, làm trống danh sách giao dịch, và cập nhật số dư thực tế mới nhất.
                </p>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1 opacity-80">Số Dư Tiền Mặt Thực Tế</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formatNumber(parseNumber(consolidateCashStr))}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setConsolidateCashStr(val);
                        }}
                        className="w-full px-4 py-2 pr-8 rounded-xl bg-sky-50/40 border border-sky-300/40 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                        required
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm opacity-50">đ</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 opacity-80">Số Dư Ngân Hàng Thực Tế</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formatNumber(parseNumber(consolidateBankingStr))}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setConsolidateBankingStr(val);
                        }}
                        className="w-full px-4 py-2 pr-8 rounded-xl bg-sky-50/40 border border-sky-300/40 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                        required
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm opacity-50">đ</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                   <button
                    type="button"
                    onClick={() => setShowConsolidateModal(false)}
                    className="flex-1 py-2 rounded-xl bg-sky-100/50 text-sky-900 font-medium hover:bg-sky-200 transition-all text-sm"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium shadow-md hover:shadow-lg transition-all text-sm"
                  >
                    Chốt Các Lần Giao Dịch
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* History Detail Modal */}
      <AnimatePresence>
        {selectedHistoryRecord && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
             <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-sky-950/60 backdrop-blur-sm"
              onClick={() => setSelectedHistoryRecord(null)}
            />
            <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 10 }} 
               animate={{ opacity: 1, scale: 1, y: 0 }} 
               exit={{ opacity: 0, scale: 0.95, y: 10 }}
               className="bg-[#f8fafc] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col relative z-10"
            >
              <div className="flex items-center justify-between p-5 border-b border-sky-300/40 glass-panel rounded-t-2xl">
                <div>
                  <h3 className="font-bold text-xl flex items-center gap-2">
                    <History className="w-5 h-5 text-cyan-600" />
                    Chi Tiết Lần Chốt Sổ
                  </h3>
                  <p className="text-sm opacity-60 mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> 
                    {new Date(selectedHistoryRecord.timestamp).toLocaleString('vi-VN')}
                  </p>
                </div>
                <button onClick={() => setSelectedHistoryRecord(null)} className="p-2 hover:bg-sky-100/50 rounded-full transition-colors bg-sky-50/40">
                  <X className="w-5 h-5 text-sky-700/80" />
                </button>
              </div>

              <div className="overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-panel p-4 rounded-xl border border-sky-300/30 shadow-sm">
                    <p className="text-sm opacity-60 font-medium">Số Dư Tiền Mặt (Cũ)</p>
                    <p className="text-xl font-bold mt-1 text-emerald-600">{formatNumber(selectedHistoryRecord.initialBalances.cash)} đ</p>
                  </div>
                  <div className="glass-panel p-4 rounded-xl border border-sky-300/30 shadow-sm">
                    <p className="text-sm opacity-60 font-medium">Số Dư Ngân Hàng (Cũ)</p>
                    <p className="text-xl font-bold mt-1 text-blue-600">{formatNumber(selectedHistoryRecord.initialBalances.banking)} đ</p>
                  </div>
                </div>

                <div>
                   <h4 className="font-semibold text-sky-900 mb-3 ml-1 flex items-center gap-2">
                     Giao Dịch Ghi Nhận ({selectedHistoryRecord.transactions.length})
                   </h4>
                   <div className="glass-panel rounded-xl border border-sky-300/30 shadow-sm divide-y divide-sky-300/30">
                     {selectedHistoryRecord.transactions.map(t => (
                        <div key={t.id} className="flex items-center justify-between p-4 hover:bg-sky-50/40 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                              {t.type === 'income' ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="font-medium">{t.description}</p>
                              <p className="text-xs opacity-60">
                                {t.category || 'Khác'} • {t.source === 'cash' ? 'Tiền mặt' : 'Ngân hàng'} • {t.date || 'Không rõ'}
                              </p>
                            </div>
                          </div>
                          <span className={`font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {t.type === 'income' ? '+' : '-'}{formatNumber(t.amount)}
                          </span>
                        </div>
                     ))}
                     {selectedHistoryRecord.transactions.length === 0 && (
                       <p className="text-center opacity-50 text-sm py-6">Không có giao dịch nào.</p>
                     )}
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Chatbot FAB */}
      <FinanceChatbot transactions={transactions} goals={goals} addTransaction={addTransaction} />

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
    const safeAmount = Number(amount) || 0;
    const diff = safeAmount - displayAmount;
    
    if (diff === 0) return;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      setDisplayAmount(prev => {
        const next = prev + (diff / steps);
        return currentStep >= steps ? safeAmount : next;
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
