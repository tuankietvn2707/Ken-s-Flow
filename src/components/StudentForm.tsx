import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import { User, BookOpen, CreditCard, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  editingId: string | null;
  initialData?: Student | null;
  students: Student[];
  onClose: () => void;
  onAdd: (student: Student) => Promise<void> | void;
  onUpdate: (student: Student) => Promise<void> | void;
}

export default function StudentForm({ editingId, initialData, students, onClose, onAdd, onUpdate }: Props) {
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthYear: '',
    gender: 'Nam',
    occupation: '',
    currentLevel: '',
    goal: '',
    targetColor: '#D0E8FF',
    fee: '',
    feeCycle: '8',
    schedule: '',
    notes: '',
    status: 'active' as 'active' | 'inactive'
  });

  useEffect(() => {
    if (initialData) {
      let fName = initialData.firstName || '';
      let lName = initialData.lastName || '';
      
      if (!fName && !lName && initialData.name) {
        const parts = (initialData.name || '').split(' ');
        fName = parts.pop() || '';
        lName = parts.join(' ');
      }

      setFormData({
        firstName: fName,
        lastName: lName,
        birthYear: initialData.birthYear?.toString() || '',
        gender: initialData.gender || 'Nam',
        occupation: initialData.occupation || initialData.background || '',
        currentLevel: initialData.currentLevel || '',
        goal: initialData.goal || '',
        targetColor: initialData.targetColor || '#D0E8FF',
        fee: initialData.fee ? new Intl.NumberFormat('vi-VN').format(initialData.fee) : '',
        feeCycle: initialData.feeCycle?.toString() || '8',
        schedule: initialData.schedule || '',
        notes: initialData.notes || '',
        status: initialData.status || 'active'
      });
    }
  }, [initialData]);

  const handleFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value) {
      const formatted = new Intl.NumberFormat('vi-VN').format(Number(value));
      setFormData({ ...formData, fee: formatted });
    } else {
      setFormData({ ...formData, fee: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setFormError('');
    setFieldErrors({});
    
    const errors: Record<string, string> = {};
    const currentYear = new Date().getFullYear();

    if (!formData.lastName.trim()) errors.lastName = 'Vui lòng nhập Họ và Tên đệm.';
    if (!formData.firstName.trim()) errors.firstName = 'Vui lòng nhập Tên học viên.';
    
    if (formData.birthYear && (Number(formData.birthYear) < 1950 || Number(formData.birthYear) > currentYear)) {
      errors.birthYear = 'Năm sinh không hợp lệ.';
    }

    if (!formData.fee) {
      errors.fee = 'Vui lòng nhập Học phí mỗi buổi.';
    } else {
      const rawFeeStr = formData.fee.replace(/\D/g, '');
      if (!rawFeeStr || Number(rawFeeStr) <= 0) {
        errors.fee = 'Học phí phải lớn hơn 0.';
      }
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError('Vui lòng kiểm tra lại thông tin. Một số trường chưa hợp lệ.');
      return;
    }
    
    const rawFee = formData.fee.replace(/\D/g, '');
    const feeValue = rawFee ? Number(rawFee) : 0;
    const fullName = `${formData.lastName} ${formData.firstName}`.trim();
    
    const studentData: Student = {
      id: editingId || crypto.randomUUID(),
      name: fullName,
      firstName: formData.firstName,
      lastName: formData.lastName,
      order: editingId ? (students.find(s => s.id === editingId)?.order || 0) : students.length,
      birthYear: formData.birthYear ? Number(formData.birthYear) : '',
      gender: formData.gender,
      occupation: formData.occupation,
      currentLevel: formData.currentLevel,
      goal: formData.goal,
      targetColor: formData.targetColor,
      fee: feeValue,
      feeCycle: Number(formData.feeCycle) || 8,
      schedule: formData.schedule,
      notes: formData.notes,
      status: formData.status
    };

    setIsSubmitting(true);
    try {
      if (editingId) {
        await onUpdate(studentData);
      } else {
        await onAdd(studentData);
      }
      onClose();
    } catch (error) {
      setFormError('Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
      className="glass rounded-3xl shadow-[0_8px_32px_rgba(14,165,233,0.08)] border border-sky-300/30 p-6 mb-6 relative"
    >
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-sky-700/80 hover:text-sky-700/80"
      >
        <X className="w-5 h-5" />
      </button>
      <h2 className="text-xl font-bold text-sky-950 mb-6 pb-2 border-b border-sky-300/30">
        {editingId ? 'Sửa thông tin Học viên' : 'Thêm Học viên mới'}
      </h2>
      
      <AnimatePresence>
        {formError && (
          <motion.div 
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            className="mb-4 p-3 bg-rose-50 text-rose-700 text-sm rounded-xl border border-rose-200 flex items-start gap-2"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold">Có lỗi xảy ra</p>
              <p>{formError}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <form onSubmit={handleSubmit} className="space-y-8" noValidate>
        {/* Phần 1: Thông tin cơ bản */}
        <fieldset className="bg-sky-50/40 p-4 rounded-2xl border border-sky-300/30">
          <legend className="text-sm font-semibold text-sky-600 bg-sky-50 px-3 py-1 rounded-full mb-2 flex items-center">
            <User className="w-4 h-4 mr-1.5" />
            Phần 1: Thông tin cơ bản & Bối cảnh
          </legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-3">
            <div>
              <label className="block text-sm font-medium text-sky-900">Họ và Tên đệm <span className="text-rose-500">*</span></label>
              <input
                type="text"
                placeholder="VD: Nguyễn Văn"
                value={formData.lastName}
                onChange={e => {
                  setFormData({...formData, lastName: e.target.value});
                  if (fieldErrors.lastName) setFieldErrors({...fieldErrors, lastName: ''});
                }}
                className={`mt-1 block w-full rounded-xl shadow-sm sm:text-sm p-2 border bg-white text-sky-950 focus:ring-sky-500 ${fieldErrors.lastName ? 'border-rose-500 focus:border-rose-500' : 'border-sky-300/30 focus:border-sky-500'}`}
              />
              {fieldErrors.lastName && <p className="mt-1 text-xs text-rose-500">{fieldErrors.lastName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-sky-900">Tên <span className="text-rose-500">*</span></label>
              <input
                type="text"
                placeholder="VD: A"
                value={formData.firstName}
                onChange={e => {
                  setFormData({...formData, firstName: e.target.value});
                  if (fieldErrors.firstName) setFieldErrors({...fieldErrors, firstName: ''});
                }}
                className={`mt-1 block w-full rounded-xl shadow-sm sm:text-sm p-2 border bg-white text-sky-950 focus:ring-sky-500 ${fieldErrors.firstName ? 'border-rose-500 focus:border-rose-500' : 'border-sky-300/30 focus:border-sky-500'}`}
              />
              {fieldErrors.firstName && <p className="mt-1 text-xs text-rose-500">{fieldErrors.firstName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-sky-900">Năm sinh</label>
              <input
                type="number"
                placeholder="VD: 2009"
                value={formData.birthYear}
                onChange={e => {
                  setFormData({...formData, birthYear: e.target.value});
                  if (fieldErrors.birthYear) setFieldErrors({...fieldErrors, birthYear: ''});
                }}
                className={`mt-1 block w-full rounded-xl shadow-sm sm:text-sm p-2 border bg-white text-sky-950 focus:ring-sky-500 ${fieldErrors.birthYear ? 'border-rose-500 focus:border-rose-500' : 'border-sky-300/30 focus:border-sky-500'}`}
              />
              {fieldErrors.birthYear && <p className="mt-1 text-xs text-rose-500">{fieldErrors.birthYear}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-sky-900">Giới tính</label>
              <select
                value={formData.gender}
                onChange={e => setFormData({...formData, gender: e.target.value})}
                className="mt-1 block w-full rounded-xl border-sky-300/30 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2 border glass-panel"
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-sky-900">Nghề nghiệp / Bối cảnh</label>
              <input
                type="text"
                placeholder="VD: Học sinh, Nhân viên ngân hàng..."
                value={formData.occupation}
                onChange={e => setFormData({...formData, occupation: e.target.value})}
                className="mt-1 block w-full rounded-xl border-sky-300/30 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2 border glass-panel"
              />
            </div>
          </div>
        </fieldset>

        {/* Phần 2: Hồ sơ Học thuật */}
        <fieldset className="bg-sky-50/40 p-4 rounded-2xl border border-sky-300/30">
          <legend className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full mb-2 flex items-center">
            <BookOpen className="w-4 h-4 mr-1.5" />
            Phần 2: Hồ sơ Học thuật
          </legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-3">
            <div>
              <label className="block text-sm font-medium text-sky-900">Trình độ hiện tại</label>
              <select
                value={formData.currentLevel}
                onChange={e => setFormData({...formData, currentLevel: e.target.value})}
                className="mt-1 block w-full rounded-xl border-sky-300/30 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border glass-panel"
              >
                <option value="">Chọn trình độ...</option>
                <option value="Mất gốc">Mất gốc</option>
                <option value="A1">A1</option>
                <option value="A2">A2</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
                <option value="C1">C1</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-sky-900">Mục tiêu học tập</label>
              <input
                type="text"
                placeholder="VD: VSTEP, IELTS 6.5, Giao tiếp..."
                value={formData.goal}
                onChange={e => setFormData({...formData, goal: e.target.value})}
                className="mt-1 block w-full rounded-xl border-sky-300/30 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border glass-panel"
              />
              <div className="mt-3">
                <label className="block text-xs font-medium text-sky-700/80 mb-2">Màu sắc thẻ mục tiêu</label>
                <div className="flex flex-wrap gap-2">
                  {['#D0E8FF', '#D1F2EB', '#D4EFDF', '#FCF3CF', '#FDEBD0', '#FAE5D3', '#FADBD8', '#E8DAEF', '#D7BDE2', '#F5B7B1', '#E5E7E9', '#E6E2D3'].map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({...formData, targetColor: color})}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${formData.targetColor === color ? 'border-sky-600 scale-110 shadow-sm' : 'border-transparent hover:scale-110'}`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </fieldset>

        {/* Phần 3: Quản lý Tài chính & Ghi chú */}
        <fieldset className="bg-sky-50/40 p-4 rounded-2xl border border-sky-300/30">
          <legend className="text-sm font-semibold text-amber-600 bg-amber-50 px-3 py-1 rounded-full mb-2 flex items-center">
            <CreditCard className="w-4 h-4 mr-1.5" />
            Phần 3: Quản lý Tài chính & Ghi chú
          </legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-3">
            <div>
              <label className="block text-sm font-medium text-sky-900">Học phí mỗi buổi (VNĐ) <span className="text-rose-500">*</span></label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <input
                  type="text"
                  placeholder="VD: 200,000"
                  value={formData.fee}
                  onChange={e => {
                    handleFeeChange(e);
                    if (fieldErrors.fee) setFieldErrors({...fieldErrors, fee: ''});
                  }}
                  className={`block w-full rounded-xl shadow-sm sm:text-sm p-2 border bg-white text-sky-950 pr-12 focus:ring-amber-500 ${fieldErrors.fee ? 'border-rose-500 focus:border-rose-500' : 'border-sky-300/30 focus:border-amber-500'}`}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-sky-700/80 sm:text-sm">VNĐ</span>
                </div>
              </div>
              {fieldErrors.fee && <p className="mt-1 text-xs text-rose-500">{fieldErrors.fee}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-sky-900">Chu kỳ thu học phí</label>
              <select
                value={formData.feeCycle}
                onChange={e => setFormData({...formData, feeCycle: e.target.value})}
                className="mt-1 block w-full rounded-xl border-sky-300/30 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm p-2 border glass-panel"
              >
                <option value="8">8 buổi/lần</option>
                <option value="12">12 buổi/lần</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-sky-900">Lịch học ưu tiên</label>
              <input
                type="text"
                placeholder="VD: Tối Thứ 3/Thứ 5"
                value={formData.schedule}
                onChange={e => setFormData({...formData, schedule: e.target.value})}
                className="mt-1 block w-full rounded-xl border-sky-300/30 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm p-2 border glass-panel"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-sky-900">Trạng thái hoạt động</label>
              <select
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value as 'active' | 'inactive'})}
                className="mt-1 block w-full rounded-xl border-sky-300/30 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm p-2 border glass-panel"
              >
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Ngưng hoạt động</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-sky-900">Ghi chú riêng</label>
              <textarea
                rows={3}
                placeholder="Ghi chú về điểm mạnh, điểm yếu, lộ trình học..."
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
                className="mt-1 block w-full rounded-xl border-sky-300/30 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm p-2 border glass-panel"
              />
            </div>
          </div>
        </fieldset>

        <div className="flex justify-end pt-4 border-t border-sky-300/30">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="mr-3 glass-panel py-2 px-4 border border-sky-300/30 rounded-xl shadow-sm text-sm font-medium text-sky-900 hover:bg-sky-50/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-sky-600 py-2 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {editingId ? 'Lưu thay đổi' : 'Thêm Học viên'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
