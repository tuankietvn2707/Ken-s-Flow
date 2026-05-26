import React, { useState, useRef } from 'react';
import { Student, ClassSession, formatVND, parseDateSafe } from '../types';
import { CheckCircle, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from './ui/Button';
import ReceiptModal from './ReceiptModal';
import SuccessAnimation from './SuccessAnimation';

interface Props {
  students: Student[];
  classes: ClassSession[];
  markClassesAsPaid: (studentId: string, classIds: string[], studentName: string, amount: number, unpaidSessions: number) => void;
  undoLastPayment: (studentId: string) => void;
}

export default function FinancialTracking({ students, classes, markClassesAsPaid, undoLastPayment }: Props) {
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    student: Student;
    totalUnpaidSessions: number;
    potentialRevenue: number;
    totalOwed: number;
    unpaidClassIds: string[];
    unpaidClasses: ClassSession[];
  } | null>(null);
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);

  const getPronoun = (birthYear: number | '', gender?: string) => {
    if (!birthYear) return 'bạn';
    const year = Number(birthYear);
    if (isNaN(year)) return 'bạn';
    
    if (year < 2004) {
      return gender === 'Nam' ? 'anh' : (gender === 'Nữ' ? 'chị' : 'anh/chị');
    } else if (year === 2004) {
      return 'bạn';
    } else {
      return 'em';
    }
  };
  
  const allFinancials = students.filter(s => s.status !== 'inactive').map(student => {
    const studentClasses = classes.filter(c => c.studentId === student.id);
    const unpaidClasses = studentClasses.filter(c => !c.isPaid);
    const hasPaidClasses = studentClasses.some(c => c.isPaid && c.paymentBatchId);
    
    const totalUnpaidSessions = unpaidClasses.reduce((sum, c) => sum + c.duration, 0);
    const totalOwed = totalUnpaidSessions * student.fee;
    
    const feeCycle = student.feeCycle || 8;
    const potentialRevenue = (student.fee || 0) * feeCycle;
    
    return {
      student,
      totalUnpaidSessions,
      totalOwed,
      potentialRevenue,
      unpaidClassIds: unpaidClasses.map(c => c.id),
      unpaidClasses,
      hasPaidClasses
    };
  });

  const getDynamicSessionStyle = (unpaid: number, total: number) => {
    if (!total || total <= 0) return {};
    const ratio = Math.min(unpaid / total, 1);
    
    // Nếu đạt mức tối đa (8/8 hoặc 12/12) -> Xanh pastel tươi mới
    if (ratio === 1) {
      return {
        backgroundColor: '#e0f2fe', // sky-100
        color: '#0284c7', // sky-600
        borderColor: '#7dd3fc', // sky-300
        boxShadow: '0 0 12px rgba(56,189,248,0.5)'
      };
    }
    
    // Từ 0 (Đỏ) -> Xanh nước biển (220-240)
    // Sử dụng HSL để chuyển màu mượt mà theo tỷ lệ
    const hue = Math.floor(ratio * 220); 
    
    return {
      backgroundColor: `hsl(${hue}, 100%, 96%)`,
      color: `hsl(${hue}, 75%, 45%)`,
      borderColor: `hsl(${hue}, 85%, 85%)`
    };
  };

  const handleMarkAsPaid = (
    student: Student, 
    unpaidClassIds: string[], 
    totalUnpaidSessions: number, 
    potentialRevenue: number,
    totalOwed: number,
    unpaidClasses: ClassSession[]
  ) => {
    if (unpaidClassIds.length === 0) {
      return;
    }
    
    // 1. Cập nhật dữ liệu Firestore
    markClassesAsPaid(student.id, unpaidClassIds, student.name, totalOwed, totalUnpaidSessions);

    // 2. Prepare receipt data but don't show modal yet
    setReceiptData({
      student,
      totalUnpaidSessions,
      potentialRevenue,
      totalOwed,
      unpaidClassIds,
      unpaidClasses
    });

    // 3. Show Celebration Animation
    setShowSuccessAnim(true);
  };

  const totalOutstanding = allFinancials.reduce((sum, f) => sum + f.totalOwed, 0);
  const totalPotentialRevenue = allFinancials.reduce((sum, f) => sum + f.potentialRevenue, 0);

  return (
    <div className="space-y-8 pb-10">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div className="flex flex-col gap-1 items-start">
          <h1 className="text-3xl sm:text-4xl font-extrabold animate-rainbow-text tracking-tight drop-shadow-sm pb-1">Quản lý Tài chính</h1>
          <p className="text-sky-700/80 font-medium text-lg">Theo dõi công nợ và thu học phí</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-2 sm:mt-0">
          <div className="px-6 py-4 bg-white/90 rounded-[24px] shadow-sm border border-sky-100 flex flex-col items-start min-w-[200px]">
            <span className="text-[11px] font-bold text-emerald-600/80 uppercase tracking-widest mb-1">Số tiền có thể thu</span>
            <span className="text-2xl font-extrabold text-emerald-600 tracking-tight">{formatVND(totalPotentialRevenue)}</span>
          </div>
          <div className="px-6 py-4 bg-white/90 rounded-[24px] shadow-sm border border-rose-100 flex flex-col items-start min-w-[200px]">
            <span className="text-[11px] font-bold text-rose-600/80 uppercase tracking-widest mb-1">Chờ Thanh Toán</span>
            <span className="text-2xl font-extrabold text-rose-600 tracking-tight">{formatVND(totalOutstanding)}</span>
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        className="bg-white/40 backdrop-blur-md rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-white/60 overflow-hidden relative"
      >
        <div className="bg-noise rounded-[32px]"></div>
        <div className="overflow-x-auto relative z-10">
          <table className="min-w-full border-collapse">
            <thead className="bg-white/40 border-b border-sky-100/50 backdrop-blur-md sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-6 py-5 text-left text-[0.7rem] font-bold text-sky-600/80 uppercase tracking-widest">Học viên</th>
                <th scope="col" className="px-6 py-5 text-left text-[0.7rem] font-bold text-sky-600/80 uppercase tracking-widest">Học phí/Buổi</th>
                <th scope="col" className="px-6 py-5 text-left text-[0.7rem] font-bold text-sky-600/80 uppercase tracking-widest">Số buổi chưa thu</th>
                <th scope="col" className="px-6 py-5 text-left text-[0.7rem] font-bold text-sky-600/80 uppercase tracking-widest">Số tiền có thể thu</th>
                <th scope="col" className="px-6 py-5 text-left text-[0.7rem] font-bold text-sky-600/80 uppercase tracking-widest">Chờ Thanh Toán</th>
                <th scope="col" className="px-6 py-5 text-right text-[0.7rem] font-bold text-sky-600/80 uppercase tracking-widest">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-50/50">
              {allFinancials.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm font-medium text-sky-700/60" >
                    Chưa có học viên nào. Vui lòng thêm học viên để theo dõi tài chính.
                  </td>
                </tr>
              ) : (
                allFinancials.map(({ student, totalUnpaidSessions, totalOwed, potentialRevenue, unpaidClassIds, unpaidClasses, hasPaidClasses }) => (
                  <tr key={student.id} className="group hover:bg-white/80 hover:shadow-[0_4px_24px_rgba(14,165,233,0.06)] transition-all duration-300 relative z-0 hover:z-10 bg-transparent">
                    <td className="px-6 py-5 whitespace-nowrap border-b border-sky-50/50">
                      <div className="text-[15px] font-extrabold text-sky-950 tracking-tight">{student.name}</div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-[14px] font-semibold text-sky-700/80 border-b border-sky-50/50">
                      {formatVND(student.fee)}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap border-b border-sky-50/50">
                      <div className="flex flex-col gap-2">
                        <span 
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border shadow-sm backdrop-blur-sm transition-all duration-300 w-fit"
                          style={getDynamicSessionStyle(totalUnpaidSessions, student.feeCycle || 8)}
                        >
                          {totalUnpaidSessions} / {student.feeCycle || 8} buổi
                        </span>
                        {/* Gradient Progress Bar */}
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((totalUnpaidSessions / (student.feeCycle || 8)) * 100, 100)}%` }}
                            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              background: totalUnpaidSessions >= (student.feeCycle || 8)
                                ? 'linear-gradient(90deg, #38bdf8, #06b6d4, #2dd4bf)'
                                : `linear-gradient(90deg, hsl(${Math.floor(Math.min(totalUnpaidSessions / (student.feeCycle || 8), 1) * 220)}, 85%, 55%), hsl(${Math.floor(Math.min(totalUnpaidSessions / (student.feeCycle || 8), 1) * 220 + 20)}, 80%, 60%))`,
                              boxShadow: totalUnpaidSessions >= (student.feeCycle || 8)
                                ? '0 0 12px rgba(56,189,248,0.5)'
                                : 'none'
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap border-b border-sky-50/50">
                      <div className="bg-emerald-50 text-emerald-700 border-emerald-200/50 border px-3 py-1 rounded-full text-xs font-bold shadow-sm inline-flex items-center">
                        {formatVND(potentialRevenue)}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap border-b border-sky-50/50">
                       <div className={`${totalOwed > 0 ? 'bg-rose-50 text-rose-700 border-rose-200/50' : 'bg-gray-100/80 text-gray-700 font-semibold border-gray-200/50'} border px-3 py-1 rounded-full text-xs font-bold shadow-sm inline-flex items-center`}>
                        {formatVND(totalOwed)}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium border-b border-sky-50/50">
                      <div className="flex items-center justify-end gap-2 opacity-100 transition-opacity duration-300">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            undoLastPayment(student.id);
                          }}
                          disabled={!hasPaidClasses}
                          title="Hoàn tác lần thanh toán gần nhất"
                          className="h-9 w-9 text-sky-500 hover:text-sky-600 hover:bg-sky-50 bg-white/50 backdrop-blur-sm border border-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-300 rounded-[14px]"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant={unpaidClasses.length > 0 ? 'default' : 'secondary'}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (unpaidClasses.length === 0) {
                              return;
                            }
                            handleMarkAsPaid(student, unpaidClassIds, totalUnpaidSessions, potentialRevenue, totalOwed, unpaidClasses);
                          }}
                          disabled={unpaidClasses.length === 0}
                          className={`rounded-[14px] shadow-[0_4px_16px_rgba(14,165,233,0.3)] hover:shadow-[0_8px_24px_rgba(14,165,233,0.4)] ${unpaidClasses.length > 0 ? 'bg-sky-500 hover:bg-sky-600 text-white' : 'bg-white/50 text-sky-800'}`}
                        >
                          <CheckCircle className="w-4 h-4 mr-1.5" />
                          Đã thanh toán
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <ReceiptModal 
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        receiptData={receiptData}
        getPronoun={getPronoun}
      />

      <SuccessAnimation 
        isVisible={showSuccessAnim} 
        onComplete={() => {
          setShowSuccessAnim(false);
          setIsReceiptModalOpen(true);
        }} 
      />
    </div>
  );
}
