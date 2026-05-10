import React, { useState } from 'react';
import { Student, ClassSession, formatVND, parseDateSafe } from '../types';
import { BookOpen, Calendar, X, ChevronUp, ChevronDown } from 'lucide-react';
import { getAvatarColor } from './StudentManagementUtils';

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
    <div key={cls.id} className="glass-panel rounded-3xl border border-theme shadow-[0_10px_30px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className={`${isPaid ? 'bg-[var(--glass-bg)]' : 'bg-[var(--glass-bg)]'} px-6 py-3 border-b border-theme flex justify-between items-center`}>
        <div className={`font-bold ${isPaid ? 'text-emerald-900' : 'text-blue-900'}`}>
          Buổi {idx + 1} <span className="text-theme-muted font-normal ml-2">({!isNaN(parseDateSafe(cls.date).getTime()) ? parseDateSafe(cls.date).toLocaleDateString('vi-VN') : 'Ngày không hợp lệ'})</span>
        </div>
        <div className="text-sm font-medium text-theme-muted glass-panel px-2 py-1 rounded border border-theme">
          {cls.duration} buổi
        </div>
      </div>
      <div className="p-6">
        <div className="mb-5 pb-5 border-b border-theme">
          <p className="text-sm font-semibold text-theme-muted uppercase tracking-wider mb-1">Chủ đề / Nội dung</p>
          <p className="text-theme-primary font-medium text-lg">{cls.topic || '—'}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <p className="text-sm font-semibold text-emerald-700 mb-1 flex items-center gap-2">👍 Điểm mạnh</p>
            <p className="text-sm text-theme-secondary whitespace-pre-wrap">{cls.strengths || '—'}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-rose-700 mb-1 flex items-center gap-2">👎 Điểm yếu</p>
            <p className="text-sm text-theme-secondary whitespace-pre-wrap">{cls.weaknesses || '—'}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-red-600 mb-1 flex items-center gap-2">❌ Các lỗi sai</p>
            <p className="text-sm text-theme-secondary whitespace-pre-wrap">{cls.mistakes || '—'}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-600 mb-1 flex items-center gap-2">🛠️ Cách khắc phục</p>
            <p className="text-sm text-theme-secondary whitespace-pre-wrap">{cls.remedies || '—'}</p>
          </div>
          <div className="md:col-span-2 lg:col-span-2">
            <p className="text-sm font-semibold text-sky-600 mb-1 flex items-center gap-2">📝 Ghi chú kế hoạch buổi tiếp theo</p>
            <p className="text-sm text-theme-secondary whitespace-pre-wrap">{cls.nextLessonPrep || '—'}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="relative z-10 inline-flex flex-col align-bottom glass rounded-[32px] text-left overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.08)] transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full max-h-[90vh]">
          <div className="glass-panel px-6 py-4 border-b border-theme flex justify-between items-center shrink-0">
            <h3 className="text-xl font-bold text-theme-primary" id="modal-title">
              Hồ sơ Học viên: {student.name}
            </h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  onClose();
                  onEdit(student);
                }}
                className="text-sm font-medium text-sky-600 hover:text-indigo-800 glass-panel hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors"
              >
                Sửa hồ sơ
              </button>
              <button 
                onClick={onClose}
                className="text-theme-muted hover:text-theme-muted bg-theme-section hover:bg-sky-200 rounded-full p-1.5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            <div className="glass-panel rounded-3xl border border-theme shadow-[0_10px_30px_rgba(0,0,0,0.04)] p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className={`h-20 w-20 rounded-full flex items-center justify-center font-bold text-3xl shrink-0 ${getAvatarColor(student.id)}`}>
                  {student.firstName ? student.firstName.charAt(0).toUpperCase() : student.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                  <div>
                    <p className="text-sm text-theme-muted mb-1">Họ và Tên</p>
                    <p className="font-semibold text-theme-primary">{student.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-theme-muted mb-1">Năm sinh</p>
                    <p className="font-semibold text-theme-primary">{student.birthYear || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-theme-muted mb-1">Trình độ hiện tại</p>
                    <p className="font-semibold text-theme-primary">{student.currentLevel || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-theme-muted mb-1">Mục tiêu</p>
                    {student.goal ? (
                      <button 
                        onClick={() => {
                          onClose();
                          onEdit(student);
                        }}
                        className="px-3 py-1 inline-flex text-sm font-semibold rounded-full text-gray-800 hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: student.targetColor || '#D1F2EB' }}
                        title="Nhấn để sửa mục tiêu"
                      >
                        {student.goal}
                      </button>
                    ) : (
                      <p className="font-semibold text-theme-primary">—</p>
                    )}
                  </div>
                  <div className="md:col-span-4">
                    <p className="text-sm text-theme-muted mb-1">Lịch học</p>
                    <p className="font-semibold text-theme-primary">{student.schedule || '—'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-theme-primary mb-4 flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                Theo dõi buổi học (Đợt hiện tại)
              </h3>
              
              <div className="space-y-4">
                {(() => {
                  const unpaidClasses = classes.filter(c => c.studentId === student.id && !c.isPaid);
                  unpaidClasses.sort((a, b) => parseDateSafe(a.date).getTime() - parseDateSafe(b.date).getTime());
                  const paidClassesCount = classes.filter(c => c.studentId === student.id && c.isPaid).length;
                  
                  if (unpaidClasses.length === 0) {
                    return (
                      <div className="text-center py-10 glass-panel rounded-3xl border border-theme border-dashed">
                        <p className="text-theme-muted">Chưa có buổi học nào trong đợt này.</p>
                      </div>
                    );
                  }

                  return unpaidClasses.map((cls, idx) => renderClassCard(cls, paidClassesCount + idx, false));
                })()}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-theme-primary mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-emerald-600" />
                Lịch sử học tập (Đã thanh toán)
              </h3>
              
              <div className="space-y-4">
                {(() => {
                  const paidClasses = classes.filter(c => c.studentId === student.id && c.isPaid);
                  if (paidClasses.length === 0) {
                    return (
                      <div className="text-center py-10 glass-panel rounded-3xl border border-theme border-dashed">
                        <p className="text-theme-muted">Chưa có lịch sử học tập.</p>
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
                    <div key={monthYear} className="glass-panel rounded-3xl border border-theme shadow-[0_10px_30px_rgba(0,0,0,0.04)] overflow-hidden">
                      <button
                        onClick={() => toggleMonth(monthYear)}
                        className="w-full px-6 py-4 flex justify-between items-center glass-panel/40 hover:bg-theme-section transition-colors"
                      >
                        <div className="font-bold text-theme-secondary">
                          {monthYear} <span className="text-theme-muted font-normal ml-2">({monthClasses.length} buổi)</span>
                        </div>
                        {expandedMonths[monthYear] ? (
                          <ChevronUp className="w-5 h-5 text-theme-muted" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-theme-muted" />
                        )}
                      </button>
                      {expandedMonths[monthYear] && (
                        <div className="p-4 space-y-4 glass-panel/40">
                          {monthClasses.map(({ cls, idx }) => renderClassCard(cls, idx, true))}
                        </div>
                      )}
                    </div>
                  ));
                })()}
              </div>
            </div>

            <div className="glass-panel rounded-3xl border border-theme shadow-[0_10px_30px_rgba(0,0,0,0.04)] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-theme-muted mb-1">Tóm tắt tài chính</p>
                <div className="flex items-baseline gap-3">
                  <p className="text-2xl font-bold text-theme-primary">{formatVND(getUnpaidAmount())}</p>
                  <p className="text-sm font-medium text-theme-muted">
                    ({classes.filter(c => c.studentId === student.id && !c.isPaid).reduce((sum, c) => sum + c.duration, 0)} buổi chưa thanh toán)
                  </p>
                </div>
              </div>
              {markClassesAsPaid && getUnpaidAmount() > 0 && (
                <button 
                  onClick={() => {
                    const unpaidIds = classes.filter(c => c.studentId === student.id && !c.isPaid).map(c => c.id);
                    if (unpaidIds.length > 0) {
                      markClassesAsPaid(student.id, unpaidIds);
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm whitespace-nowrap"
                >
                  Đã thanh toán
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
