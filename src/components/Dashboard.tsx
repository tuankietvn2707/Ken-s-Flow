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
      <div className="glass-panel p-3 border border-theme text-theme-primary rounded-xl">
        <p className="font-semibold text-theme-primary mb-1">{dayName}</p>
        <p className="text-sm text-theme-muted">
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
      <div className="glass-panel p-3 border border-theme text-theme-primary rounded-xl">
        <p className="font-semibold text-theme-primary mb-3">{`Tháng ${label.replace('T', '')}`}</p>
        <div className="space-y-2">
          <p className="text-sm flex justify-between items-center gap-4">
            <span className="text-theme-muted">Tổng số tiền có thể thu:</span>
            <span className="font-medium text-sky-600">{formatVND(potential)}</span>
          </p>
          <p className="text-sm flex justify-between items-center gap-4">
            <span className="text-theme-muted">Đã thanh toán:</span>
            <span className="font-semibold text-emerald-500">{formatVND(actual)}</span>
          </p>
          <p className="text-sm flex justify-between items-center gap-4 pt-2 border-t border-theme">
            <span className="text-theme-muted">Chờ thanh toán:</span>
            <span className="font-medium text-amber-500">{formatVND(remaining)}</span>
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
    { name: 'Số tiền thanh toán', value: soTienThanhToan > 0 ? soTienThanhToan : 0, fill: '#BAFFC9' }, // Green Pastel
    { name: 'Chờ thanh toán', value: choThanhToan > 0 ? choThanhToan : 0, fill: '#FFB3BA' }, // Red Pastel
    { name: 'Số tiền có thể thu còn lại', value: soTienCoTheThuConLai > 0 ? soTienCoTheThuConLai : 0, fill: '#BDE0FE' } // Blue Pastel
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="text-2xl font-bold text-theme-primary"
        >
          {getGreeting()}
        </motion.h1>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="grid grid-cols-1 gap-5 sm:grid-cols-3"
      >
        <div 
          onClick={() => setActiveTab && setActiveTab('students')}
          className="glass-panel border-theme overflow-hidden rounded-3xl shadow-[0_8px_32px_rgba(14,165,233,0.08)] cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(14,165,233,0.15)] hover:ring-2 hover:ring-sky-100"
        >
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-[#BAE1FF] rounded-xl p-3">
                <Users className="h-6 w-6 text-sky-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-theme-muted truncate">Học viên đang hoạt động</dt>
                  <dd className="text-3xl font-bold text-theme-primary mt-1">{students.filter(s => s.status !== 'inactive').length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab && setActiveTab('classes')}
          className="glass-panel border-theme overflow-hidden rounded-3xl shadow-[0_8px_32px_rgba(14,165,233,0.08)] cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(14,165,233,0.15)] hover:ring-2 hover:ring-sky-100"
        >
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-[#BAFFC9] rounded-xl p-3">
                <Calendar className="h-6 w-6 text-emerald-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-theme-muted truncate">Lớp học tuần này</dt>
                  <dd className="text-3xl font-bold text-theme-primary mt-1">{classesThisWeek}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab && setActiveTab('finances')}
          className="glass-panel border-theme overflow-hidden rounded-3xl shadow-[0_8px_32px_rgba(14,165,233,0.08)] cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(14,165,233,0.15)] hover:ring-2 hover:ring-sky-100"
        >
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-[#FFDFBA] rounded-xl p-3">
                <DongSign className="h-6 w-6 text-amber-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-theme-muted truncate">Chờ thanh toán</dt>
                  <dd className="text-2xl font-bold text-theme-primary mt-1">{formatVND(choThanhToan)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="grid grid-cols-1 gap-5 lg:grid-cols-2"
      >
        {/* Revenue Trend Chart (50%) */}
        <div className="glass-panel border-theme rounded-3xl shadow-[0_8px_32px_rgba(14,165,233,0.08)] lg:col-span-1 flex flex-col">
          <div className="p-6 border-b border-theme">
            <h3 className="text-lg font-bold text-theme-secondary">Xu hướng doanh thu</h3>
          </div>
          <div className="p-6 flex-1 min-h-[450px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <BarChart data={dynamicRevenueTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--glass-border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 500 }} tickFormatter={formatYAxisCurrency} />
                <RechartsTooltip content={<CustomAreaTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '13px', fontWeight: 500, color: '#64748B' }} />
                <Bar dataKey="potential" name="Tổng số tiền có thể thu" fill="#BAE1FF" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="actual" name="Đã thanh toán" fill="#BAFFC9" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="remaining" name="Chờ thanh toán" fill="#FFDFBA" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tỷ lệ thu hồi học phí (Donut Chart) (50%) */}
        <div className="glass-panel border-theme rounded-3xl shadow-[0_8px_32px_rgba(14,165,233,0.08)] lg:col-span-1 flex flex-col">
          <div className="p-6 border-b border-theme flex justify-between items-center">
            <h3 className="text-lg font-bold text-theme-secondary font-sans">Tỷ lệ thu hồi học phí</h3>
            <div className="relative">
              <input
                type="month"
                id="financialMonthFilter"
                value={selectedMonth}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedMonth(e.target.value);
                  }
                }}
                className="text-sm border border-theme rounded-xl px-3 py-1.5 text-theme-secondary focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 glass-panel shadow-sm w-40 cursor-pointer hover:border-sky-300 transition-colors"
              />
            </div>
          </div>
          <div className="p-6 py-10 flex-1 min-h-[450px] flex flex-col">
            <div className="flex-1 relative min-h-0 min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="#FFFFFF"
                    strokeWidth={2}
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Pie
                    data={[{ name: 'Tổng số tiền có thể thu', value: tongTienCoTheThu, fill: '#FFB7B2' }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={100}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill="#FFB7B2" />
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: number) => formatVND(value)}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-theme-primary">{(tongTienCoTheThu > 0 ? (soTienThanhToan / tongTienCoTheThu) * 100 : 0).toFixed(1)}%</span>
                <span className="text-xs font-medium text-theme-muted mt-1">Đã hoàn thành</span>
              </div>
            </div>
            
            <div className="mt-4 space-y-3">
              <div className="flex justify-center">
                <div className="flex items-center gap-2 bg-theme-section px-4 py-2 rounded-xl border border-theme">
                  <div className="w-3 h-3 rounded-full bg-[#FFB7B2]"></div>
                  <span className="text-sm text-pink-400 font-bold">Tổng số tiền có thể thu: </span>
                  <span className="font-bold text-theme-secondary">{formatVND(tongTienCoTheThu)}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 px-4 max-w-md mx-auto w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#BDE0FE]"></div>
                    <span className="text-sm text-theme-muted">Số tiền có thể thu còn lại:</span>
                  </div>
                  <span className="font-semibold text-theme-secondary">{formatVND(soTienCoTheThuConLai)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#BAFFC9]"></div>
                    <span className="text-sm text-theme-muted">Số tiền thanh toán:</span>
                  </div>
                  <span className="font-semibold text-theme-secondary">{formatVND(soTienThanhToan)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#FFB3BA]"></div>
                    <span className="text-sm text-theme-muted">Chờ thanh toán:</span>
                  </div>
                  <span className="font-semibold text-theme-secondary">{formatVND(choThanhToan)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
