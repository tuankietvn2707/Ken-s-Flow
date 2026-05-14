import React, { useState, useRef } from 'react';
import { Student, ClassSession, formatVND, parseDateSafe } from '../types';
import { CheckCircle, X, Download, RotateCcw } from 'lucide-react';
import { toPng } from 'html-to-image';
import { motion } from 'motion/react';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Modal } from './ui/Modal';
import { Badge } from './ui/Badge';

interface Props {
  students: Student[];
  classes: ClassSession[];
  markClassesAsPaid: (studentId: string, classIds: string[]) => void;
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
  const receiptRef = useRef<HTMLDivElement>(null);

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
    markClassesAsPaid(student.id, unpaidClassIds);

    // 2. Mở Modal Biên lai
    setReceiptData({
      student,
      totalUnpaidSessions,
      potentialRevenue,
      totalOwed,
      unpaidClassIds,
      unpaidClasses
    });
    setIsReceiptModalOpen(true);
  };

  const handleDownloadReceipt = async () => {
    if (receiptRef.current === null || !receiptData) {
      return;
    }

    try {
      const dataUrl = await toPng(receiptRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `BienLai_${receiptData.student.name.replace(/\s+/g, '_')}_${new Date().getTime()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Lỗi khi tạo ảnh biên lai:', err);
    }
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
          <h1 className="text-3xl sm:text-4xl font-extrabold text-sky-950 tracking-tight">Quản lý Tài chính</h1>
          <p className="text-sky-700/80 font-medium text-lg">Theo dõi công nợ và thu học phí</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-2 sm:mt-0">
          <div className="px-5 py-3 bg-white/60 backdrop-blur-md rounded-[20px] shadow-[0_4px_16px_rgba(14,165,233,0.04)] border border-white flex flex-col items-start min-w-[200px]">
            <span className="text-[11px] font-bold text-emerald-600/80 uppercase tracking-widest mb-1">Số tiền có thể thu</span>
            <span className="text-2xl font-extrabold text-emerald-600 tracking-tight">{formatVND(totalPotentialRevenue)}</span>
          </div>
          <div className="px-5 py-3 bg-white/60 backdrop-blur-md rounded-[20px] shadow-[0_4px_16px_rgba(244,63,94,0.04)] border border-white flex flex-col items-start min-w-[200px]">
            <span className="text-[11px] font-bold text-rose-600/80 uppercase tracking-widest mb-1">Chờ Thanh Toán</span>
            <span className="text-2xl font-extrabold text-rose-600 tracking-tight">{formatVND(totalOutstanding)}</span>
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        className="bg-white/40 backdrop-blur-2xl rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-white/60 overflow-hidden"
        
      >
        <div className="overflow-x-auto">
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
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border shadow-sm backdrop-blur-sm ${
                        totalUnpaidSessions > 0 ? 'bg-rose-50 text-rose-700 border-rose-200/50' : 'bg-sky-50 text-sky-700 border-sky-200/50'
                      }`}>
                        {totalUnpaidSessions} / {student.feeCycle} buổi
                      </span>
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
                          variant="ghost"
                          size="icon"
                          onClick={() => undoLastPayment(student.id)}
                          disabled={!hasPaidClasses}
                          title="Hoàn tác lần thanh toán gần nhất"
                          className="h-9 w-9 text-sky-500 hover:text-sky-600 hover:bg-sky-50 bg-white/50 backdrop-blur-sm border border-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-300 rounded-[14px]"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={totalOwed > 0 ? 'default' : 'secondary'}
                          onClick={() => handleMarkAsPaid(student, unpaidClassIds, totalUnpaidSessions, potentialRevenue, totalOwed, unpaidClasses)}
                          disabled={totalOwed === 0}
                          className={`rounded-[14px] shadow-[0_4px_16px_rgba(14,165,233,0.3)] hover:shadow-[0_8px_24px_rgba(14,165,233,0.4)] ${totalOwed > 0 ? 'bg-sky-500 hover:bg-sky-600 text-white' : 'bg-white/50 text-sky-800'}`}
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

      {/* Receipt Modal */}
      <Modal
        isOpen={isReceiptModalOpen && !!receiptData}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Biên lai thanh toán"
        maxWidth="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsReceiptModalOpen(false)}
            >
              Đóng
            </Button>
            <Button
              onClick={handleDownloadReceipt}
            >
              <Download className="w-4 h-4 mr-2" />
              Tải xuống biên lai
            </Button>
          </>
        }
      >
        {receiptData && (
          <div className="p-2">
            <div 
              ref={receiptRef} 
              className="glass rounded-3xl p-8 border border-sky-100 shadow-sm relative overflow-hidden"
            >
              {/* Decorative top bar */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400"></div>
              
              <div className="text-center mb-8 mt-2">
                <h2 className="text-3xl font-black text-sky-900 tracking-tight">English Tutor</h2>
                <h3 className="text-xl font-bold text-sky-900 mt-1">Receipt</h3>
                <p className="text-sm text-sky-700/80 italic mt-2">Biên lai thanh toán học phí</p>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-end border-b border-sky-100 pb-4">
                  <div className="text-sky-700/80 text-sm">Học viên</div>
                  <div className="font-bold text-lg text-sky-900">{receiptData.student.name}</div>
                </div>

                <div className="flex justify-between items-end border-b border-sky-100 pb-4">
                  <div className="text-sky-700/80 text-sm">Tổng số tiền</div>
                  <div className="font-black text-2xl text-emerald-600">{formatVND(receiptData.totalOwed)}</div>
                </div>

                <div className="pt-2 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-sky-700/80">Số buổi đã học:</span>
                    <span className="font-medium text-sky-900">{receiptData.totalUnpaidSessions} / {receiptData.student.feeCycle}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-sky-700/80">Đơn giá:</span>
                    <span className="font-medium text-sky-900">{formatVND(receiptData.student.fee)} / buổi</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-sky-700/80">Ngày thanh toán:</span>
                    <span className="font-medium text-sky-900">
                      {new Date().toLocaleDateString('vi-VN', { 
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                {/* Class Dates Details */}
                <div className="pt-4 border-t border-sky-100">
                  <h4 className="text-sm font-semibold text-sky-900 mb-3">Chi tiết các buổi học:</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {[...receiptData.unpaidClasses]
                      .sort((a, b) => {
                        return parseDateSafe(a.date).getTime() - parseDateSafe(b.date).getTime();
                      })
                      .map((c, index) => (
                      <div key={c.id} className="flex justify-between text-sm">
                        <span className="text-sky-700/80">Buổi {index + 1}</span>
                        <span className="font-medium text-sky-900">
                          {!isNaN(parseDateSafe(c.date).getTime()) 
                            ? parseDateSafe(c.date).toLocaleDateString('vi-VN', {
                                day: '2-digit', month: '2-digit', year: 'numeric'
                              })
                            : 'Ngày không hợp lệ'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer / Watermark */}
              <div className="mt-10 pt-6 border-t border-dashed border-sky-100 text-center space-y-2">
                <p className="text-sm text-sky-700/80 italic">
                  Chúc {getPronoun(receiptData.student.birthYear, receiptData.student.gender)} luôn giữ vững tinh thần học tập thật tốt nhé!
                </p>
                <p className="text-xs text-sky-700/80 italic">
                  Cảm ơn {getPronoun(receiptData.student.birthYear, receiptData.student.gender)} đã đồng hành cùng Võ Nguyễn Tuấn Kiệt - Your English Tutor.
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
