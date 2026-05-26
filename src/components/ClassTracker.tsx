import React, { useState, useEffect, useRef } from 'react';
import { Student, ClassSession, parseDateSafe } from '../types';
import { Plus, X, Edit2, Trash2, AlertTriangle, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Textarea } from './ui/Textarea';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Modal } from './ui/Modal';
import { Badge } from './ui/Badge';

interface Props {
  students: Student[];
  classes: ClassSession[];
  addClass: (cls: ClassSession) => Promise<void> | void;
  updateClass: (cls: ClassSession) => Promise<void> | void;
  deleteClass: (id: string) => Promise<void> | void;
}

export default function ClassTracker({ students, classes, addClass, updateClass, deleteClass }: Props) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const timeInputRef = useRef<HTMLInputElement>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (isFormOpen && timeInputRef.current) {
      const fp = flatpickr(timeInputRef.current, {
        enableTime: true,
        noCalendar: true,
        dateFormat: "h:i K",
        time_24hr: false,
        onChange: (selectedDates, dateStr) => {
          setFormData(prev => ({ ...prev, time: dateStr }));
        }
      });
      return () => {
        if (fp) {
          if (typeof (fp as any).destroy === 'function') {
            (fp as any).destroy();
          } else if (Array.isArray(fp)) {
            fp.forEach(instance => {
              if (instance && typeof instance.destroy === 'function') {
                instance.destroy();
              }
            });
          }
        }
      }
    }
  }, [isFormOpen]);
  
  const avatarColors = [
    'bg-red-50/80 text-red-600',
    'bg-orange-50/80 text-orange-600',
    'bg-amber-50/80 text-amber-600',
    'bg-green-50/80 text-green-600',
    'bg-emerald-50/80 text-emerald-600',
    'bg-teal-50/80 text-teal-600',
    'bg-cyan-50/80 text-cyan-600',
    'bg-blue-50/80 text-blue-600',
    'bg-indigo-50/80 text-indigo-600',
    'bg-violet-50/80 text-violet-600',
    'bg-purple-50/80 text-purple-600',
    'bg-fuchsia-50/80 text-fuchsia-600',
    'bg-pink-50/80 text-pink-600',
    'bg-rose-50/80 text-rose-600'
  ];

  const getStudentColor = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return avatarColors[Math.abs(hash) % avatarColors.length];
  };
  
  const [formData, setFormData] = useState({
    studentId: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    topic: '',
    duration: '1',
    strengths: '',
    weaknesses: '',
    mistakes: '',
    remedies: '',
    nextLessonPrep: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    // Manual validation
    if (!formData.studentId) {
      setFormError('Vui lòng chọn học viên.');
      return;
    }
    if (!formData.date) {
      setFormError('Vui lòng chọn ngày học.');
      return;
    }
    if (!formData.topic.trim()) {
      setFormError('Vui lòng nhập chủ đề bài học.');
      return;
    }
    if (!formData.duration || Number(formData.duration) <= 0) {
      setFormError('Vui lòng nhập thời lượng hợp lệ.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (editingId) {
        await updateClass({
          ...classes.find(c => c.id === editingId)!,
          studentId: formData.studentId,
          date: formData.date,
          time: formData.time,
          topic: formData.topic,
          duration: Number(formData.duration),
          strengths: formData.strengths,
          weaknesses: formData.weaknesses,
          mistakes: formData.mistakes,
          remedies: formData.remedies,
          nextLessonPrep: formData.nextLessonPrep
        });
      } else {
        await addClass({
          id: crypto.randomUUID(),
          studentId: formData.studentId,
          date: formData.date,
          time: formData.time,
          topic: formData.topic,
          duration: Number(formData.duration),
          isPaid: false,
          strengths: formData.strengths,
          weaknesses: formData.weaknesses,
          mistakes: formData.mistakes,
          remedies: formData.remedies,
          nextLessonPrep: formData.nextLessonPrep
        });
      }
      closeForm();
    } catch (error) {
      console.error("Error saving class:", error);
      alert("Đã có lỗi xảy ra khi lưu dữ liệu. Vui lòng kiểm tra kết nối mạng và thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const editClass = (cls: ClassSession) => {
    setFormData({
      studentId: cls.studentId,
      date: cls.date,
      time: cls.time || '',
      topic: cls.topic,
      duration: cls.duration.toString(),
      strengths: cls.strengths || '',
      weaknesses: cls.weaknesses || '',
      mistakes: cls.mistakes || '',
      remedies: cls.remedies || '',
      nextLessonPrep: cls.nextLessonPrep || ''
    });
    setEditingId(cls.id);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setConfirmDeleteId(id);
  };

  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    setIsDeleting(true);
    try {
      await deleteClass(confirmDeleteId);
    } finally {
      setConfirmDeleteId(null);
      setIsDeleting(false);
    }
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormError('');
    setFormData({
      studentId: '',
      date: new Date().toISOString().split('T')[0],
      time: '',
      topic: '',
      duration: '1',
      strengths: '',
      weaknesses: '',
      mistakes: '',
      remedies: '',
      nextLessonPrep: ''
    });
  };

  const getStudentName = (id: string) => {
    return students.find(s => s.id === id)?.name || 'Học viên không xác định';
  };

  const sortedClasses = React.useMemo(() => {
    return [...classes]
      .filter(cls => {
        const classDate = parseDateSafe(cls.date);
        if (isNaN(classDate.getTime())) return false;
        
        const classMonth = (classDate.getMonth() + 1).toString();
        const classYear = classDate.getFullYear().toString();
        
        const matchMonth = filterMonth === 'all' || classMonth === filterMonth;
        const matchYear = filterYear === 'all' || classYear === filterYear;
        
        return matchMonth && matchYear;
      })
      .sort((a, b) => {
        const dateA = parseDateSafe(a.date).getTime();
        const dateB = parseDateSafe(b.date).getTime();
        return dateB - dateA;
      });
  }, [classes, filterMonth, filterYear]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [filterMonth, filterYear]);

  const totalPages = Math.max(1, Math.ceil(sortedClasses.length / itemsPerPage));
  const paginatedClasses = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedClasses.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedClasses, currentPage, itemsPerPage]);

  const availableYears = Array.from(new Set(classes.map(c => {
    const d = parseDateSafe(c.date);
    return isNaN(d.getTime()) ? '' : d.getFullYear().toString();
  }).filter(Boolean))).sort((a, b) => b.localeCompare(a));
  if (!availableYears.includes(new Date().getFullYear().toString())) {
    availableYears.push(new Date().getFullYear().toString());
    availableYears.sort((a, b) => b.localeCompare(a));
  }

  return (
    <div className="space-y-8 pb-10">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div className="flex flex-col gap-1 items-start">
          <h1 className="text-3xl sm:text-4xl font-extrabold animate-rainbow-text tracking-tight drop-shadow-sm pb-1">Theo dõi Lớp học</h1>
          <p className="text-slate-600 font-medium text-lg">Quản lý lịch học và trạng thái thanh toán học viên</p>
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="bg-sky-600 hover:bg-sky-700 text-white shadow-md hover:shadow-[0_0_20px_rgba(2,132,199,0.4)] transition-all duration-300 rounded-[16px] h-12 px-6 group border border-sky-500/50 relative overflow-hidden btn-magnetic"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
          <Plus className="w-5 h-5 mr-2 group-hover:scale-110 group-hover:rotate-90 transition-all duration-300 relative z-10" />
          <span className="font-semibold text-[15px] relative z-10">Ghi nhận Lớp học</span>
        </Button>
      </motion.div>

      {isFormOpen && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="mb-8 relative"
        >
          <div className="bg-white/60 backdrop-blur-md border border-white shadow-[0_8px_32px_rgba(0,0,0,0.06)] rounded-[32px] overflow-hidden p-8 relative">
            <Button 
              variant="ghost"
              size="icon"
              onClick={closeForm}
              className="absolute top-6 right-6 text-sky-400 hover:text-sky-600 hover:bg-white border border-transparent hover:border-sky-100 hover:shadow-sm rounded-2xl w-10 h-10 transition-all duration-300 z-10"
            >
              <X className="w-5 h-5" />
            </Button>
            
            <div className="mb-6">
              <h2 className="text-xl font-extrabold text-sky-950 tracking-tight">
                {editingId ? 'Sửa thông tin Lớp học' : 'Ghi nhận Lớp học mới'}
              </h2>
            </div>
            
            <div>
              {formError && (
                <div className="mb-6 p-4 bg-rose-50/80 backdrop-blur-sm text-rose-700 text-sm rounded-2xl border border-rose-200/60 shadow-sm animate-pulse-once">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-semibold">{formError}</span>
                  </div>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-sky-900/90 tracking-wide">Học viên <span className="text-rose-500">*</span></label>
                    <Select
                      value={formData.studentId}
                      onChange={e => setFormData({...formData, studentId: e.target.value})}
                      className="rounded-[16px] bg-white/70 border-sky-100 hover:border-sky-200 focus:border-sky-400 focus:ring-sky-200/50 shadow-[0_2px_8px_rgba(14,165,233,0.04)] h-11"
                    >
                      <option value="">Chọn học viên...</option>
                      {students.filter(s => s.status !== 'inactive').map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-sky-900/90 tracking-wide">Ngày học <span className="text-rose-500">*</span></label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                      className="rounded-[16px] bg-white/70 border-sky-100 hover:border-sky-200 focus:border-sky-400 focus:ring-sky-200/50 shadow-[0_2px_8px_rgba(14,165,233,0.04)] h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-sky-900/90 tracking-wide">Khung giờ (Tùy chọn)</label>
                    <Input
                      type="text"
                      ref={timeInputRef}
                      value={formData.time}
                      onChange={e => setFormData({...formData, time: e.target.value})}
                      placeholder="Chọn giờ..."
                      className="rounded-[16px] bg-white/70 border-sky-100 hover:border-sky-200 focus:border-sky-400 focus:ring-sky-200/50 shadow-[0_2px_8px_rgba(14,165,233,0.04)] h-11"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="block text-sm font-bold text-sky-900/90 tracking-wide">Chủ đề bài học <span className="text-rose-500">*</span></label>
                    <Input
                      type="text"
                      placeholder="VD: Thì hiện tại hoàn thành, Luyện nói..."
                      value={formData.topic}
                      onChange={e => setFormData({...formData, topic: e.target.value})}
                      className="rounded-[16px] bg-white/70 border-sky-100 hover:border-sky-200 focus:border-sky-400 focus:ring-sky-200/50 shadow-[0_2px_8px_rgba(14,165,233,0.04)] h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-sky-900/90 tracking-wide">Thời lượng (1 buổi = 1h30 phút) <span className="text-rose-500">*</span></label>
                    <Input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={formData.duration}
                      onChange={e => setFormData({...formData, duration: e.target.value})}
                      className="rounded-[16px] bg-white/70 border-sky-100 hover:border-sky-200 focus:border-sky-400 focus:ring-sky-200/50 shadow-[0_2px_8px_rgba(14,165,233,0.04)] h-11"
                    />
                  </div>
                  
                  <div className="sm:col-span-2 mt-4 pt-6 border-t border-sky-100/60">
                    <h4 className="text-sm font-extrabold text-sky-600/90 uppercase tracking-widest mb-4">Đánh giá chi tiết buổi học</h4>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="block text-sm font-bold text-sky-900/90 tracking-wide">Điểm mạnh</label>
                        <Textarea
                          rows={2}
                          placeholder="Những điểm học viên làm tốt..."
                          value={formData.strengths}
                          onChange={e => setFormData({...formData, strengths: e.target.value})}
                          className="rounded-[20px] bg-white/70 border-sky-100 hover:border-sky-200 focus:border-sky-400 focus:ring-sky-200/50 shadow-[0_2px_8px_rgba(14,165,233,0.04)] resize-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-sm font-bold text-sky-900/90 tracking-wide">Điểm yếu</label>
                        <Textarea
                          rows={2}
                          placeholder="Những điểm học viên cần cải thiện..."
                          value={formData.weaknesses}
                          onChange={e => setFormData({...formData, weaknesses: e.target.value})}
                          className="rounded-[20px] bg-white/70 border-sky-100 hover:border-sky-200 focus:border-sky-400 focus:ring-sky-200/50 shadow-[0_2px_8px_rgba(14,165,233,0.04)] resize-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-sm font-bold text-sky-900/90 tracking-wide">Các lỗi sai</label>
                        <Textarea
                          rows={2}
                          placeholder="Các lỗi sai thường gặp..."
                          value={formData.mistakes}
                          onChange={e => setFormData({...formData, mistakes: e.target.value})}
                          className="rounded-[20px] bg-white/70 border-sky-100 hover:border-sky-200 focus:border-sky-400 focus:ring-sky-200/50 shadow-[0_2px_8px_rgba(14,165,233,0.04)] resize-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-sm font-bold text-sky-900/90 tracking-wide">Cách khắc phục</label>
                        <Textarea
                          rows={2}
                          placeholder="Giải pháp hoặc bài tập để khắc phục..."
                          value={formData.remedies}
                          onChange={e => setFormData({...formData, remedies: e.target.value})}
                          className="rounded-[20px] bg-white/70 border-sky-100 hover:border-sky-200 focus:border-sky-400 focus:ring-sky-200/50 shadow-[0_2px_8px_rgba(14,165,233,0.04)] resize-none"
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-1.5">
                        <label className="block text-sm font-bold text-sky-900/90 tracking-wide">Soạn bài cho buổi sau</label>
                        <Textarea
                          rows={2}
                          placeholder="Nội dung cần chuẩn bị cho buổi học tiếp theo..."
                          value={formData.nextLessonPrep}
                          onChange={e => setFormData({...formData, nextLessonPrep: e.target.value})}
                          className="rounded-[20px] bg-white/70 border-sky-100 hover:border-sky-200 focus:border-sky-400 focus:ring-sky-200/50 shadow-[0_2px_8px_rgba(14,165,233,0.04)] resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-6 gap-3 border-t border-sky-100/60">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeForm}
                    className="rounded-[16px] border-sky-200 hover:bg-sky-50 font-semibold px-6"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={students.length === 0 || isSubmitting}
                    className="rounded-[16px] bg-gradient-to-r from-sky-400 to-sky-500 hover:from-sky-500 hover:to-sky-600 text-white shadow-[0_4px_16px_rgba(56,189,248,0.3)] hover:shadow-[0_8px_24px_rgba(56,189,248,0.4)] font-semibold px-8"
                  >
                    {isSubmitting && (
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {editingId ? 'Lưu thay đổi' : 'Lưu'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        className="bg-white/60 backdrop-blur-md border border-white shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[32px] overflow-hidden relative"
      >
        <div className="bg-noise rounded-[32px]"></div>
        <div className="flex flex-col relative z-10">
          <div className="px-8 py-6 border-b border-sky-100/60 bg-gradient-to-b from-white/40 to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-xl font-extrabold text-sky-950 tracking-tight">Các buổi học gần đây</h3>
            <div className="flex items-center gap-3 bg-white/50 backdrop-blur-md rounded-[20px] p-1.5 border border-white shadow-[0_4px_16px_rgba(14,165,233,0.03)] focus-within:ring-2 focus-within:ring-sky-200 focus-within:shadow-[0_8px_24px_rgba(14,165,233,0.08)] transition-all duration-300">
              <div className="flex items-center pl-3">
                <Calendar className="w-4 h-4 text-sky-500" />
              </div>
              <Select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-[130px] border-none bg-transparent hover:bg-sky-50/50 focus:ring-0 cursor-pointer !h-9 text-sm font-semibold text-sky-950 transition-colors"
                style={{ WebkitAppearance: 'none' }}
              >
                <option value="all">Tất cả tháng</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month.toString()}>Tháng {month}</option>
                ))}
              </Select>
              <div className="w-px h-5 bg-sky-200/50 mx-1"></div>
              <Select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="w-[110px] border-none bg-transparent hover:bg-sky-50/50 focus:ring-0 cursor-pointer !h-9 text-sm font-semibold text-sky-950 transition-colors"
                style={{ WebkitAppearance: 'none' }}
              >
                <option value="all">Tất cả năm</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-white/40 border-b border-sky-100/50 backdrop-blur-md sticky top-0 z-10">
                <tr>
                  <th scope="col" className="px-8 py-5 text-left text-[0.7rem] font-bold text-sky-600/80 uppercase tracking-widest">Ngày/Giờ</th>
                  <th scope="col" className="px-8 py-5 text-left text-[0.7rem] font-bold text-sky-600/80 uppercase tracking-widest">Học viên</th>
                  <th scope="col" className="px-8 py-5 text-left text-[0.7rem] font-bold text-sky-600/80 uppercase tracking-widest">Chủ đề</th>
                  <th scope="col" className="px-8 py-5 text-left text-[0.7rem] font-bold text-sky-600/80 uppercase tracking-widest">Thời lượng</th>
                  <th scope="col" className="px-8 py-5 text-left text-[0.7rem] font-bold text-sky-600/80 uppercase tracking-widest">Trạng thái</th>
                  <th scope="col" className="relative px-8 py-5"><span className="sr-only">Thao tác</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-50/50">
                {paginatedClasses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-16 text-center text-sm font-medium text-sky-700/60" >
                      Chưa có lớp học nào được ghi nhận trong thời gian này.
                    </td>
                  </tr>
                ) : (
                  paginatedClasses.map((cls) => (
                    <tr key={cls.id} className="group hover:bg-white/80 hover:shadow-[0_4px_24px_rgba(14,165,233,0.06)] transition-all duration-300 relative z-0 hover:z-10 bg-transparent">
                      <td className="px-8 py-5 whitespace-nowrap text-sm text-sky-950 font-bold tracking-tight">
                        {!isNaN(parseDateSafe(cls.date).getTime()) 
                          ? parseDateSafe(cls.date).toLocaleDateString('vi-VN') 
                          : 'Ngày không hợp lệ'}
                        {cls.time && <span className="text-sky-600 ml-3 text-[11px] font-semibold bg-sky-50 border border-sky-100/60 px-2.5 py-1 rounded-full drop-shadow-sm">{cls.time}</span>}
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border border-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-transform group-hover:scale-105 duration-300 ${getStudentColor(cls.studentId)}`}>
                          {getStudentName(cls.studentId)}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-sm text-sky-800 font-semibold max-w-xs truncate">
                        {cls.topic}
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-sm text-sky-600 font-semibold">
                        {cls.duration} <span className="text-sky-500/80 font-medium">buổi</span>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        {cls.isPaid ? (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-bold bg-emerald-50/90 text-emerald-600 border border-emerald-100 shadow-sm backdrop-blur-sm gap-1.5 tracking-wide">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Đã thanh toán
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-bold bg-orange-50/90 text-orange-600 border border-orange-100 shadow-sm backdrop-blur-sm gap-1.5 tracking-wide">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Chưa thanh toán
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2 opacity-100 transition-opacity duration-300">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => editClass(cls)} 
                            className="h-9 w-9 text-sky-500 hover:text-sky-600 hover:bg-sky-50 bg-white/50 backdrop-blur-sm border border-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-300 rounded-[14px]"
                            title="Sửa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(cls.id)} 
                            className="h-9 w-9 text-rose-500 hover:text-rose-600 hover:bg-rose-50 bg-white/50 backdrop-blur-sm border border-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-300 rounded-[14px]"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="px-8 py-4 border-t border-sky-50 flex items-center justify-between bg-white/50 backdrop-blur-sm rounded-b-3xl">
              <span className="text-sm font-medium text-sky-900/60">
                Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, sortedClasses.length)} trong số {sortedClasses.length}
              </span>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl border-sky-100 text-sky-700 hover:bg-sky-50"
                  size="sm"
                >
                  Trước
                </Button>
                <div className="flex bg-white shadow-sm border border-sky-100 rounded-xl overflow-hidden font-medium text-sm">
                   {Array.from({length: totalPages}, (_, i) => i + 1).map(page => (
                     <button
                       key={page}
                       onClick={() => setCurrentPage(page)}
                       className={`px-3 py-1.5 transition-colors ${currentPage === page ? 'bg-sky-500 text-white font-bold' : 'text-sky-700 hover:bg-sky-50'}`}
                     >
                       {page}
                     </button>
                   ))}
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-xl border-sky-100 text-sky-700 hover:bg-sky-50"
                  size="sm"
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        maxWidth="sm"
        title="Xác nhận xóa lớp học"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)} className="flex-1 font-semibold rounded-[16px]">
              Hủy
            </Button>
            <Button 
              variant="danger" 
              onClick={confirmDelete}
              disabled={isDeleting}
              className="flex-1 font-semibold rounded-[16px]"
            >
              {isDeleting ? 'Đang xóa...' : 'Xóa'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center pt-2 pb-6">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-rose-50 to-red-50 border border-white shadow-[0_4px_16px_rgba(244,63,94,0.1)] ring-1 ring-rose-100 mb-6 relative">
            <div className="absolute inset-0 bg-rose-400/20 rounded-full animate-ping opacity-50"></div>
            <AlertTriangle className="w-8 h-8 text-rose-500 relative z-10" />
          </div>
          <p className="text-sky-800/90 text-center text-[15px] leading-relaxed max-w-[260px]">
            Bạn có chắc chắn muốn xóa lớp học này? Hành động này <span className="font-bold text-rose-600">không thể hoàn tác</span>.
          </p>
        </div>
      </Modal>
    </div>
  );
}