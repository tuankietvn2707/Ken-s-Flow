import React, { useState, useEffect, useRef } from 'react';
import { Student, ClassSession, formatVND, parseDateSafe } from '../types';
import { Users, Calendar, Plus, UserPlus, CalendarPlus, CreditCard } from 'lucide-react';
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
      <div className="glass-panel p-3 border border-sky-300/30 text-sky-950 rounded-xl">
        <p className="font-semibold text-sky-950 mb-1">{dayName}</p>
        <p className="text-sm text-sky-700/80">
          <span className="font-medium text-sky-600">{payload[0].value} buổi học</span>
          {' '}
          ({payload[1].value} giờ)
        </p>
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
      <div className="bg-white/95 backdrop-blur-md p-4 border border-sky-100 shadow-xl rounded-2xl">
        <p className="font-bold text-sky-950 mb-4">{`Tháng ${label.replace('T', '')}`}</p>
        <div className="space-y-3">
          <p className="text-sm flex justify-between items-center gap-6">
            <span className="text-sky-700 font-medium">Tổng thu kỳ vọng:</span>
            <span className="font-bold text-sky-950">{formatVND(potential)}</span>
          </p>
          <p className="text-sm flex justify-between items-center gap-6">
            <span className="text-emerald-600 font-medium tracking-wide">Đã thanh toán:</span>
            <span className="font-bold text-emerald-600">{formatVND(actual)}</span>
          </p>
          <p className="text-sm flex justify-between items-center gap-6 pt-3 border-t border-sky-100">
            <span className="text-amber-600 font-medium tracking-wide">Chờ thanh toán:</span>
            <span className="font-bold text-amber-600">{formatVND(remaining)}</span>
          </p>
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
          className="text-3xl sm:text-4xl font-extrabold text-sky-950 tracking-tight"
        >
          {getGreeting()}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-sky-700/80 font-medium text-lg"
        >
          Dưới đây là tình hình hoạt động trung tâm của bạn
        </motion.p>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, ease: 'easeOut' }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div 
          onClick={() => setActiveTab && setActiveTab('students')}
          className="bg-white/60 backdrop-blur-md border border-white shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden rounded-[32px] cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_48px_rgba(14,165,233,0.12)] group relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="p-8 relative z-10">
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-start">
                <div className="bg-gradient-to-br from-sky-50 to-white text-sky-500 rounded-[20px] p-4 shadow-sm ring-1 ring-white/80 group-hover:scale-110 group-hover:shadow-md group-hover:text-sky-600 transition-all duration-300">
                  <Users className="h-7 w-7" />
                </div>
              </div>
              <div>
                <dt className="text-xs font-bold text-sky-600/80 uppercase tracking-[0.15em] mb-2">Học viên hoạt động</dt>
                <dd className="text-5xl font-black text-sky-950 tracking-tighter drop-shadow-sm">{students.filter(s => s.status !== 'inactive').length}</dd>
              </div>
            </div>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab && setActiveTab('classes')}
          className="bg-white/60 backdrop-blur-md border border-white shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden rounded-[32px] cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_48px_rgba(16,185,129,0.12)] group relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="p-8 relative z-10">
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-start">
                <div className="bg-gradient-to-br from-emerald-50 to-white text-emerald-500 rounded-[20px] p-4 shadow-sm ring-1 ring-white/80 group-hover:scale-110 group-hover:shadow-md group-hover:text-emerald-600 transition-all duration-300">
                  <Calendar className="h-7 w-7" />
                </div>
              </div>
              <div>
                <dt className="text-xs font-bold text-emerald-600/80 uppercase tracking-[0.15em] mb-2">Lớp học tuần này</dt>
                <dd className="text-5xl font-black text-sky-950 tracking-tighter drop-shadow-sm">{classesThisWeek}</dd>
              </div>
            </div>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab && setActiveTab('finances')}
          className="bg-white/60 backdrop-blur-md border border-white shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden rounded-[32px] cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_48px_rgba(245,158,11,0.12)] group relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="p-8 relative z-10">
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-start">
                <div className="bg-gradient-to-br from-amber-50 to-white text-amber-500 rounded-[20px] p-4 shadow-sm ring-1 ring-white/80 group-hover:scale-110 group-hover:shadow-md group-hover:text-amber-600 transition-all duration-300">
                  <DongSign className="h-7 w-7" />
                </div>
              </div>
              <div>
                <dt className="text-xs font-bold text-amber-600/80 uppercase tracking-[0.15em] mb-2">Chờ thanh toán</dt>
                <dd className="text-4xl font-black text-sky-950 tracking-tight leading-tight mt-1 truncate drop-shadow-sm">{formatVND(choThanhToan)}</dd>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, ease: 'easeOut' }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
      >
        {/* Revenue Trend Chart (50%) */}
        <div className="bg-white/60 backdrop-blur-md border border-white shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[32px] lg:col-span-1 flex flex-col hover:-translate-y-1.5 hover:shadow-[0_12px_48px_rgba(14,165,233,0.1)] transition-all duration-300">
          <div className="p-8 flex flex-col h-full min-h-[500px]">
            <h3 className="text-xl font-extrabold text-sky-950 tracking-tight mb-8">Xu hướng doanh thu</h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <BarChart data={dynamicRevenueTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} dy={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} tickFormatter={formatYAxisCurrency} dx={-10} />
                  <RechartsTooltip content={<CustomAreaTooltip />} cursor={{ fill: '#f8fafc', opacity: 0.6 }} />
                  <Legend verticalAlign="top" height={40} iconType="circle" wrapperStyle={{ paddingBottom: '24px', fontSize: '13px', fontWeight: 600, color: '#475569' }} />
                  <Bar dataKey="potential" name="Tổng thu kỳ vọng" fill="#bae6fd" radius={[6, 6, 0, 0]} maxBarSize={45} isAnimationActive={false} />
                  <Bar dataKey="actual" name="Đã thanh toán" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={45} isAnimationActive={false} />
                  <Bar dataKey="remaining" name="Chờ thanh toán" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={45} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Tỷ lệ thu hồi học phí (Donut Chart) (50%) */}
        <div className="bg-white/60 backdrop-blur-md border border-white shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[32px] lg:col-span-1 flex flex-col hover:-translate-y-1.5 hover:shadow-[0_12px_48px_rgba(14,165,233,0.1)] transition-all duration-300">
          <div className="p-8 flex-1 min-h-[500px] flex flex-col">
            <div className="flex justify-between items-center mb-8 gap-4">
              <h3 className="text-xl font-extrabold text-sky-950 tracking-tight">Thu hồi học phí</h3>
              <div className="relative shrink-0 group">
                <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md border border-white shadow-[0_4px_16px_rgba(14,165,233,0.05)] hover:shadow-[0_8px_24px_rgba(14,165,233,0.1)] hover:bg-white/90 transition-all duration-300 rounded-[20px] px-4 py-2 ring-1 ring-sky-100/50 group-hover:ring-sky-200">
                  <Calendar className="w-5 h-5 text-sky-500 group-hover:text-sky-600 transition-colors" />
                  <input
                    type="month"
                    id="financialMonthFilter"
                    value={selectedMonth}
                    onChange={(e) => {
                      if (e.target.value) {
                        setSelectedMonth(e.target.value);
                      }
                    }}
                    className="bg-transparent border-none p-0 text-sky-950 font-semibold focus:ring-0 cursor-pointer outline-none w-[110px] text-sm"
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
                      isAnimationActive={false}
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
                  <span className="text-5xl leading-none font-extrabold text-sky-950 tracking-tighter drop-shadow-sm">{(tongTienCoTheThu > 0 ? (soTienThanhToan / tongTienCoTheThu) * 100 : 0).toFixed(0)}%</span>
                  <span className="text-[0.65rem] font-bold text-sky-500 uppercase tracking-[0.25em] mt-3 opacity-60">Hoàn thành</span>
                </div>
              </motion.div>
            </div>
            
            <div className="mt-8 bg-white/40 backdrop-blur-md rounded-[24px] p-6 ring-1 ring-white/60 shadow-[0_4px_24px_rgba(14,165,233,0.03)] border border-sky-100/50">
              <div className="flex justify-between items-center pb-5 border-b border-sky-100/60 mb-5">
                <span className="text-[0.8rem] font-bold text-sky-900/80 uppercase tracking-widest">Tổng thu kỳ vọng</span>
                <span className="font-extrabold text-xl text-sky-950 tracking-tight">{formatVND(tongTienCoTheThu)}</span>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between group/item">
                  <div className="flex items-center gap-3 w-1/2">
                    <div className="w-3 h-3 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                    <span className="text-sm font-semibold text-sky-800/90 truncate">Đã thanh toán</span>
                  </div>
                  <span className="font-bold text-sky-950 text-right w-1/2">{formatVND(soTienThanhToan)}</span>
                </div>
                <div className="flex items-center justify-between group/item">
                  <div className="flex items-center gap-3 w-1/2">
                    <div className="w-3 h-3 rounded-full bg-[#f59e0b] shadow-[0_0_8px_rgba(245,158,11,0.4)]"></div>
                    <span className="text-sm font-semibold text-sky-800/90 truncate">Chờ thanh toán</span>
                  </div>
                  <span className="font-bold text-sky-950 text-right w-1/2">{formatVND(choThanhToan)}</span>
                </div>
                <div className="flex items-center justify-between group/item">
                  <div className="flex items-center gap-3 w-1/2">
                    <div className="w-3 h-3 rounded-full bg-[#38bdf8] shadow-[0_0_8px_rgba(56,189,248,0.4)]"></div>
                    <span className="text-sm font-semibold text-sky-800/90 truncate">Có thể thu thêm</span>
                  </div>
                  <span className="font-bold text-sky-950 text-right w-1/2">{formatVND(soTienCoTheThuConLai)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
