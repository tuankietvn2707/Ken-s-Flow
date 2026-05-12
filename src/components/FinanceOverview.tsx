import React from 'react';
import { motion } from 'motion/react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Transaction } from '../types';
import { formatNumber } from './PersonalFinance';
import { Input } from './ui/Input';

const COLORS = ['#BAE1FF', '#BAFFC9', '#FFDFBA', '#FFFFBA', '#FFB3BA', '#E0BBE4', '#957DAD', '#D291BC', '#FEC8D8', '#FFDFD3'];

export function DashboardCard({ title, amount, color }: { title: string, amount: number, color: string }) {
  return (
    <div className="glass-panel border border-sky-300/30 text-sky-950 p-6 rounded-2xl flex flex-col justify-center items-start group hover:-translate-y-1 transition-transform">
      <h3 className="text-sm font-semibold opacity-70 mb-2">{title}</h3>
      <p className={`text-3xl font-bold tracking-tight ${color}`}>
        {formatNumber(amount)} <span className="text-lg font-normal opacity-60">đ</span>
      </p>
    </div>
  );
}

interface Props {
  transactions: Transaction[];
  initialBalance: { cash: number; banking: number };
  localCash: string;
  localBanking: string;
  setLocalCash: (s: string) => void;
  setLocalBanking: (s: string) => void;
  updateInitialBalance: (b: { cash: number; banking: number }) => void;
  totalIncome: number;
  totalExpense: number;
  currentCashBalance: number;
  currentBankingBalance: number;
  currentBalance: number;
}

export default function FinanceOverview({
  transactions, initialBalance, localCash, localBanking, setLocalCash, setLocalBanking, updateInitialBalance,
  totalIncome, totalExpense, currentCashBalance, currentBankingBalance, currentBalance
}: Props) {
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
    if (!acc[month]) acc[month] = { income: 0, expense: 0 };
    if (t.type === 'income') acc[month].income += t.amount;
    else acc[month].expense += t.amount;
    return acc;
  }, {} as Record<string, { income: number; expense: number }>);

  const barData = Object.keys(monthlyData).sort().map(month => ({
    name: month,
    income: monthlyData[month].income,
    expense: monthlyData[month].expense
  }));

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-800 to-cyan-600">Quản Lý Tài Chính</h1>
          <p className="text-sky-700/70 mt-1">Theo dõi chi tiêu và mục tiêu cá nhân</p>
        </div>
        <div className="flex flex-col items-end">
          <p className="text-sm font-medium mb-1 border-b border-sky-300/30 pb-1">Số dư đầu kỳ</p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-sky-50/50 px-3 py-1.5 rounded-xl border border-sky-100">
              <span className="text-sm opacity-70">Tiền mặt:</span>
              <Input 
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
                className="w-32 bg-transparent outline-none font-medium text-right border-0 focus-visible:ring-0 shadow-none h-auto py-1 px-2"
              />
              <span className="text-sm opacity-70">đ</span>
            </div>
            <div className="flex items-center gap-2 bg-sky-50/50 px-3 py-1.5 rounded-xl border border-sky-100">
              <span className="text-sm opacity-70">Ngân hàng:</span>
              <Input 
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
                className="w-32 bg-transparent outline-none font-medium text-right border-0 focus-visible:ring-0 shadow-none h-auto py-1 px-2"
              />
              <span className="text-sm opacity-70">đ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="space-y-6 mt-6">
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

      {/* Charts */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6"
      >
        <div className="glass-panel border border-sky-300/30 text-sky-950 p-6 rounded-2xl h-80 flex flex-col">
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

        <div className="glass-panel border border-sky-300/30 text-sky-950 p-6 rounded-2xl h-80 flex flex-col">
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
    </>
  );
}
