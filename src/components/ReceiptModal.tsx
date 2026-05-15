import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Share2, Printer, Wallet, CalendarDays, Receipt, CreditCard, CheckCircle2, BookOpen } from 'lucide-react';
import { Student, ClassSession, formatVND, parseDateSafe } from '../types';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

interface ReceiptData {
  student: Student;
  totalUnpaidSessions: number;
  potentialRevenue: number;
  totalOwed: number;
  unpaidClassIds: string[];
  unpaidClasses: ClassSession[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  receiptData: ReceiptData | null;
  getPronoun: (birthYear: number | '', gender?: string) => string;
}

export default function ReceiptModal({ isOpen, onClose, receiptData, getPronoun }: Props) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !receiptData) return null;

  const handleDownloadImage = async () => {
    if (receiptRef.current === null) return;
    try {
      const dataUrl = await toPng(receiptRef.current, { cacheBust: true, pixelRatio: 3, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `BienLai_${receiptData.student.name.replace(/\s+/g, '_')}_${new Date().getTime()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Lỗi khi tạo ảnh biên lai:', err);
    }
  };

  const handlePrint = async () => {
    if (receiptRef.current === null) return;
    try {
      const width = receiptRef.current.offsetWidth;
      const height = receiptRef.current.offsetHeight;
      
      const dataUrl = await toPng(receiptRef.current, { cacheBust: true, pixelRatio: 2, backgroundColor: '#ffffff' });
      
      const pdf = new jsPDF({
        orientation: width > height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [width, height]
      });
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
      pdf.save(`BienLai_${receiptData.student.name.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
    } catch (err) {
      console.error('Lỗi khi tạo PDF:', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share && receiptRef.current) {
      try {
        const dataUrl = await toPng(receiptRef.current, { cacheBust: true, pixelRatio: 2, backgroundColor: '#ffffff' });
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], 'receipt.png', { type: blob.type });
        await navigator.share({
          title: 'Biên lai thanh toán học phí',
          files: [file],
        });
      } catch (err) {
        console.error('Error sharing', err);
      }
    }
  };

  const sortedClasses = [...receiptData.unpaidClasses].sort((a, b) => {
    return parseDateSafe(a.date).getTime() - parseDateSafe(b.date).getTime();
  });

  const transactionId = `TF-${new Date().getTime().toString().slice(-6)}`;
  const paymentDate = new Date();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 print:p-0 print:block">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-sky-950/40 backdrop-blur-md print:hidden"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full max-w-[720px] bg-white/70 backdrop-blur-2xl rounded-[32px] shadow-[0_24px_80px_-12px_rgba(14,165,233,0.2)] border border-white max-h-[90vh] flex flex-col print:shadow-none print:max-h-none print:h-auto print:border-none print:bg-white"
          >
            {/* Close Button */}
            <div className="absolute -top-4 -right-4 z-10 print:hidden">
              <button
                onClick={onClose}
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border border-sky-100 text-sky-400 hover:text-sky-600 hover:bg-sky-50 transition-all duration-300 hover:scale-110 hover:rotate-90 group"
              >
                <X className="w-5 h-5 group-hover:drop-shadow-md" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar print:overflow-visible print:p-0">
              {/* === RECEIPT CARD === */}
              <div ref={receiptRef} className="bg-white rounded-[24px] shadow-sm border border-sky-50 overflow-hidden relative print:shadow-none print:border-none">
                {/* Header Gradient Line */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-500"></div>
                
                <div className="p-6 sm:p-10">
                  {/* Top Header */}
                  <div className="flex justify-between items-start mb-10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white font-black text-2xl">
                        T
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-sky-950 tracking-tight">TutorFlow</h2>
                        <p className="text-sm font-medium text-sky-600/70">English Tutoring Services</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 font-bold text-sm mb-2 shadow-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        ĐÃ THANH TOÁN
                      </div>
                      <div className="text-sm font-medium text-sky-900/40">Mã GD: #{transactionId}</div>
                    </div>
                  </div>

                  {/* Student Info */}
                  <div className="bg-gradient-to-br from-sky-50/50 to-white rounded-2xl p-5 border border-sky-100/50 flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 border-2 border-white shadow-sm overflow-hidden flex-shrink-0">
                      {receiptData.student.gender === 'Nam' ? (
                        <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${receiptData.student.name}&backgroundColor=bae6fd`} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${receiptData.student.name}&backgroundColor=fbcfe8`} alt="Avatar" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-sky-950">{receiptData.student.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <BookOpen className="w-3.5 h-3.5 text-sky-600/60" />
                        <span className="text-sm font-medium text-sky-600/80">English Speaking Class</span>
                      </div>
                    </div>
                  </div>

                  {/* Total Amount Focus */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[20px] p-6 text-white shadow-lg shadow-emerald-500/20 mb-8">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-teal-400/20 rounded-full blur-xl"></div>
                    
                    <div className="relative z-10 flex items-center gap-2 opacity-90 mb-1">
                      <Wallet className="w-4 h-4" />
                      <span className="text-sm font-medium uppercase tracking-wider">Tổng Thanh Toán</span>
                    </div>
                    <div className="relative z-10 text-4xl sm:text-5xl font-black tracking-tight drop-shadow-sm">
                      {formatVND(receiptData.totalOwed)}
                    </div>
                  </div>

                  {/* Payment Details Grid */}
                  <h4 className="text-sm font-extrabold text-sky-900/50 uppercase tracking-widest mb-4">Chi tiết thanh toán</h4>
                  <div className="grid grid-cols-2 gap-3 mb-8">
                    <div className="bg-sky-50/50 rounded-xl p-4 border border-sky-100/50 flex flex-col gap-1 hover:bg-sky-50 transition-colors">
                      <div className="flex items-center gap-1.5 text-sky-600/70 mb-1">
                        <CalendarDays className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium uppercase tracking-wide">Số buổi</span>
                      </div>
                      <div className="font-extrabold text-sky-950 text-lg">{receiptData.totalUnpaidSessions} <span className="text-sm font-bold text-sky-900/50">/ {receiptData.student.feeCycle}</span></div>
                    </div>
                    
                    <div className="bg-sky-50/50 rounded-xl p-4 border border-sky-100/50 flex flex-col gap-1 hover:bg-sky-50 transition-colors">
                      <div className="flex items-center gap-1.5 text-sky-600/70 mb-1">
                        <Receipt className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium uppercase tracking-wide">Đơn giá</span>
                      </div>
                      <div className="font-extrabold text-sky-950 text-lg">{formatVND(receiptData.student.fee)}</div>
                    </div>

                    <div className="bg-sky-50/50 rounded-xl p-4 border border-sky-100/50 flex flex-col gap-1 mt-1 hover:bg-sky-50 transition-colors">
                      <div className="flex items-center gap-1.5 text-sky-600/70 mb-1">
                        <CreditCard className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium uppercase tracking-wide">Phương thức</span>
                      </div>
                      <div className="font-extrabold text-sky-950 text-md">Chuyển khoản / Tiền mặt</div>
                    </div>

                    <div className="bg-sky-50/50 rounded-xl p-4 border border-sky-100/50 flex flex-col gap-1 mt-1 hover:bg-sky-50 transition-colors">
                      <div className="flex items-center gap-1.5 text-sky-600/70 mb-1">
                        <CalendarDays className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium uppercase tracking-wide">Ngày thu</span>
                      </div>
                      <div className="font-extrabold text-sky-950 text-md">
                        {paymentDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </div>
                    </div>
                  </div>

                  {/* Sessions Timeline */}
                  <h4 className="text-sm font-extrabold text-sky-900/50 uppercase tracking-widest mb-4">Các buổi học ({sortedClasses.length})</h4>
                  <div className="space-y-3 mb-10">
                    {sortedClasses.map((c, index) => (
                      <div key={c.id} className="flex gap-4 p-3 rounded-xl hover:bg-sky-50/50 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-bold text-sm flex-shrink-0 shadow-sm border border-white">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-0.5">
                            <span className="font-bold text-sky-950 text-sm">
                              {!isNaN(parseDateSafe(c.date).getTime()) 
                                ? parseDateSafe(c.date).toLocaleDateString('vi-VN', {
                                    day: '2-digit', month: 'long', year: 'numeric'
                                  })
                                : 'Ngày không hợp lệ'}
                            </span>
                            <span className="text-xs font-extrabold bg-sky-50 text-sky-600 px-2 py-0.5 rounded-full border border-sky-100/50">
                              {c.duration} buổi
                            </span>
                          </div>
                          <p className="text-xs font-medium text-sky-900/60">
                            {c.topic || "Không có ghi chú chủ đề học"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="pt-8 border-t-2 border-dashed border-sky-100 pb-2">
                    <div className="flex flex-col items-center justify-center text-center">
                      <p className="text-[13px] font-bold text-sky-900 italic mb-1">"Keep learning, keep growing."</p>
                      <p className="text-[12px] font-medium text-sky-900/60 leading-relaxed max-w-[80%] mx-auto mb-6">
                        Chúc {getPronoun(receiptData.student.birthYear, receiptData.student.gender)} luôn giữ vững tinh thần học tập thật tốt. Cảm ơn đã đồng hành cùng TutorFlow.
                      </p>
                      
                      <div className="mt-2 mb-2 w-32 h-12 bg-[url('https://api.dicebear.com/7.x/initials/svg?seed=Tuấn Kiệt&fontFamily=Brush%20Script%20MT,cursive')] bg-contain bg-center bg-no-repeat opacity-60 mix-blend-multiply"></div>
                      <p className="text-sm font-extrabold text-sky-950 uppercase tracking-widest mt-1">Võ Nguyễn Tuấn Kiệt</p>
                      <p className="text-[11px] font-medium text-sky-900/40 mt-1">Generated at {paymentDate.toLocaleTimeString('vi-VN')} - {paymentDate.toLocaleDateString('vi-VN')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="bg-white/80 backdrop-blur-xl border-t border-sky-100 p-4 sm:px-8 sm:py-5 flex flex-col sm:flex-row gap-3 justify-end rounded-b-[32px] print:hidden">
              <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-sky-200 text-sky-700 font-bold hover:bg-sky-50 transition-colors shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span className="sm:hidden lg:inline">In PDF</span>
              </button>
              
              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-sky-200 text-sky-700 font-bold hover:bg-sky-50 transition-colors shadow-sm"
              >
                <Share2 className="w-4 h-4" />
                <span className="sm:hidden lg:inline">Chia sẻ</span>
              </button>

              <button
                onClick={handleDownloadImage}
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-bold hover:shadow-[0_8px_20px_rgba(14,165,233,0.3)] transition-all duration-300 hover:-translate-y-0.5 flex-1 sm:flex-none"
              >
                <Download className="w-4 h-4" />
                Tải biên lai
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
