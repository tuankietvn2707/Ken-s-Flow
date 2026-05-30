import React, { useState, useMemo } from 'react';
import { SalarySlip } from '../types';
import { Plus, Pencil, Trash, Banknote, Calendar, CheckCircle2, CircleDashed, TrendingUp, TrendingDown, DollarSign, Calculator, Receipt, Building } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatVND, parseDateSafe } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  salarySlips: SalarySlip[];
  addSalarySlip: (slip: SalarySlip) => void;
  updateSalarySlip: (slip: SalarySlip) => void;
  deleteSalarySlip: (id: string) => void;
}

export default function SalaryTracker({ salarySlips, addSalarySlip, updateSalarySlip, deleteSalarySlip }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlip, setEditingSlip] = useState<SalarySlip | null>(null);

  // Form State
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [receivedDate, setReceivedDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [companyName, setCompanyName] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'banking' | 'cash'>('banking');
  const [status, setStatus] = useState<'received' | 'pending'>('received');
  
  const [baseSalary, setBaseSalary] = useState<string>('');
  const [allowances, setAllowances] = useState<{ label: string; amount: number }[]>([]);
  const [bonus, setBonus] = useState<string>('');
  const [bonusNote, setBonusNote] = useState<string>('');
  
  const [bhxh, setBhxh] = useState<string>('');
  const [bhyt, setBhyt] = useState<string>('');
  const [bhtn, setBhtn] = useState<string>('');
  const [incomeTax, setIncomeTax] = useState<string>('');
  const [otherDeductions, setOtherDeductions] = useState<{ label: string; amount: number }[]>([]);
  
  const [notes, setNotes] = useState<string>('');

  const parseComma = (val: string | number) => String(val).replace(/,/g, '').replace(/\D/g, '');
  const formatComma = (val: string | number) => {
    const numStr = parseComma(val);
    if (!numStr) return '';
    return Number(numStr).toLocaleString('en-US');
  };

  const resetForm = () => {
    const d = new Date();
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    setReceivedDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    setCompanyName('');
    setPaymentMethod('banking');
    setStatus('received');
    setBaseSalary('');
    setAllowances([]);
    setBonus('');
    setBonusNote('');
    setBhxh('');
    setBhyt('');
    setBhtn('');
    setIncomeTax('');
    setOtherDeductions([]);
    setNotes('');
    setEditingSlip(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (slip: SalarySlip) => {
    setEditingSlip(slip);
    setMonth(slip.month);
    setReceivedDate(slip.receivedDate);
    setCompanyName(slip.companyName || '');
    setPaymentMethod(slip.paymentMethod);
    setStatus(slip.status);
    
    setBaseSalary(slip.baseSalary === 0 ? '' : formatComma(slip.baseSalary));
    setAllowances(slip.allowances || []);
    setBonus(slip.bonus === 0 ? '' : formatComma(slip.bonus));
    setBonusNote(slip.bonusNote || '');
    
    setBhxh(slip.bhxh === 0 ? '' : formatComma(slip.bhxh));
    setBhyt(slip.bhyt === 0 ? '' : formatComma(slip.bhyt));
    setBhtn(slip.bhtn === 0 ? '' : formatComma(slip.bhtn));
    setIncomeTax(slip.incomeTax === 0 ? '' : formatComma(slip.incomeTax));
    setOtherDeductions(slip.otherDeductions || []);
    setNotes(slip.notes || '');
    
    setIsModalOpen(true);
  };

  // Helper for dynamic lists
  const handleAddAllowance = () => setAllowances([...allowances, { label: '', amount: 0 }]);
  const handleUpdateAllowance = (index: number, field: 'label' | 'amount', value: string) => {
    const newItems = [...allowances];
    if (field === 'amount') {
      newItems[index] = { ...newItems[index], amount: Number(parseComma(value)) };
    } else {
      newItems[index] = { ...newItems[index], label: value };
    }
    setAllowances(newItems);
  };
  const handleRemoveAllowance = (index: number) => setAllowances(allowances.filter((_, i) => i !== index));

  const handleAddDeduction = () => setOtherDeductions([...otherDeductions, { label: '', amount: 0 }]);
  const handleUpdateDeduction = (index: number, field: 'label' | 'amount', value: string) => {
    const newItems = [...otherDeductions];
    if (field === 'amount') {
      newItems[index] = { ...newItems[index], amount: Number(parseComma(value)) };
    } else {
      newItems[index] = { ...newItems[index], label: value };
    }
    setOtherDeductions(newItems);
  };
  const handleRemoveDeduction = (index: number) => setOtherDeductions(otherDeductions.filter((_, i) => i !== index));

  const calculateNet = (slip: SalarySlip) => {
    const gross = slip.baseSalary + slip.bonus + (slip.allowances?.reduce((sum, a) => sum + a.amount, 0) || 0);
    const deducts = slip.bhxh + slip.bhyt + slip.bhtn + slip.incomeTax + (slip.otherDeductions?.reduce((sum, a) => sum + a.amount, 0) || 0);
    return gross - deducts;
  };

  // Auto calculate insurances if baseSalary changes, optional features could be added but user usually enters real numbers.
  // Here we just provide a function to auto-fill based on common rules if user clicks a button, or let them type.

  const autoFillInsurances = () => {
    const base = Number(parseComma(baseSalary)) || 0;
    if (base > 0) {
      setBhxh(formatComma(base * 0.08));
      setBhyt(formatComma(base * 0.015));
      setBhtn(formatComma(base * 0.01));
    }
  };

  const previewGross = (Number(parseComma(baseSalary)) || 0) + (Number(parseComma(bonus)) || 0) + allowances.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const previewDeductions = (Number(parseComma(bhxh)) || 0) + (Number(parseComma(bhyt)) || 0) + (Number(parseComma(bhtn)) || 0) + (Number(parseComma(incomeTax)) || 0) + otherDeductions.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const previewNet = previewGross - previewDeductions;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!month || !receivedDate) return;

    const slip: SalarySlip = {
      id: editingSlip ? editingSlip.id : Date.now().toString(),
      month,
      receivedDate,
      companyName,
      paymentMethod,
      status,
      baseSalary: Number(parseComma(baseSalary)) || 0,
      allowances: allowances.filter(a => a.label.trim() && a.amount > 0),
      bonus: Number(parseComma(bonus)) || 0,
      bonusNote,
      bhxh: Number(parseComma(bhxh)) || 0,
      bhyt: Number(parseComma(bhyt)) || 0,
      bhtn: Number(parseComma(bhtn)) || 0,
      incomeTax: Number(parseComma(incomeTax)) || 0,
      otherDeductions: otherDeductions.filter(a => a.label.trim() && a.amount > 0),
      notes
    };

    if (editingSlip) {
      updateSalarySlip(slip);
    } else {
      addSalarySlip(slip);
    }
    setIsModalOpen(false);
  };

  // Stats Logic
  const sortedSlips = useMemo(() => {
    return [...salarySlips].sort((a, b) => b.month.localeCompare(a.month)); // newest first
  }, [salarySlips]);

  const latestSlip = sortedSlips[0];
  const latestNet = latestSlip ? calculateNet(latestSlip) : 0;

  const last6MonthsSlips = sortedSlips.slice(0, 6);
  const averageNet = last6MonthsSlips.length > 0
    ? last6MonthsSlips.reduce((sum, slip) => sum + calculateNet(slip), 0) / last6MonthsSlips.length
    : 0;

  const currentYearStr = new Date().getFullYear().toString();
  const currentYearTax = salarySlips
    .filter(s => s.month.startsWith(currentYearStr))
    .reduce((sum, slip) => sum + slip.incomeTax, 0);

  // Chart Logic (last 12 months)
  const chartData = useMemo(() => {
    const slips12 = sortedSlips.slice(0, 12).reverse(); // oldest first for chart
    return slips12.map(slip => ({
      name: slip.month,
      net: calculateNet(slip),
      gross: slip.baseSalary + slip.bonus + (slip.allowances?.reduce((sum, a) => sum + a.amount, 0) || 0)
    }));
  }, [sortedSlips]);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1 items-start">
          <h1 className="text-3xl sm:text-4xl font-extrabold animate-rainbow-text tracking-tight drop-shadow-sm pb-1">Quản lý Lương</h1>
          <p className="text-slate-600 font-medium text-lg">Theo dõi thu nhập cố định và các khoản trích nộp</p>
        </div>
        <Button onClick={openAddModal} className="flex items-center gap-2 whitespace-nowrap shadow-md">
          <Plus className="w-5 h-5" />
          Thêm Phiếu Lương
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-white/90 backdrop-blur-2xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_8px_40px_rgba(14,165,233,0.12)] transition-all duration-300 p-8 rounded-[24px] flex flex-col gap-2 relative overflow-hidden group hover:-translate-y-1 mt-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-100/50 rounded-full blur-[40px] -mr-10 -mt-10 opacity-60 group-hover:bg-sky-200/60 transition-colors pointer-events-none"></div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-sky-100 to-sky-50 text-sky-600 rounded-2xl shadow-inner border border-white/50 group-hover:scale-110 transition-transform duration-300">
                <Banknote className="w-6 h-6" />
              </div>
              <p className="font-bold text-slate-500 uppercase tracking-widest text-xs">Thực nhận gần nhất</p>
            </div>
          </div>
          <div className="relative z-10 flex flex-col mt-2">
             <p className="text-4xl lg:text-5xl font-extrabold text-sky-950 tracking-tight">{formatVND(latestNet)}</p>
             {latestSlip && (
               <p className="text-sm font-medium text-sky-700/70 mt-3 flex items-center gap-1.5"><Calendar className="w-4 h-4"/> Tháng {latestSlip.month}</p>
             )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/90 backdrop-blur-2xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_8px_40px_rgba(16,185,129,0.12)] transition-all duration-300 p-8 rounded-[24px] flex flex-col gap-2 relative overflow-hidden group hover:-translate-y-1 mt-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/50 rounded-full blur-[40px] -mr-10 -mt-10 opacity-60 group-hover:bg-emerald-200/60 transition-colors pointer-events-none"></div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 rounded-2xl shadow-inner border border-white/50 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-6 h-6" />
              </div>
              <p className="font-bold text-slate-500 uppercase tracking-widest text-xs">Trung bình 6 tháng</p>
            </div>
          </div>
          <div className="relative z-10 flex flex-col mt-2">
            <p className="text-4xl lg:text-5xl font-extrabold text-emerald-950 tracking-tight">{formatVND(averageNet)}</p>
            <p className="text-sm font-medium text-emerald-700/70 mt-3 flex items-center gap-1.5 opacity-0 invisible">Placeholder</p>
          </div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/90 backdrop-blur-2xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_8px_40px_rgba(244,63,94,0.12)] transition-all duration-300 p-8 rounded-[24px] flex flex-col gap-2 relative overflow-hidden group hover:-translate-y-1 mt-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-100/50 rounded-full blur-[40px] -mr-10 -mt-10 opacity-60 group-hover:bg-rose-200/60 transition-colors pointer-events-none"></div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-rose-100 to-rose-50 text-rose-600 rounded-2xl shadow-inner border border-white/50 group-hover:scale-110 transition-transform duration-300">
                <Receipt className="w-6 h-6" />
              </div>
              <p className="font-bold text-slate-500 uppercase tracking-widest text-xs">Thuế TNCN năm {currentYearStr}</p>
            </div>
          </div>
          <div className="relative z-10 flex flex-col mt-2">
            <p className="text-4xl lg:text-5xl font-extrabold text-rose-950 tracking-tight">{formatVND(currentYearTax)}</p>
             <p className="text-sm font-medium text-rose-700/70 mt-3 flex items-center gap-1.5 opacity-0 invisible">Placeholder</p>
          </div>
        </motion.div>
      </div>

      {chartData.length > 0 && (
        <div className="bg-white/90 backdrop-blur-2xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-6 md:p-8 rounded-[24px]">
          <h2 className="text-xl font-extrabold text-sky-950 mb-6 tracking-tight">Xu hướng Thực nhận (12 tháng)</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                <Tooltip 
                  formatter={(value: number) => formatVND(value)}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                />
                <Area type="monotone" dataKey="net" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorNet)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Slip List */}
      <div className="space-y-6">
        <h2 className="text-2xl font-extrabold text-sky-950 tracking-tight">Lịch sử Lương</h2>
        {sortedSlips.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-2xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-12 rounded-[24px] text-center flex flex-col items-center">
            <div className="p-5 bg-sky-50 rounded-full mb-4 group-hover:scale-110 transition-transform">
              <Banknote className="w-12 h-12 text-sky-300" />
            </div>
            <p className="text-lg font-bold text-slate-600 tracking-tight">Chưa có dữ liệu lương.</p>
            <p className="text-sm font-medium text-slate-500 mt-2">Bấm "Thêm Phiếu Lương" để bắt đầu theo dõi thu nhập của bạn.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimatePresence>
              {sortedSlips.map((slip) => {
                const gross = slip.baseSalary + slip.bonus + (slip.allowances?.reduce((sum, a) => sum + a.amount, 0) || 0);
                const deducts = slip.bhxh + slip.bhyt + slip.bhtn + slip.incomeTax + (slip.otherDeductions?.reduce((sum, a) => sum + a.amount, 0) || 0);
                const net = gross - deducts;
                
                return (
                  <motion.div key={slip.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white/90 backdrop-blur-xl p-6 md:p-8 rounded-[24px] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgb(14,165,233,0.08)] transition-all duration-300 flex flex-col relative group overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-sky-100/50 rounded-full blur-[40px] -mr-10 -mt-10 opacity-50 group-hover:bg-sky-200/50 transition-colors pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-100/50 rounded-full blur-[40px] -ml-10 -mb-10 opacity-50 group-hover:bg-indigo-200/50 transition-colors pointer-events-none"></div>
                    
                    <div className="flex justify-between items-start mb-6 relative z-10 border-b border-slate-100 pb-5">
                      <div>
                        {slip.companyName && (
                          <div className="flex items-center gap-1.5 text-sm font-bold text-indigo-600 mb-2">
                             <Building className="w-4 h-4" />
                             {slip.companyName}
                          </div>
                        )}
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">Tháng {slip.month}</h3>
                          {slip.status === 'received' ? (
                            <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200 shadow-sm">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Đã nhận
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-1 rounded-full border border-amber-200 shadow-sm">
                              <CircleDashed className="w-3.5 h-3.5" /> Chờ nhận
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-slate-500 flex items-center gap-2 mt-2">
                          <Calendar className="w-4 h-4" />
                          Ngày nhận: {parseDateSafe(slip.receivedDate).toLocaleDateString('vi-VN')}
                          <span className="text-slate-300">|</span>
                          {slip.paymentMethod === 'banking' ? 'Chuyển khoản' : 'Tiền mặt'}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditModal(slip)} className="p-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-sky-50 hover:text-sky-600 transition-colors shadow-sm">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => {
                          if (window.confirm('Bạn có chắc chắn muốn xóa phiếu lương này?')) deleteSalarySlip(slip.id);
                        }} className="p-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-colors shadow-sm">
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-2 text-sm text-slate-600 relative z-10 flex-1">
                      <div className="space-y-3 p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100/50 hover:border-emerald-200/60 transition-colors shadow-sm">
                        <p className="font-bold text-emerald-700 border-b border-emerald-100/60 pb-2 mb-3 tracking-tight uppercase text-xs flex items-center gap-1.5">
                           <Plus className="w-3.5 h-3.5" /> Khoản thu nhập
                        </p>
                        <div className="flex justify-between items-center bg-white/50 px-3 py-2 rounded-lg"><span>Lương cứng:</span> <span className="font-bold text-emerald-800">{formatVND(slip.baseSalary)}</span></div>
                        {slip.allowances?.map((a, i) => (
                           <div key={i} className="flex justify-between items-center px-3 py-1"><span>{a.label}:</span> <span className="font-semibold text-emerald-800">{formatVND(a.amount)}</span></div>
                        ))}
                        {slip.bonus > 0 && (
                          <div className="flex justify-between items-center px-3 py-1 mt-1 border-t border-emerald-100/50 pt-2">
                            <span title={slip.bonusNote} className="truncate max-w-[120px]">Thưởng {slip.bonusNote ? `(${slip.bonusNote})` : ''}:</span> 
                            <span className="font-bold text-emerald-800">+{formatVND(slip.bonus)}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3 p-4 bg-rose-50/40 rounded-2xl border border-rose-100/50 hover:border-rose-200/60 transition-colors shadow-sm">
                         <p className="font-bold text-rose-700 border-b border-rose-100/60 pb-2 mb-3 tracking-tight uppercase text-xs flex items-center gap-1.5">
                            <DollarSign className="w-3.5 h-3.5" /> Khoản trích trừ
                         </p>
                        {slip.bhxh > 0 && <div className="flex justify-between items-center px-3 py-1"><span>BHXH (8%):</span> <span className="font-semibold text-rose-800">-{formatVND(slip.bhxh)}</span></div>}
                        {slip.bhyt > 0 && <div className="flex justify-between items-center px-3 py-1"><span>BHYT (1.5%):</span> <span className="font-semibold text-rose-800">-{formatVND(slip.bhyt)}</span></div>}
                        {slip.bhtn > 0 && <div className="flex justify-between items-center px-3 py-1"><span>BHTN (1%):</span> <span className="font-semibold text-rose-800">-{formatVND(slip.bhtn)}</span></div>}
                        {slip.incomeTax > 0 && <div className="flex justify-between items-center bg-white/50 px-3 py-2 rounded-lg mt-1"><span>Thuế TNCN:</span> <span className="font-bold text-rose-800">-{formatVND(slip.incomeTax)}</span></div>}
                        {slip.otherDeductions?.map((d, i) => (
                           <div key={i} className="flex justify-between items-center px-3 py-1"><span className="truncate max-w-[100px]">{d.label}:</span> <span className="font-semibold text-rose-800">-{formatVND(d.amount)}</span></div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 pt-5 flex items-center justify-between border-t border-slate-100 relative z-10 rounded-b-2xl bg-gradient-to-r from-sky-50 to-indigo-50/30 -mx-6 md:-mx-8 -mb-6 md:-mb-8 px-6 md:px-8 pb-6 md:pb-8">
                      <span className="text-slate-600 font-bold uppercase tracking-wider text-xs">Thực nhận</span>
                      <span className="text-3xl font-extrabold text-indigo-600 drop-shadow-sm">{formatVND(net)}</span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSlip ? 'Cập nhật Phiếu Lương' : 'Thêm Phiếu Lương'} maxWidth="3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Tháng lương</label>
              <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Tên công ty (Tùy chọn)</label>
              <Input type="text" placeholder="Tên công ty..." value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </div>
            <div>
               <label className="block text-sm font-semibold text-slate-700 mb-1">Ngày nhận (dự kiến / thực tế)</label>
              <Input type="date" value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} required />
            </div>
            <div>
               <label className="block text-sm font-semibold text-slate-700 mb-1">Trạng thái</label>
               <select 
                  className="w-full h-11 px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white shadow-sm transition-all text-sm font-medium outline-none text-slate-700 appearance-none"
                  value={status} onChange={(e) => setStatus(e.target.value as 'received' | 'pending')}
               >
                  <option value="received">Đã nhận</option>
                  <option value="pending">Chờ nhận</option>
               </select>
            </div>
             <div className="md:col-span-2">
               <label className="block text-sm font-semibold text-slate-700 mb-1">Hình thức</label>
               <select 
                  className="w-full h-11 px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white shadow-sm transition-all text-sm font-medium outline-none text-slate-700 appearance-none"
                  value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as 'banking' | 'cash')}
               >
                  <option value="banking">Chuyển khoản</option>
                  <option value="cash">Tiền mặt</option>
               </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-700 font-bold border-b border-emerald-100 pb-2">
                <Plus className="w-5 h-5" /> KHOẢN CỘNG (THU NHẬP)
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Lương cơ bản (Gross)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">đ</span>
                  <Input type="text" className="pl-10 text-emerald-900 font-bold bg-emerald-50/30" value={baseSalary} onChange={(e) => setBaseSalary(formatComma(e.target.value))} placeholder="VD: 20,000,000" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1 flex justify-between items-center">
                  Các Phụ cấp
                  <button type="button" onClick={handleAddAllowance} className="text-xs text-sky-600 font-bold bg-sky-50 px-2 py-1 rounded-md hover:bg-sky-100 transition-colors">+ Thêm</button>
                </label>
                {allowances.map((item, index) => (
                  <div key={index} className="flex gap-2 items-center">
                     <Input placeholder="Tên phụ cấp (vd: Ăn trưa)" value={item.label} onChange={(e) => handleUpdateAllowance(index, 'label', e.target.value)} className="flex-1 text-sm h-10" />
                     <Input type="text" placeholder="Số tiền" value={item.amount === 0 ? '' : formatComma(item.amount)} onChange={(e) => handleUpdateAllowance(index, 'amount', e.target.value)} className="w-32 text-sm h-10" />
                     <button type="button" onClick={() => handleRemoveAllowance(index)} className="p-2 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors"><Trash className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Thưởng (nếu có)</label>
                <div className="flex gap-2">
                   <Input type="text" placeholder="Số tiền" className="w-1/3" value={bonus} onChange={(e) => setBonus(formatComma(e.target.value))} />
                   <Input placeholder="Ghi chú thưởng (vd: Thưởng dự án X)" className="flex-1" value={bonusNote} onChange={(e) => setBonusNote(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
               <div className="flex items-center justify-between text-rose-700 font-bold border-b border-rose-100 pb-2">
                <div className="flex items-center gap-2"><DollarSign className="w-5 h-5" /> KHOẢN TRỪ (ĐÓNG GÓP)</div>
                <button type="button" onClick={autoFillInsurances} title="Tự động tính BHXH (8%), BHYT (1.5%), BHTN (1%) dựa trên lương cơ bản" className="text-xs bg-rose-50 text-rose-600 px-2 py-1 rounded-md hover:bg-rose-100 font-bold flex items-center gap-1 transition-colors"><Calculator className="w-3 h-3"/> Tạm tính BH</button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                   <label className="block text-xs font-semibold text-slate-500 mb-1">BHXH (8%)</label>
                   <Input type="text" className="h-10 text-sm" value={bhxh} onChange={(e) => setBhxh(formatComma(e.target.value))} />
                </div>
                <div>
                   <label className="block text-xs font-semibold text-slate-500 mb-1">BHYT (1.5%)</label>
                   <Input type="text" className="h-10 text-sm" value={bhyt} onChange={(e) => setBhyt(formatComma(e.target.value))} />
                </div>
                <div>
                   <label className="block text-xs font-semibold text-slate-500 mb-1">BHTN (1%)</label>
                   <Input type="text" className="h-10 text-sm" value={bhtn} onChange={(e) => setBhtn(formatComma(e.target.value))} />
                </div>
              </div>

               <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Thuế TNCN</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">đ</span>
                  <Input type="text" className="pl-10 text-rose-900 font-bold bg-rose-50/30" value={incomeTax} onChange={(e) => setIncomeTax(formatComma(e.target.value))} />
                </div>
              </div>

               <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1 flex justify-between items-center">
                  Khấu trừ khác
                  <button type="button" onClick={handleAddDeduction} className="text-xs text-sky-600 font-bold bg-sky-50 px-2 py-1 rounded-md hover:bg-sky-100 transition-colors">+ Thêm</button>
                </label>
                {otherDeductions.map((item, index) => (
                  <div key={index} className="flex gap-2 items-center">
                     <Input placeholder="Lý do" value={item.label} onChange={(e) => handleUpdateDeduction(index, 'label', e.target.value)} className="flex-1 text-sm h-10" />
                     <Input type="text" placeholder="Số tiền" value={item.amount === 0 ? '' : formatComma(item.amount)} onChange={(e) => handleUpdateDeduction(index, 'amount', e.target.value)} className="w-32 text-sm h-10" />
                     <button type="button" onClick={() => handleRemoveDeduction(index)} className="p-2 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors"><Trash className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="bg-sky-50 rounded-2xl p-6 border border-sky-100 flex flex-col md:flex-row justify-between items-center gap-4">
             <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Tạm tính Thực nhận</p>
                <div className="flex items-center gap-3">
                   <span className="text-sm font-semibold text-emerald-600" title="Gross">+{formatVND(previewGross)}</span>
                   <span className="text-slate-300">-</span>
                   <span className="text-sm font-semibold text-rose-600" title="Deductions">-{formatVND(previewDeductions)}</span>
                </div>
             </div>
             <p className="text-4xl font-extrabold text-sky-600 tracking-tight">{formatVND(previewNet)}</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button type="submit">Lưu Phiếu Lương</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
