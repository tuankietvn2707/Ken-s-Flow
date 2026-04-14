import React, { useState, useRef } from 'react';
import { Student, ClassSession, formatVND, parseDateSafe } from '../types';
import { CheckCircle, X, Download, RotateCcw } from 'lucide-react';
import { toPng } from 'html-to-image';
import { motion } from 'motion/react';

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
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex justify-between items-center"
      >
        <h1 className="text-2xl font-bold text-slate-900">Quản lý Tài chính</h1>
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-[20px] shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-slate-100">
            <span className="text-sm text-slate-500 mr-2">Số tiền có thể thu:</span>
            <span className="text-lg font-bold text-emerald-600">{formatVND(totalPotentialRevenue)}</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-[20px] shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-slate-100">
            <span className="text-sm text-slate-500 mr-2">Chờ Thanh Toán:</span>
            <span className="text-lg font-bold text-rose-600">{formatVND(totalOutstanding)}</span>
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white shadow-[0_10px_30px_rgba(0,0,0,0.04)] rounded-[20px] border border-slate-100 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Học viên</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Học phí/Buổi</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Số buổi chưa thu</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Số tiền có thể thu</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Chờ Thanh Toán</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {allFinancials.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                    Chưa có học viên nào. Vui lòng thêm học viên để theo dõi tài chính.
                  </td>
                </tr>
              ) : (
                allFinancials.map(({ student, totalUnpaidSessions, totalOwed, potentialRevenue, unpaidClassIds, unpaidClasses, hasPaidClasses }) => (
                  <tr key={student.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{student.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {formatVND(student.fee)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        totalUnpaidSessions > 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {totalUnpaidSessions} / {student.feeCycle} buổi
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="badge-success">
                        {formatVND(potentialRevenue)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={totalOwed > 0 ? 'badge-danger' : 'badge-neutral'}>
                        {formatVND(totalOwed)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => undoLastPayment(student.id)}
                          disabled={!hasPaidClasses}
                          title="Hoàn tác lần thanh toán gần nhất"
                          className={`inline-flex items-center px-2 py-1.5 text-xs font-medium rounded shadow-sm transition-colors ${
                            hasPaidClasses
                              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200'
                              : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-50'
                          }`}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMarkAsPaid(student, unpaidClassIds, totalUnpaidSessions, potentialRevenue, totalOwed, unpaidClasses)}
                          disabled={totalOwed === 0}
                          className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded shadow-sm ${
                            totalOwed > 0 
                              ? 'btn-modern-success' 
                              : 'btn-modern-disabled'
                          }`}
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                          Đã thanh toán
                        </button>
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
      {isReceiptModalOpen && receiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Biên lai thanh toán</h3>
              <button 
                onClick={() => setIsReceiptModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Content to be captured */}
            <div className="p-6 bg-slate-50 flex-1 overflow-y-auto">
              <div 
                ref={receiptRef} 
                className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden"
              >
                {/* Decorative top bar */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400"></div>
                
                <div className="text-center mb-8 mt-2">
                  <h2 className="text-3xl font-black text-slate-800 tracking-tight">English Tutor</h2>
                  <h3 className="text-xl font-bold text-slate-700 mt-1">Receipt</h3>
                  <p className="text-sm text-slate-400 italic mt-2">Biên lai thanh toán học phí</p>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-end border-b border-slate-100 pb-4">
                    <div className="text-slate-500 text-sm">Học viên</div>
                    <div className="font-bold text-lg text-slate-800">{receiptData.student.name}</div>
                  </div>

                  <div className="flex justify-between items-end border-b border-slate-100 pb-4">
                    <div className="text-slate-500 text-sm">Tổng số tiền</div>
                    <div className="font-black text-2xl text-emerald-600">{formatVND(receiptData.totalOwed)}</div>
                  </div>

                  <div className="pt-2 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Số buổi đã học:</span>
                      <span className="font-medium text-slate-800">{receiptData.totalUnpaidSessions} / {receiptData.student.feeCycle}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Đơn giá:</span>
                      <span className="font-medium text-slate-800">{formatVND(receiptData.student.fee)} / buổi</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Ngày thanh toán:</span>
                      <span className="font-medium text-slate-800">
                        {new Date().toLocaleDateString('vi-VN', { 
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Class Dates Details */}
                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">Chi tiết các buổi học:</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                      {[...receiptData.unpaidClasses]
                        .sort((a, b) => {
                          return parseDateSafe(a.date).getTime() - parseDateSafe(b.date).getTime();
                        })
                        .map((c, index) => (
                        <div key={c.id} className="flex justify-between text-sm">
                          <span className="text-slate-500">Buổi {index + 1}</span>
                          <span className="font-medium text-slate-800">
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
                <div className="mt-10 pt-6 border-t border-dashed border-slate-200 text-center space-y-2">
                  <p className="text-sm text-slate-600 italic">
                    Chúc {getPronoun(receiptData.student.birthYear, receiptData.student.gender)} luôn giữ vững tinh thần học tập thật tốt nhé!
                  </p>
                  <p className="text-xs text-slate-400 italic">
                    Cảm ơn {getPronoun(receiptData.student.birthYear, receiptData.student.gender)} đã đồng hành cùng Võ Nguyễn Tuấn Kiệt - Your English Tutor.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3">
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Đóng
              </button>
              <button
                onClick={handleDownloadReceipt}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                Tải xuống biên lai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
