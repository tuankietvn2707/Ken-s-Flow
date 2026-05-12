import React, { useState, useEffect, useRef } from 'react';
import { Student, ClassSession, parseDateSafe } from '../types';
import { Plus, X, Edit2, Trash2, AlertTriangle } from 'lucide-react';
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
    setConfirmDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await deleteClass(confirmDeleteId);
    } finally {
      setConfirmDeleteId(null);
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
        <h1 className="text-2xl font-bold text-sky-950">Theo dõi Lớp học</h1>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="bg-sky-200 text-sky-900 border border-sky-300 hover:bg-sky-300 shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ghi nhận Lớp học
        </Button>
      </motion.div>

      {isFormOpen && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="mb-6 relative"
        >
          <Card>
            <Button 
              variant="ghost"
              size="icon"
              onClick={closeForm}
              className="absolute top-4 right-4 text-sky-400 hover:text-sky-600 hover:bg-sky-50 z-10"
            >
              <X className="w-5 h-5" />
            </Button>
            <CardHeader className="pt-6">
              <CardTitle>
                {editingId ? 'Sửa thông tin Lớp học' : 'Ghi nhận Lớp học mới'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {formError && (
                <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-sm rounded-xl border border-rose-200">
                  {formError}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-sky-900">Học viên <span className="text-rose-500">*</span></label>
                    <Select
                      value={formData.studentId}
                      onChange={e => setFormData({...formData, studentId: e.target.value})}
                    >
                      <option value="">Chọn học viên...</option>
                      {students.filter(s => s.status !== 'inactive').map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-sky-900">Ngày học <span className="text-rose-500">*</span></label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-sky-900">Khung giờ (Tùy chọn)</label>
                    <Input
                      type="text"
                      ref={timeInputRef}
                      value={formData.time}
                      onChange={e => setFormData({...formData, time: e.target.value})}
                      placeholder="Chọn giờ..."
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-sm font-medium text-sky-900">Chủ đề bài học <span className="text-rose-500">*</span></label>
                    <Input
                      type="text"
                      placeholder="VD: Thì hiện tại hoàn thành, Luyện nói..."
                      value={formData.topic}
                      onChange={e => setFormData({...formData, topic: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-sky-900">Thời lượng (1 buổi = 1h30 phút) <span className="text-rose-500">*</span></label>
                    <Input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={formData.duration}
                      onChange={e => setFormData({...formData, duration: e.target.value})}
                    />
                  </div>
                  
                  <div className="sm:col-span-2 mt-2 pt-4 border-t border-sky-100">
                    <h4 className="text-sm font-medium text-sky-600 mb-3">Đánh giá chi tiết buổi học</h4>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-sky-900">Điểm mạnh</label>
                        <Textarea
                          rows={2}
                          placeholder="Những điểm học viên làm tốt..."
                          value={formData.strengths}
                          onChange={e => setFormData({...formData, strengths: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-sky-900">Điểm yếu</label>
                        <Textarea
                          rows={2}
                          placeholder="Những điểm học viên cần cải thiện..."
                          value={formData.weaknesses}
                          onChange={e => setFormData({...formData, weaknesses: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-sky-900">Các lỗi sai</label>
                        <Textarea
                          rows={2}
                          placeholder="Các lỗi sai thường gặp..."
                          value={formData.mistakes}
                          onChange={e => setFormData({...formData, mistakes: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-sky-900">Cách khắc phục</label>
                        <Textarea
                          rows={2}
                          placeholder="Giải pháp hoặc bài tập để khắc phục..."
                          value={formData.remedies}
                          onChange={e => setFormData({...formData, remedies: e.target.value})}
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-1">
                        <label className="block text-sm font-medium text-sky-900">Soạn bài cho buổi sau</label>
                        <Textarea
                          rows={2}
                          placeholder="Nội dung cần chuẩn bị cho buổi học tiếp theo..."
                          value={formData.nextLessonPrep}
                          onChange={e => setFormData({...formData, nextLessonPrep: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-4 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeForm}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={students.length === 0 || isSubmitting}
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
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
      >
        <Card className="overflow-hidden">
          <div className="px-6 py-5 border-b border-sky-100 bg-sky-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg leading-6 font-medium text-sky-950">Các buổi học gần đây</h3>
            <div className="flex items-center gap-3">
              <Select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-32 bg-white"
              >
                <option value="all">Tất cả tháng</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month.toString()}>Tháng {month}</option>
                ))}
              </Select>
              <Select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="w-28 bg-white"
              >
                <option value="all">Tất cả năm</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-sky-50/30 border-b border-sky-100">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-sky-600 uppercase tracking-wider">Ngày/Giờ</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-sky-600 uppercase tracking-wider">Học viên</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-sky-600 uppercase tracking-wider">Chủ đề</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-sky-600 uppercase tracking-wider">Thời lượng</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-sky-600 uppercase tracking-wider">Trạng thái</th>
                  <th scope="col" className="relative px-6 py-4"><span className="sr-only">Thao tác</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-sky-50">
                {sortedClasses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-sky-700/80" >
                      Chưa có lớp học nào được ghi nhận trong thời gian này.
                    </td>
                  </tr>
                ) : (
                  sortedClasses.map((cls) => (
                    <tr key={cls.id} className="hover:bg-sky-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-sky-950 font-medium">
                        {!isNaN(parseDateSafe(cls.date).getTime()) 
                          ? parseDateSafe(cls.date).toLocaleDateString('vi-VN') 
                          : 'Ngày không hợp lệ'}
                        {cls.time && <span className="text-sky-600 ml-2 text-xs font-normal bg-sky-100 px-2 py-0.5 rounded-full">{cls.time}</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStudentColor(cls.studentId)}`}>
                          {getStudentName(cls.studentId)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-sky-700 font-medium max-w-xs truncate">
                        {cls.topic}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-sky-600">
                        {cls.duration} buổi
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {cls.isPaid ? (
                          <Badge variant="success">Đã thanh toán</Badge>
                        ) : (
                          <Badge variant="warning">Chưa thanh toán</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => editClass(cls)} 
                          className="mr-2 text-sky-600 hover:text-sky-800 hover:bg-sky-100"
                          title="Sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(cls.id)} 
                          className="text-rose-500 hover:text-rose-700 hover:bg-rose-100"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        maxWidth="sm"
        title="Xác nhận xóa lớp học"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)} className="flex-1">
              Hủy
            </Button>
            <Button 
              variant="danger" 
              onClick={confirmDelete}
              className="flex-1"
            >
              Xóa
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center pt-2 pb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-rose-100 mb-4">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
          </div>
          <p className="text-sky-700/80 text-center text-sm">
            Bạn có chắc chắn muốn xóa đánh giá và ghi nhận buổi học này? Hành động này không thể hoàn tác.
          </p>
        </div>
      </Modal>
    </div>
  );
}