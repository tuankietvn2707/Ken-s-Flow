import React, { useState } from 'react';
import { Student, ClassSession, formatVND, parseDateSafe } from '../types';
import { BookOpen, Calendar, ChevronUp, ChevronDown } from 'lucide-react';
import { getAvatarColor } from './StudentManagementUtils';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Modal } from './ui/Modal';
import { motion } from 'motion/react';

interface Props {
  student: Student;
  classes: ClassSession[];
  onClose: () => void;
  onEdit: (student: Student) => void;
  markClassesAsPaid?: (studentId: string, classIds: string[]) => void;
}

export default function StudentDetail({ student, classes, onClose, onEdit, markClassesAsPaid }: Props) {
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths(prev => ({ ...prev, [monthKey]: !prev[monthKey] }));
  };

  const getUnpaidAmount = () => {
    const unpaidSessions = classes.filter(c => c.studentId === student.id && !c.isPaid);
    const totalDuration = unpaidSessions.reduce((sum, c) => sum + c.duration, 0);
    return totalDuration * student.fee;
  };

  const renderClassCard = (cls: ClassSession, idx: number, isPaid: boolean) => (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + (idx * 0.05), duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      key={cls.id}
    >
      <Card className="overflow-hidden border border-sky-100 shadow-[0_4px_16px_rgba(14,165,233,0.03)] bg-white/70 backdrop-blur-sm">
        <div className={`${isPaid ? 'bg-emerald-50/50 border-emerald-100/50' : 'bg-blue-50/50 border-blue-100/50'} px-6 py-4 border-b flex justify-between items-center`}>
          <div className={`font-bold ${isPaid ? 'text-emerald-900' : 'text-blue-900'}`}>
            Buổi {idx + 1} <span className="opacity-70 font-medium ml-2">({!isNaN(parseDateSafe(cls.date).getTime()) ? parseDateSafe(cls.date).toLocaleDateString('vi-VN') : 'Ngày không hợp lệ'})</span>
          </div>
          <div className={`text-sm font-bold px-3 py-1 rounded-full border ${isPaid ? 'text-emerald-700 bg-emerald-100/50 border-emerald-200' : 'text-blue-700 bg-blue-100/50 border-blue-200'} shadow-sm backdrop-blur-md`}>
            {cls.duration} buổi
          </div>
        </div>
        <CardContent className="p-6">
          <div className="mb-6 pb-6 border-b border-sky-100">
            <p className="text-[11px] font-bold text-sky-600/80 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              Chủ đề / Nội dung
            </p>
            <p className="text-sky-950 font-extrabold text-xl tracking-tight">{cls.topic || '—'}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-emerald-50/50 p-4 rounded-[20px] border border-emerald-100/50">
              <p className="text-[12px] font-bold text-emerald-700 mb-2 flex items-center gap-2 uppercase tracking-wide">👍 Điểm mạnh</p>
              <p className="text-[15px] font-medium text-sky-900 whitespace-pre-wrap">{cls.strengths || '—'}</p>
            </div>
            <div className="bg-rose-50/50 p-4 rounded-[20px] border border-rose-100/50">
              <p className="text-[12px] font-bold text-rose-700 mb-2 flex items-center gap-2 uppercase tracking-wide">👎 Điểm yếu</p>
              <p className="text-[15px] font-medium text-sky-900 whitespace-pre-wrap">{cls.weaknesses || '—'}</p>
            </div>
            <div className="bg-red-50/50 p-4 rounded-[20px] border border-red-100/50">
              <p className="text-[12px] font-bold text-red-700 mb-2 flex items-center gap-2 uppercase tracking-wide">❌ Các lỗi sai</p>
              <p className="text-[15px] font-medium text-sky-900 whitespace-pre-wrap">{cls.mistakes || '—'}</p>
            </div>
            <div className="bg-amber-50/50 p-4 rounded-[20px] border border-amber-100/50">
              <p className="text-[12px] font-bold text-amber-700 mb-2 flex items-center gap-2 uppercase tracking-wide">🛠️ Cách khắc phục</p>
              <p className="text-[15px] font-medium text-sky-900 whitespace-pre-wrap">{cls.remedies || '—'}</p>
            </div>
            <div className="md:col-span-2 lg:col-span-2 bg-sky-50/50 p-4 rounded-[20px] border border-sky-100/50">
              <p className="text-[12px] font-bold text-sky-700 mb-2 flex items-center gap-2 uppercase tracking-wide">📝 Kế hoạch buổi tiếp theo</p>
              <p className="text-[15px] font-medium text-sky-900 whitespace-pre-wrap">{cls.nextLessonPrep || '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Hồ sơ: ${student.name}`}
      maxWidth="3xl"
    >
      <div className="space-y-8 flex-1">
        <div className="flex justify-between items-center bg-white/60 backdrop-blur-md px-6 py-4 rounded-3xl border border-white shadow-[0_4px_16px_rgba(14,165,233,0.04)] mb-8">
           <div className="flex items-center gap-3">
             <div className="flex flex-col">
               <span className="text-sm font-semibold text-sky-800">Thao tác</span>
             </div>
           </div>
           <Button
            variant="secondary"
            className="rounded-[14px]"
            onClick={() => {
              onClose();
              onEdit(student);
            }}
           >
            Sửa hồ sơ
           </Button>
        </div>

        <Card className="p-8 bg-white/60 backdrop-blur-sm border-white shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[32px]">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
            <div className={`h-24 w-24 rounded-[24px] flex items-center justify-center font-bold text-4xl shrink-0 shadow-[0_8px_24px_rgba(0,0,0,0.06)] border border-white/60 backdrop-blur-md transition-transform hover:scale-105 duration-300 ${getAvatarColor(student.id)}`}>
              {student.firstName ? student.firstName.charAt(0).toUpperCase() : student.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6 w-full">
              <div className="bg-sky-50/30 p-4 rounded-2xl border border-sky-100/50">
                <p className="text-[11px] font-bold text-sky-600/80 uppercase tracking-widest mb-1.5">Họ và Tên</p>
                <p className="font-extrabold text-sky-950 text-lg tracking-tight">{student.name}</p>
              </div>
              <div className="bg-sky-50/30 p-4 rounded-2xl border border-sky-100/50">
                <p className="text-[11px] font-bold text-sky-600/80 uppercase tracking-widest mb-1.5">Năm sinh</p>
                <p className="font-extrabold text-sky-950 text-lg tracking-tight">{student.birthYear || '—'}</p>
              </div>
              <div className="bg-sky-50/30 p-4 rounded-2xl border border-sky-100/50">
                <p className="text-[11px] font-bold text-sky-600/80 uppercase tracking-widest mb-1.5">Trình độ</p>
                <p className="font-extrabold text-sky-950 text-lg tracking-tight">{student.currentLevel || '—'}</p>
              </div>
              <div className="bg-sky-50/30 p-4 rounded-2xl border border-sky-100/50">
                <p className="text-[11px] font-bold text-sky-600/80 uppercase tracking-widest mb-1.5">Mục tiêu</p>
                {student.goal ? (
                   <button 
                    onClick={() => {
                      onClose();
                      onEdit(student);
                    }}
                    className="px-3.5 py-1.5 inline-flex text-[13px] font-bold rounded-full text-sky-900 shadow-sm border border-white hover:scale-105 transition-all duration-300"
                    style={{ backgroundColor: student.targetColor || '#D1F2EB' }}
                    title="Nhấn để sửa mục tiêu"
                  >
                    {student.goal}
                  </button>
                ) : (
                  <p className="font-bold text-sky-950">—</p>
                )}
              </div>
              <div className="md:col-span-4 bg-sky-50/30 p-4 rounded-2xl border border-sky-100/50">
                <p className="text-[11px] font-bold text-sky-600/80 uppercase tracking-widest mb-1.5">Lịch học</p>
                <p className="font-extrabold text-sky-950 text-lg tracking-tight">{student.schedule || '—'}</p>
              </div>
            </div>
          </div>
        </Card>

        <div>
          <h3 className="text-xl font-extrabold text-sky-950 mb-6 flex items-center tracking-tight">
            <BookOpen className="w-6 h-6 mr-3 text-blue-600" />
            Theo dõi buổi học (Đợt hiện tại)
          </h3>
          
          <div className="space-y-5">
            {(() => {
              const unpaidClasses = classes.filter(c => c.studentId === student.id && !c.isPaid);
              unpaidClasses.sort((a, b) => parseDateSafe(a.date).getTime() - parseDateSafe(b.date).getTime());
              const paidClassesCount = classes.filter(c => c.studentId === student.id && c.isPaid).length;
              
              if (unpaidClasses.length === 0) {
                return (
                  <div className="text-center py-12 bg-sky-50/50 rounded-[32px] border border-sky-200/60 border-dashed backdrop-blur-sm">
                    <p className="text-sky-700/80 font-medium text-[15px]">Chưa có buổi học nào trong đợt này.</p>
                  </div>
                );
              }

              return unpaidClasses.map((cls, idx) => renderClassCard(cls, paidClassesCount + idx, false));
            })()}
          </div>
        </div>

        <div>
          <h3 className="text-xl font-extrabold text-sky-950 mb-6 flex items-center tracking-tight">
            <Calendar className="w-6 h-6 mr-3 text-emerald-600" />
            Lịch sử học tập (Đã thanh toán)
          </h3>
          
          <div className="space-y-5">
            {(() => {
              const paidClasses = classes.filter(c => c.studentId === student.id && c.isPaid);
              if (paidClasses.length === 0) {
                return (
                  <div className="text-center py-12 bg-sky-50/50 rounded-[32px] border border-sky-200/60 border-dashed backdrop-blur-sm">
                    <p className="text-sky-700/80 font-medium text-[15px]">Chưa có lịch sử học tập.</p>
                  </div>
                );
              }

              paidClasses.sort((a, b) => parseDateSafe(a.date).getTime() - parseDateSafe(b.date).getTime());
              const classesWithIndex = paidClasses.map((cls, idx) => ({ cls, idx }));
              classesWithIndex.sort((a, b) => parseDateSafe(b.cls.date).getTime() - parseDateSafe(a.cls.date).getTime());

              const groupedClasses: Record<string, {cls: ClassSession, idx: number}[]> = {};
              classesWithIndex.forEach(item => {
                const date = parseDateSafe(item.cls.date);
                if (isNaN(date.getTime())) return;
                const monthYear = `Tháng ${date.getMonth() + 1}/${date.getFullYear()}`;
                if (!groupedClasses[monthYear]) {
                  groupedClasses[monthYear] = [];
                }
                groupedClasses[monthYear].push(item);
              });

              return Object.entries(groupedClasses).map(([monthYear, monthClasses]) => (
                <Card key={monthYear} className="overflow-hidden rounded-[24px] border-sky-100 shadow-[0_4px_16px_rgba(14,165,233,0.03)] bg-white/70">
                  <button
                    onClick={() => toggleMonth(monthYear)}
                    className="w-full px-8 py-5 flex justify-between items-center bg-transparent hover:bg-sky-50/50 transition-colors"
                  >
                    <div className="font-extrabold text-sky-950 text-lg">
                      {monthYear} <span className="opacity-60 font-medium ml-2 text-[15px]">({monthClasses.length} buổi)</span>
                    </div>
                    <div className="bg-white/80 p-2 rounded-xl shadow-sm border border-sky-50">
                      {expandedMonths[monthYear] ? (
                        <ChevronUp className="w-5 h-5 text-sky-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-sky-600" />
                      )}
                    </div>
                  </button>
                  {expandedMonths[monthYear] && (
                    <CardContent className="p-6 space-y-5 bg-sky-50/30 border-t border-sky-100">
                      {monthClasses.map(({ cls, idx }) => renderClassCard(cls, idx, true))}
                    </CardContent>
                  )}
                </Card>
              ));
            })()}
          </div>
        </div>

        <Card className="p-8 bg-gradient-to-r from-sky-50 to-blue-50 border-sky-100/60 shadow-[0_8px_32px_rgba(14,165,233,0.05)] rounded-[32px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="text-[11px] font-bold text-sky-600/80 uppercase tracking-widest mb-1.5">Tóm tắt tài chính</p>
            <div className="flex items-baseline gap-3">
              <p className="text-3xl font-extrabold text-sky-950 tracking-tight">{formatVND(getUnpaidAmount())}</p>
              <p className="text-[15px] font-medium text-sky-700/80 bg-white/60 px-3 py-1 rounded-full border border-sky-100/50 backdrop-blur-sm">
                ({classes.filter(c => c.studentId === student.id && !c.isPaid).reduce((sum, c) => sum + c.duration, 0)} buổi chưa thanh toán)
              </p>
            </div>
          </div>
          {markClassesAsPaid && getUnpaidAmount() > 0 && (
            <Button 
              onClick={() => {
                const unpaidIds = classes.filter(c => c.studentId === student.id && !c.isPaid).map(c => c.id);
                if (unpaidIds.length > 0) {
                  markClassesAsPaid(student.id, unpaidIds);
                }
              }}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-[0_8px_24px_rgba(16,185,129,0.3)] hover:shadow-[0_12px_32px_rgba(16,185,129,0.4)] whitespace-nowrap px-8 py-3 rounded-[20px] text-[15px] font-bold transition-all duration-300 hover:scale-105"
            >
              Đánh dấu đã thanh toán
            </Button>
          )}
        </Card>
      </div>
    </Modal>
  );
}
