import React, { useState, useEffect, useRef } from 'react';
import { Student, ClassSession, formatVND, parseDateSafe } from '../types';
import { Users, Calendar, Plus, UserPlus, CalendarPlus, CreditCard } from 'lucide-react';
import { motion } from 'motion/react';
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
          className="bg-white/80 backdrop-blur-xl border border-white shadow-sm overflow-hidden rounded-3xl cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-sky-200 group"
        >
          <div className="p-8">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="bg-sky-50 text-sky-600 rounded-2xl p-4 ring-1 ring-sky-100 group-hover:bg-sky-100 group-hover:scale-110 transition-all duration-300">
                  <Users className="h-7 w-7" />
                </div>
              </div>
              <div>
                <dt className="text-xs font-bold text-sky-600 uppercase tracking-widest mb-1">Học viên hoạt động</dt>
                <dd className="text-5xl font-black text-sky-950 tracking-tighter">{students.filter(s => s.status !== 'inactive').length}</dd>
              </div>
            </div>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab && setActiveTab('classes')}
          className="bg-white/80 backdrop-blur-xl border border-white shadow-sm overflow-hidden rounded-3xl cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-emerald-200 group"
        >
          <div className="p-8">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="bg-emerald-50 text-emerald-600 rounded-2xl p-4 ring-1 ring-emerald-100 group-hover:bg-emerald-100 group-hover:scale-110 transition-all duration-300">
                  <Calendar className="h-7 w-7" />
                </div>
              </div>
              <div>
                <dt className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Lớp học tuần này</dt>
                <dd className="text-5xl font-black text-sky-950 tracking-tighter">{classesThisWeek}</dd>
              </div>
            </div>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab && setActiveTab('finances')}
          className="bg-white/80 backdrop-blur-xl border border-white shadow-sm overflow-hidden rounded-3xl cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-amber-200 group"
        >
          <div className="p-8">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="bg-amber-50 text-amber-600 rounded-2xl p-4 ring-1 ring-amber-100 group-hover:bg-amber-100 group-hover:scale-110 transition-all duration-300">
                  <DongSign className="h-7 w-7" />
                </div>
              </div>
              <div>
                <dt className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">Chờ thanh toán</dt>
                <dd className="text-4xl font-black text-sky-950 tracking-tight leading-tight mt-1 truncate">{formatVND(choThanhToan)}</dd>
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
        <div className="bg-white/70 backdrop-blur-xl border border-white shadow-sm rounded-3xl lg:col-span-1 flex flex-col hover:shadow-md transition-shadow duration-300">
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
                  <Bar dataKey="potential" name="Tổng thu kỳ vọng" fill="#bae6fd" radius={[6, 6, 0, 0]} maxBarSize={45} />
                  <Bar dataKey="actual" name="Đã thanh toán" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={45} />
                  <Bar dataKey="remaining" name="Chờ thanh toán" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Tỷ lệ thu hồi học phí (Donut Chart) (50%) */}
        <div className="bg-white/70 backdrop-blur-xl border border-white shadow-sm rounded-3xl lg:col-span-1 flex flex-col hover:shadow-md transition-shadow duration-300">
          <div className="p-8 flex-1 min-h-[500px] flex flex-col">
            <div className="flex justify-between items-start mb-8 gap-4">
              <h3 className="text-xl font-extrabold text-sky-950 tracking-tight">Thu hồi học phí</h3>
              <div className="relative shrink-0">
                <input
                  type="month"
                  id="financialMonthFilter"
                  value={selectedMonth}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedMonth(e.target.value);
                    }
                  }}
                  className="text-sm font-medium border-0 ring-1 ring-sky-200 rounded-2xl px-4 py-2 text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white/80 shadow-sm cursor-pointer hover:ring-sky-300 transition-all"
                />
              </div>
            </div>
            
            <div className="flex-1 relative min-h-0 min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius="65%"
                    outerRadius="85%"
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: number) => formatVND(value)}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: '12px 16px', fontWeight: 600 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl font-black text-sky-950 tracking-tighter">{(tongTienCoTheThu > 0 ? (soTienThanhToan / tongTienCoTheThu) * 100 : 0).toFixed(0)}%</span>
                <span className="text-xs font-bold text-sky-500 uppercase tracking-wider mt-1">Hoàn thành</span>
              </div>
            </div>
            
            <div className="mt-8 bg-sky-50/50 rounded-2xl p-5 ring-1 ring-sky-100">
              <div className="flex justify-between items-center pb-4 border-b border-sky-100 mb-4">
                <span className="text-sm font-bold text-sky-900 uppercase tracking-wider">Tổng thu kỳ vọng</span>
                <span className="font-black text-lg text-sky-950">{formatVND(tongTienCoTheThu)}</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></div>
                    <span className="text-sm font-medium text-sky-800">Đã thanh toán</span>
                  </div>
                  <span className="font-bold text-sky-950">{formatVND(soTienThanhToan)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></div>
                    <span className="text-sm font-medium text-sky-800">Chờ thanh toán</span>
                  </div>
                  <span className="font-bold text-sky-950">{formatVND(choThanhToan)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]"></div>
                    <span className="text-sm font-medium text-sky-800">Có thể thu thêm</span>
                  </div>
                  <span className="font-bold text-sky-950">{formatVND(soTienCoTheThuConLai)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
