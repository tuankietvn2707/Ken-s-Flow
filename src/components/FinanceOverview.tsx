import React from 'react';
import { motion } from 'motion/react';
import { PieChart as RePieChart, Pie, Cell, BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Transaction } from '../types';
import { formatNumber } from './PersonalFinance';
import { Input } from './ui/Input';
import { Wallet, Banknote, Briefcase, TrendingUp, TrendingDown, LayoutList, Activity, ArrowUpRight, ArrowDownRight, PieChart as PieChartIcon, BarChart3 as BarChartIcon } from 'lucide-react';

const COLORS = ['#38bdf8', '#34d399', '#fbbf24', '#f472b6', '#a78bfa', '#60a5fa', '#818cf8', '#f87171', '#fb923c', '#2dd4bf'];

export function DashboardCard({ title, amount, mainColor, accentColor, icon: Icon, glowColor, trend, trendValue }: { title: string, amount: number, mainColor: string, accentColor: string, icon: any, glowColor: string, trend?: 'up'|'down', trendValue?: string }) {
  return (
    <div className="bg-white/60 backdrop-blur-md border border-white shadow-[0_8px_32px_rgba(0,0,0,0.04)] p-8 rounded-[32px] flex flex-col justify-center items-start group hover:-translate-y-1.5 hover:shadow-[0_16px_48px_rgba(0,0,0,0.08)] transition-all duration-500 relative overflow-hidden">
      {/* Subtle glow effect */}
      <div className={`absolute -right-12 -top-12 w-40 h-40 rounded-full blur-[50px] opacity-20 bg-current ${glowColor} transition-opacity duration-500 group-hover:opacity-30`} />
      
      <div className="flex justify-between items-start w-full mb-6">
        <div className={`p-3 rounded-2xl ${accentColor} border shadow-sm backdrop-blur-md`}>
          <Icon className={`w-6 h-6 ${mainColor}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${trend === 'up' ? 'text-emerald-700 bg-emerald-50 border border-emerald-100/50' : 'text-rose-700 bg-rose-50 border border-rose-100/50'}`}>
            {trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {trendValue}
          </div>
        )}
      </div>

      <h3 className="text-[12px] font-bold uppercase tracking-widest mb-2 text-sky-950/60 transition-colors group-hover:text-sky-950/80">
        {title}
      </h3>
      <p className={`text-4xl font-extrabold tracking-tight ${mainColor} drop-shadow-sm`}>
        {formatNumber(amount)} <span className="text-xl font-bold opacity-60">đ</span>
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
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8"
      >
        <div className="flex flex-col gap-1.5 items-start">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 animate-gradient-x tracking-tight drop-shadow-sm pb-1">Quản Lý Tài Chính</h1>
          <p className="text-sky-700/80 font-medium text-lg">Theo dõi dòng tiền và mục tiêu cá nhân</p>
        </div>
        <div className="flex flex-col items-start md:items-end w-full md:w-auto">
          <p className="text-[11px] font-bold text-sky-600/80 uppercase tracking-widest mb-3 border-b border-sky-200/50 pb-1.5 w-full md:w-auto text-left md:text-right">Số dư đầu kỳ</p>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
            <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md px-5 py-2.5 rounded-[20px] border border-white shadow-[0_4px_16px_rgba(14,165,233,0.04)] focus-within:ring-2 focus-within:ring-sky-200 focus-within:shadow-[0_8px_24px_rgba(14,165,233,0.08)] transition-all duration-300 w-full sm:w-auto">
              <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <Banknote className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-sky-900/70 whitespace-nowrap hidden sm:block">Tiền mặt</span>
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
                className="w-full sm:w-28 bg-transparent outline-none font-bold text-sky-950 text-right border-0 focus-visible:ring-0 shadow-none h-auto py-1 px-1 text-base placeholder-sky-900/30"
                placeholder="0"
              />
              <span className="text-sm font-bold text-sky-950/60">đ</span>
            </div>
            
            <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md px-5 py-2.5 rounded-[20px] border border-white shadow-[0_4px_16px_rgba(14,165,233,0.04)] focus-within:ring-2 focus-within:ring-sky-200 focus-within:shadow-[0_8px_24px_rgba(14,165,233,0.08)] transition-all duration-300 w-full sm:w-auto">
              <div className="p-1.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <Briefcase className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-sky-900/70 whitespace-nowrap hidden sm:block">Ngân hàng</span>
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
                className="w-full sm:w-28 bg-transparent outline-none font-bold text-sky-950 text-right border-0 focus-visible:ring-0 shadow-none h-auto py-1 px-1 text-base placeholder-sky-900/30"
                placeholder="0"
              />
              <span className="text-sm font-bold text-sky-950/60">đ</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Dashboard Cards */}
      <div className="space-y-6">
        <motion.div 
          initial="hidden" animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } } }}>
            <DashboardCard title="Tổng Số Dư" amount={currentBalance} mainColor="text-sky-600" accentColor="bg-sky-50 border-sky-100" glowColor="text-sky-500" icon={Wallet} />
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } } }}>
            <DashboardCard title="Tiền Mặt" amount={currentCashBalance} mainColor="text-emerald-600" accentColor="bg-emerald-50 border-emerald-100" glowColor="text-emerald-500" icon={Banknote} />
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } } }}>
            <DashboardCard title="Ngân Hàng" amount={currentBankingBalance} mainColor="text-blue-600" accentColor="bg-blue-50 border-blue-100" glowColor="text-blue-500" icon={Briefcase} />
          </motion.div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <DashboardCard title="Tổng Thu Nhập" amount={totalIncome} mainColor="text-emerald-600" accentColor="bg-emerald-50 border-emerald-100" glowColor="text-emerald-500" icon={TrendingUp} trend="up" />
          <DashboardCard title="Tổng Chi Tiêu" amount={totalExpense} mainColor="text-rose-600" accentColor="bg-rose-50 border-rose-100" glowColor="text-rose-500" icon={TrendingDown} trend="down" />
        </motion.div>
      </div>

      {/* Charts */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8"
      >
        <div className="bg-white/60 backdrop-blur-md border border-white shadow-[0_8px_32px_rgba(0,0,0,0.04)] p-8 rounded-[32px] h-[400px] flex flex-col group hover:shadow-[0_16px_48px_rgba(0,0,0,0.08)] transition-all duration-500">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 shadow-sm">
              <LayoutList className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-sky-950 tracking-tight">Cơ Cấu Chi Tiêu</h2>
          </div>
          <div className="flex-1 w-full min-h-0 relative">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none" isAnimationActive={false}>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${formatNumber(value)} đ`, undefined]} 
                    contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', fontWeight: 600, color: '#0c4a6e' }}
                    itemStyle={{ color: '#0ea5e9' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: 600, color: '#0c4a6e' }} />
                </RePieChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-60">
                <div className="w-16 h-16 bg-gradient-to-tr from-sky-100 to-sky-50 rotate-12 rounded-2xl flex items-center justify-center mb-4 border border-white shadow-sm">
                  <PieChartIcon className="w-8 h-8 text-sky-300" />
                </div>
                <p className="text-sm font-semibold text-sky-800">Chưa có giao dịch chi tiêu</p>
                <p className="text-xs font-medium text-sky-600/70 mt-1">Dữ liệu sẽ hiển thị tại đây</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-md border border-white shadow-[0_8px_32px_rgba(0,0,0,0.04)] p-8 rounded-[32px] h-[400px] flex flex-col group hover:shadow-[0_16px_48px_rgba(0,0,0,0.08)] transition-all duration-500">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 shadow-sm">
              <Activity className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-sky-950 tracking-tight">Thu / Chi Theo Tháng</h2>
          </div>
          <div className="flex-1 w-full min-h-0 relative">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" fontSize={12} fontWeight={600} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} dy={10} />
                  <YAxis 
                    fontSize={12} 
                    fontWeight={600}
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: '#64748b' }} 
                    tickFormatter={(value) => value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value} 
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${formatNumber(value)} đ`, undefined]} 
                    cursor={{fill: 'rgba(241, 245, 249, 0.5)', radius: 8}}
                    contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', fontWeight: 600, color: '#0c4a6e' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '10px', fontWeight: 600, color: '#0c4a6e' }} />
                  <Bar dataKey="income" name="Thu nhập" fill="#34d399" radius={[8, 8, 8, 8]} isAnimationActive={false} />
                  <Bar dataKey="expense" name="Chi tiêu" fill="#fb7185" radius={[8, 8, 8, 8]} isAnimationActive={false} />
                </ReBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-60">
                <div className="w-16 h-16 bg-gradient-to-tr from-sky-100 to-sky-50 -rotate-12 rounded-2xl flex items-center justify-center mb-4 border border-white shadow-sm">
                  <BarChartIcon className="w-8 h-8 text-sky-300" />
                </div>
                <p className="text-sm font-semibold text-sky-800">Chưa có giao dịch chi tiêu</p>
                <p className="text-xs font-medium text-sky-600/70 mt-1">Dữ liệu sẽ hiển thị tại đây</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}

