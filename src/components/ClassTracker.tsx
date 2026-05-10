import React, { useState, useEffect, useRef } from 'react';
import { Student, ClassSession, parseDateSafe } from '../types';
import { Plus, X, Edit2, Trash2 } from 'lucide-react';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import { motion } from 'motion/react';

interface Props {
  students: Student[];
  classes: ClassSession[];
  addClass: (cls: ClassSession) => void;
  updateClass: (cls: ClassSession) => void;
  deleteClass: (id: string) => void;
}

export default function ClassTracker({ students, classes, addClass, updateClass, deleteClass }: Props) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const timeInputRef = useRef<HTMLInputElement>(null);

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
      };
    }
  }, [isFormOpen]);
  
  const avatarColors = [
    'bg-red-100 text-red-600',
    'bg-orange-100 text-orange-600',
    'bg-amber-100 text-amber-600',
    'bg-green-100 text-green-600',
    'bg-emerald-100 text-emerald-600',
    'bg-teal-100 text-teal-600',
    'bg-cyan-100 text-cyan-600',
    'bg-blue-100 text-blue-600',
    'bg-indigo-100 text-sky-600',
    'bg-violet-100 text-violet-600',
    'bg-purple-100 text-purple-600',
    'bg-fuchsia-100 text-fuchsia-600',
    'bg-pink-100 text-pink-600',
    'bg-rose-100 text-rose-600'
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
    // Removed window.confirm due to iframe restrictions
    deleteClass(id);
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

  const sortedClasses = [...classes]
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

  const availableYears = Array.from(new Set(classes.map(c => {
    const d = parseDateSafe(c.date);
    return isNaN(d.getTime()) ? '' : d.getFullYear().toString();
  }).filter(Boolean))).sort((a, b) => b.localeCompare(a));
  if (!availableYears.includes(new Date().getFullYear().toString())) {
    availableYears.push(new Date().getFullYear().toString());
    availableYears.sort((a, b) => b.localeCompare(a));
  }

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex justify-between items-center"
      >
        <h1 className="text-2xl font-bold text-theme-primary">Theo dõi Lớp học</h1>
        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-theme-secondary bg-[#BAE1FF] hover:bg-[#89CFF0] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#BAE1FF] transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ghi nhận Lớp học
        </button>
      </motion.div>

      {isFormOpen && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="glass-panel rounded-3xl shadow-[0_8px_32px_rgba(14,165,233,0.08)] border border-theme p-6 mb-6 relative"
        >
          <button 
            onClick={closeForm}
            className="absolute top-4 right-4 text-theme-muted hover:text-theme-muted"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-medium text-theme-primary mb-4">
            {editingId ? 'Sửa thông tin Lớp học' : 'Ghi nhận Lớp học mới'}
          </h2>
          {formError && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
              {formError}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-theme-secondary">Học viên <span className="text-rose-500">*</span></label>
                <select
                  value={formData.studentId}
                  onChange={e => setFormData({...formData, studentId: e.target.value})}
                  className="mt-1 block w-full rounded-xl border-theme shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2 border glass-panel"
                >
                  <option value="">Chọn học viên...</option>
                  {students.filter(s => s.status !== 'inactive').map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-secondary">Ngày học <span className="text-rose-500">*</span></label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="mt-1 block w-full rounded-xl border-theme shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-secondary">Khung giờ (Tùy chọn)</label>
                <input
                  type="text"
                  ref={timeInputRef}
                  value={formData.time}
                  onChange={e => setFormData({...formData, time: e.target.value})}
                  className="mt-1 block w-full rounded-xl border-theme shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2 border glass-panel"
                  placeholder="Chọn giờ..."
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-theme-secondary">Chủ đề bài học <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  placeholder="VD: Thì hiện tại hoàn thành, Luyện nói..."
                  value={formData.topic}
                  onChange={e => setFormData({...formData, topic: e.target.value})}
                  className="mt-1 block w-full rounded-xl border-theme shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-secondary">Thời lượng (1 buổi = 1h30 phút) <span className="text-rose-500">*</span></label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={formData.duration}
                  onChange={e => setFormData({...formData, duration: e.target.value})}
                  className="mt-1 block w-full rounded-xl border-theme shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2 border"
                />
              </div>
              
              <div className="sm:col-span-2 mt-2 pt-4 border-t border-theme">
                <h4 className="text-sm font-medium text-sky-600 mb-3">Đánh giá chi tiết buổi học</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-theme-secondary">Điểm mạnh</label>
                    <textarea
                      rows={2}
                      placeholder="Những điểm học viên làm tốt..."
                      value={formData.strengths}
                      onChange={e => setFormData({...formData, strengths: e.target.value})}
                      className="mt-1 block w-full rounded-xl border-theme shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2 border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-theme-secondary">Điểm yếu</label>
                    <textarea
                      rows={2}
                      placeholder="Những điểm học viên cần cải thiện..."
                      value={formData.weaknesses}
                      onChange={e => setFormData({...formData, weaknesses: e.target.value})}
                      className="mt-1 block w-full rounded-xl border-theme shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2 border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-theme-secondary">Các lỗi sai</label>
                    <textarea
                      rows={2}
                      placeholder="Các lỗi sai thường gặp..."
                      value={formData.mistakes}
                      onChange={e => setFormData({...formData, mistakes: e.target.value})}
                      className="mt-1 block w-full rounded-xl border-theme shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2 border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-theme-secondary">Cách khắc phục</label>
                    <textarea
                      rows={2}
                      placeholder="Giải pháp hoặc bài tập để khắc phục..."
                      value={formData.remedies}
                      onChange={e => setFormData({...formData, remedies: e.target.value})}
                      className="mt-1 block w-full rounded-xl border-theme shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2 border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-theme-secondary">Soạn bài cho buổi sau</label>
                    <textarea
                      rows={2}
                      placeholder="Nội dung cần chuẩn bị cho buổi học tiếp theo..."
                      value={formData.nextLessonPrep}
                      onChange={e => setFormData({...formData, nextLessonPrep: e.target.value})}
                      className="mt-1 block w-full rounded-xl border-theme shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2 border"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={closeForm}
                className="mr-3 glass-panel py-2 px-4 border border-theme rounded-xl shadow-sm text-sm font-medium text-theme-secondary hover:bg-theme-section focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={students.length === 0 || isSubmitting}
                className="bg-sky-600 py-2 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Đang lưu... ⏳' : (editingId ? 'Lưu thay đổi' : 'Lưu')}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass-panel rounded-2xl overflow-hidden border"
        style={{ 
          background: 'var(--card-bg)', 
          borderColor: 'var(--glass-border)',
          boxShadow: '0 8px 32px var(--glass-shadow)' 
        }}
      >
        <div className="px-6 py-5 border-b" style={{ background: 'var(--card-header-bg)', borderColor: 'var(--glass-border)' }}>
          <h3 className="text-lg leading-6 font-medium text-theme-primary">Các buổi học gần đây</h3>
          <div className="flex items-center gap-3">
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="block w-32 rounded-xl border-theme shadow-sm focus:border-[#BAE1FF] focus:ring-[#BAE1FF] sm:text-sm p-2 border bg-theme-section"
            >
              <option value="all">Tất cả tháng</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <option key={month} value={month.toString()}>Tháng {month}</option>
              ))}
            </select>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="block w-28 rounded-xl border-theme shadow-sm focus:border-[#BAE1FF] focus:ring-[#BAE1FF] sm:text-sm p-2 border bg-theme-section"
            >
              <option value="all">Tất cả năm</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-theme-section border-b border-theme">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-[#64748B] uppercase tracking-wider">Ngày/Giờ</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-[#64748B] uppercase tracking-wider">Học viên</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-[#64748B] uppercase tracking-wider">Chủ đề</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-[#64748B] uppercase tracking-wider">Thời lượng</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-[#64748B] uppercase tracking-wider">Trạng thái</th>
                <th scope="col" className="relative px-6 py-4"><span className="sr-only">Thao tác</span></th>
              </tr>
            </thead>
            <tbody 
              className="divide-y divide-[var(--glass-border)]"
              style={{ background: 'var(--table-body-bg)' }}
            >
              {sortedClasses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm" style={{ color: 'var(--table-body-empty-color)' }}>
                    Chưa có lớp học nào được ghi nhận trong thời gian này.
                  </td>
                </tr>
              ) : (
                sortedClasses.map((cls) => (
                  <tr key={cls.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-primary">
                      {!isNaN(parseDateSafe(cls.date).getTime()) 
                        ? parseDateSafe(cls.date).toLocaleDateString('vi-VN') 
                        : 'Ngày không hợp lệ'}
                      {cls.time && <span className="text-theme-muted ml-2 text-xs">{cls.time}</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStudentColor(cls.studentId)}`}>
                        {getStudentName(cls.studentId)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-theme-muted">
                      {cls.topic}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-muted">
                      {cls.duration} buổi
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {cls.isPaid ? (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-[#BAFFC9] text-green-800">
                          Đã thanh toán
                        </span>
                      ) : (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-[#FFDFBA] text-orange-800">
                          Chưa thanh toán
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => editClass(cls)} 
                        className="text-theme-muted hover:text-sky-600 mr-4 transition-colors"
                        title="Sửa"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(cls.id)} 
                        className="text-theme-muted hover:text-rose-600 transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
