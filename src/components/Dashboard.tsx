import React, { useState, useEffect, useRef } from 'react';
import { Student, ClassSession, formatVND, parseDateSafe } from '../types';
import { Users, Calendar, Plus, UserPlus, CalendarPlus, CreditCard, ArrowUpRight, Banknote } from 'lucide-react';
import { motion } from 'motion/react';
import { Input } from './ui/Input';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const DongSign = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 4v12" />
    <circle cx="11" cy="12" r="4" />
    <path d="M11 8h8" />
    <path d="M7 20h12" />
  </svg>
);

const weeklyScheduleData = [
  { name: 'T2', sessions: 1, hours: 2 },
  { name: 'T3', sessions: 2, hours: 3 },
  { name: 'T4', sessions: 1, hours: 1.5 },
  { name: 'T5', sessions: 3, hours: 4.5 },
  { name: 'T6', sessions: 0, hours: 0 },
  { name: 'T7', sessions: 4, hours: 6 },
  { name: 'CN', sessions: 2, hours: 3 },
];

const formatYAxisCurrency = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(0)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return value.toString();
};

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const dayName = label === 'CN' ? 'Chủ Nhật' : `Thứ ${label.replace('T', '')}`;
    return (
      <div className="bg-white/90 backdrop-blur-2xl p-4 border border-white/60 shadow-[0_8px_32px_rgba(14,165,233,0.15)] rounded-2xl min-w-[160px]">
        <p className="font-bold text-slate-800 mb-2 text-sm tracking-tight">{dayName}</p>
        <div className="space-y-1.5">
          <p className="text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.5)]"></span>
            <span className="font-semibold text-sky-700">{payload[0].value} buổi học</span>
          </p>
          {payload[1] && (
            <p className="text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_6px_rgba(129,140,248,0.5)]"></span>
              <span className="font-medium text-slate-600">{payload[1].value} giờ</span>
            </p>
          )}
        </div>
      </div>
    );
  }
  return null;
};

const CustomAreaTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const actual = payload.find((p: any) => p.dataKey === 'actual')?.value || 0;
    const potential = payload.find((p: any) => p.dataKey === 'potential')?.value || 0;
    const remaining = potential - actual;

    return (
      <div className="bg-white/90 backdrop-blur-2xl p-5 border border-white/60 shadow-[0_12px_40px_rgba(14,165,233,0.18)] rounded-2xl min-w-[220px]">
        <p className="font-extrabold text-slate-800 mb-4 tracking-tight">{label}</p>
        <div className="space-y-3">
          <div className="flex justify-between items-center gap-6">
            <span className="flex items-center gap-2 text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]"></span>
              <span className="text-slate-600 font-medium">Kỳ vọng</span>
            </span>
            <span className="font-bold text-slate-800 tabular-nums">{formatVND(potential)}</span>
          </div>
          <div className="flex justify-between items-center gap-6">
            <span className="flex items-center gap-2 text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></span>
              <span className="text-emerald-700 font-medium">Đã thu</span>
            </span>
            <span className="font-bold text-emerald-600 tabular-nums">{formatVND(actual)}</span>
          </div>
          <div className="flex justify-between items-center gap-6 pt-3 border-t border-slate-100/60">
            <span className="flex items-center gap-2 text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]"></span>
              <span className="text-amber-700 font-medium">Chờ thu</span>
            </span>
            <span className="font-bold text-amber-600 tabular-nums">{formatVND(remaining)}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

interface DashboardProps {
  students: Student[];
  classes: ClassSession[];
  setActiveTab?: (tab: string) => void;
  displayName?: string;
}

export default function Dashboard({ students, classes, setActiveTab, displayName }: DashboardProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  });

  // Calculate financial data dynamically based on selected month
  let tongTienCoTheThu = 0;
  let soTienThanhToan = 0;
  let choThanhToan = 0;

  // Calculate potential revenue based on fee * feeCycle for ALL active students (Global)
  students.filter(s => s.status !== 'inactive').forEach(student => {
    const feeCycle = student.feeCycle || 8;
    tongTienCoTheThu += (student.fee || 0) * feeCycle;
  });

  const filteredClasses = classes.filter(c => {
    const classDate = parseDateSafe(c.date);
    if (isNaN(classDate.getTime())) return false;
    const classMonth = `${classDate.getFullYear()}-${(classDate.getMonth() + 1).toString().padStart(2, '0')}`;
    return classMonth === selectedMonth;
  });

  filteredClasses.forEach(c => {
    const student = students.find(s => s.id === c.studentId);
    const feePerSession = student?.fee || 0;
    const amount = feePerSession * Number(c.duration);
    if (c.isPaid) {
      soTienThanhToan += amount;
    } else {
      choThanhToan += amount;
    }
  });

  const soTienCoTheThuConLai = tongTienCoTheThu - soTienThanhToan - choThanhToan;

  const donutData = [
    { name: 'Số tiền thanh toán', value: soTienThanhToan > 0 ? soTienThanhToan : 0, fill: '#10b981' }, // Emerald 500
    { name: 'Chờ thanh toán', value: choThanhToan > 0 ? choThanhToan : 0, fill: '#f59e0b' }, // Amber 500
    { name: 'Số tiền có thể thu còn lại', value: soTienCoTheThuConLai > 0 ? soTienCoTheThuConLai : 0, fill: '#38bdf8' } // Sky 400
  ];

  // Calculate classes this week
  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const classesThisWeek = classes.filter(c => {
    const classDate = parseDateSafe(c.date);
    if (isNaN(classDate.getTime())) return false;
    return classDate >= startOfWeek && classDate <= endOfWeek;
  }).length;

  // Calculate revenue trend dynamically
  const revenueTrendMap = new Map<string, { name: string, actual: number, potential: number, sortKey: string }>();
  
  classes.forEach(c => {
    const classDate = parseDateSafe(c.date);
    if (isNaN(classDate.getTime())) return;
    
    const month = classDate.getMonth() + 1;
    const year = classDate.getFullYear();
    const monthYear = `T${month}/${year.toString().slice(-2)}`;
    const sortKey = `${year}-${month.toString().padStart(2, '0')}`;
    
    const student = students.find(s => s.id === c.studentId);
    const feePerSession = student?.fee || 0;
    const amount = feePerSession * Number(c.duration);
    
    if (!revenueTrendMap.has(monthYear)) {
      revenueTrendMap.set(monthYear, { name: monthYear, actual: 0, potential: 0, sortKey });
    }
    
    const data = revenueTrendMap.get(monthYear)!;
    data.potential += amount;
    if (c.isPaid) {
      data.actual += amount;
    }
  });

  const dynamicRevenueTrendData = Array.from(revenueTrendMap.values())
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .map(({ name, actual, potential }) => ({ 
      name, 
      actual, 
      potential,
      remaining: potential - actual
    }));

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = displayName || 'bạn';
    if (hour < 12) return `Chào buổi sáng, ${name}!`;
    if (hour < 18) return `Chào buổi chiều, ${name}!`;
    return `Chào buổi tối, ${name}!`;
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-1 items-start">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, ease: 'easeOut' }}
          className="text-3xl sm:text-4xl font-extrabold animate-rainbow-text tracking-tight drop-shadow-sm pb-1"
        >
          {getGreeting()}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-slate-600 font-medium text-lg"
        >
          Dưới đây là tình hình hoạt động trung tâm của bạn
        </motion.p>
      </div>
      
      <motion.div 
        initial="hidden" animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <motion.div 
          variants={{ hidden: { opacity: 0, y: 24, scale: 0.97 }, visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } } }}
          onClick={() => setActiveTab && setActiveTab('students')}
          className="bg-white/80 backdrop-blur-2xl border border-white/80 shadow-sm overflow-hidden rounded-[24px] cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(56,189,248,0.3)] hover:bg-white group relative"
        >
          <div className="bg-noise rounded-[24px]"></div>
          <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity z-10">
             <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-sky-500" />
          </div>
          <div className="p-8 relative z-10">
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-start">
                <div className="bg-gradient-to-br from-sky-100 to-sky-50 p-3 rounded-2xl shadow-inner border border-white/50 group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-7 w-7 text-sky-500" />
                </div>
              </div>
              <div>
                <dt className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Học viên hoạt động</dt>
                <dd className="text-5xl font-extrabold text-slate-800 tracking-tight">{students.filter(s => s.status !== 'inactive').length}</dd>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          variants={{ hidden: { opacity: 0, y: 24, scale: 0.97 }, visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } } }}
          onClick={() => setActiveTab && setActiveTab('classes')}
          className="bg-white/80 backdrop-blur-2xl border border-white/80 shadow-sm overflow-hidden rounded-[24px] cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(16,185,129,0.3)] hover:bg-white group relative"
        >
          <div className="bg-noise rounded-[24px]"></div>
          <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity z-10">
             <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500" />
          </div>
          <div className="p-8 relative z-10">
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-start">
                <div className="bg-gradient-to-br from-emerald-100 to-emerald-50 p-3 rounded-2xl shadow-inner border border-white/50 group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="h-7 w-7 text-emerald-600" />
                </div>
              </div>
              <div>
                <dt className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Lớp học tuần này</dt>
                <dd className="text-5xl font-extrabold text-slate-800 tracking-tight">{classesThisWeek}</dd>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          variants={{ hidden: { opacity: 0, y: 24, scale: 0.97 }, visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } } }}
          onClick={() => setActiveTab && setActiveTab('finances')}
          className="bg-white/80 backdrop-blur-2xl border border-white/80 shadow-sm overflow-hidden rounded-[24px] cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(245,158,11,0.3)] hover:bg-white group relative"
        >
          <div className="bg-noise rounded-[24px]"></div>
          <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity z-10">
             <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-amber-500" />
          </div>
          <div className="p-8 relative z-10">
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-start">
                <div className="bg-gradient-to-br from-amber-100 to-amber-50 p-3 rounded-2xl shadow-inner border border-white/50 group-hover:scale-110 transition-transform duration-300">
                  <Banknote className="h-7 w-7 text-amber-600" />
                </div>
              </div>
              <div>
                <dt className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Chờ thanh toán</dt>
                <dd className="text-4xl font-extrabold text-slate-800 tracking-tight leading-tight mt-1 truncate">{formatVND(choThanhToan)}</dd>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, ease: 'easeOut' }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
      >
        {/* Revenue Trend Chart (50%) */}
        <div className="bg-white/90 backdrop-blur-2xl border border-white/60 shadow-sm rounded-[24px] lg:col-span-1 flex flex-col hover:-translate-y-1 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
          <div className="bg-noise rounded-[24px]"></div>
          <div className="p-8 flex flex-col h-full min-h-[500px] relative z-10">
            <h3 className="text-xl font-bold text-slate-800 tracking-tight mb-8">Xu hướng doanh thu</h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <BarChart data={dynamicRevenueTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPotential" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7dd3fc" stopOpacity={0.95}/>
                      <stop offset="100%" stopColor="#bae6fd" stopOpacity={0.4}/>
                    </linearGradient>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={0.95}/>
                      <stop offset="100%" stopColor="#6ee7b7" stopOpacity={0.4}/>
                    </linearGradient>
                    <linearGradient id="colorRemaining" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.95}/>
                      <stop offset="100%" stopColor="#fde68a" stopOpacity={0.4}/>
                    </linearGradient>
                    <filter id="barGlow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.4} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} dy={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} tickFormatter={formatYAxisCurrency} dx={-10} />
                  <RechartsTooltip content={<CustomAreaTooltip />} cursor={{ fill: '#f0f9ff', opacity: 0.5, radius: 8 }} />
                  <Legend verticalAlign="top" height={40} iconType="circle" wrapperStyle={{ paddingBottom: '24px', fontSize: '13px', fontWeight: 600, color: '#475569' }} />
                  <Bar dataKey="potential" name="Tổng thu kỳ vọng" fill="url(#colorPotential)" radius={[8, 8, 0, 0]} maxBarSize={42} isAnimationActive={true} animationDuration={800} animationEasing="ease-out" filter="url(#barGlow)" />
                  <Bar dataKey="actual" name="Đã thanh toán" fill="url(#colorActual)" radius={[8, 8, 0, 0]} maxBarSize={42} isAnimationActive={true} animationDuration={1000} animationEasing="ease-out" filter="url(#barGlow)" />
                  <Bar dataKey="remaining" name="Chờ thanh toán" fill="url(#colorRemaining)" radius={[8, 8, 0, 0]} maxBarSize={42} isAnimationActive={true} animationDuration={1200} animationEasing="ease-out" filter="url(#barGlow)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Tỷ lệ thu hồi học phí (Donut Chart) (50%) */}
        <div className="bg-white/90 backdrop-blur-2xl border border-white/60 shadow-sm rounded-[24px] lg:col-span-1 flex flex-col hover:-translate-y-1 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
          <div className="bg-noise rounded-[24px]"></div>
          <div className="p-8 flex-1 min-h-[500px] flex flex-col relative z-10">
            <div className="flex justify-between items-center mb-8 gap-4">
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">Thu hồi học phí</h3>
              <div className="relative shrink-0 group">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all duration-300 rounded-[12px] px-4 py-2">
                  <Calendar className="w-5 h-5 text-slate-500" />
                  <input
                    type="month"
                    id="financialMonthFilter"
                    value={selectedMonth}
                    onChange={(e) => {
                      if (e.target.value) {
                        setSelectedMonth(e.target.value);
                      }
                    }}
                    className="bg-transparent border-none p-0 text-slate-700 font-semibold focus:ring-0 cursor-pointer outline-none w-[110px] text-sm"
                    style={{ WebkitAppearance: 'none' }}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex-1 relative flex justify-center items-center py-6 min-h-[260px]">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} // smooth spring-like
                whileHover={{ scale: 1.02 }}
                className="w-[220px] h-[220px] relative cursor-pointer"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius="72%"
                      outerRadius="100%"
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                      cornerRadius={6}
                      className="drop-shadow-sm"
                      isAnimationActive={true}
                      animationBegin={200}
                      animationDuration={900}
                      animationEasing="ease-out"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: number) => formatVND(value)}
                      contentStyle={{ borderRadius: '20px', border: '1px solid rgba(255,255,255,0.6)', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', boxShadow: '0 12px 40px rgba(14,165,233,0.15)', padding: '12px 16px', fontWeight: 600 }}
                      itemStyle={{ color: '#0c4a6e' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-5xl leading-none font-extrabold text-slate-800 tracking-tighter drop-shadow-sm">{(tongTienCoTheThu > 0 ? (soTienThanhToan / tongTienCoTheThu) * 100 : 0).toFixed(0)}%</span>
                  <span className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-[0.25em] mt-3 opacity-60">Hoàn thành</span>
                </div>
              </motion.div>
            </div>
            
            <div className="mt-8 bg-white/60 backdrop-blur-md rounded-[24px] p-6 ring-1 ring-white/60 shadow-sm border border-slate-100/50">
              <div className="flex justify-between items-center pb-5 border-b border-slate-100/60 mb-5">
                <span className="text-[0.8rem] font-bold text-slate-600 uppercase tracking-widest">Tổng thu kỳ vọng</span>
                <span className="font-extrabold text-xl text-slate-800 tracking-tight">{formatVND(tongTienCoTheThu)}</span>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between group/item">
                  <div className="flex items-center gap-3 w-1/2">
                    <div className="w-3 h-3 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                    <span className="text-sm font-semibold text-slate-700 truncate">Đã thanh toán</span>
                  </div>
                  <span className="font-bold text-slate-800 text-right w-1/2">{formatVND(soTienThanhToan)}</span>
                </div>
                <div className="flex items-center justify-between group/item">
                  <div className="flex items-center gap-3 w-1/2">
                    <div className="w-3 h-3 rounded-full bg-[#f59e0b] shadow-[0_0_8px_rgba(245,158,11,0.4)]"></div>
                    <span className="text-sm font-semibold text-slate-700 truncate">Chờ thanh toán</span>
                  </div>
                  <span className="font-bold text-slate-800 text-right w-1/2">{formatVND(choThanhToan)}</span>
                </div>
                <div className="flex items-center justify-between group/item">
                  <div className="flex items-center gap-3 w-1/2">
                    <div className="w-3 h-3 rounded-full bg-[#38bdf8] shadow-[0_0_8px_rgba(56,189,248,0.4)]"></div>
                    <span className="text-sm font-semibold text-slate-700 truncate">Có thể thu thêm</span>
                  </div>
                  <span className="font-bold text-slate-800 text-right w-1/2">{formatVND(soTienCoTheThuConLai)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
