import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import { User, BookOpen, CreditCard, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Textarea } from './ui/Textarea';

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
    <Modal
      isOpen={true}
      onClose={onClose}
      title={editingId ? 'Sửa thông tin Học viên' : 'Thêm Học viên mới'}
      maxWidth="2xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {editingId ? 'Lưu thay đổi' : 'Thêm Học viên'}
          </Button>
        </>
      }
    >
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
      
      <form id="student-form" onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Phần 1: Thông tin cơ bản */}
        <fieldset className="bg-sky-50/40 p-4 rounded-2xl border border-sky-300/30">
          <legend className="text-sm font-semibold text-sky-600 bg-sky-50 px-3 py-1 rounded-full mb-2 flex items-center">
            <User className="w-4 h-4 mr-1.5" />
            Phần 1: Thông tin cơ bản & Bối cảnh
          </legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-3">
            <div>
              <label className="block text-sm font-medium text-sky-900 mb-1">Họ và Tên đệm <span className="text-rose-500">*</span></label>
              <Input
                type="text"
                placeholder="VD: Nguyễn Văn"
                value={formData.lastName}
                onChange={e => {
                  setFormData({...formData, lastName: e.target.value});
                  if (fieldErrors.lastName) setFieldErrors({...fieldErrors, lastName: ''});
                }}
                className={fieldErrors.lastName ? 'border-rose-500 focus-visible:ring-rose-500' : ''}
              />
              {fieldErrors.lastName && <p className="mt-1 text-xs text-rose-500">{fieldErrors.lastName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-sky-900 mb-1">Tên <span className="text-rose-500">*</span></label>
              <Input
                type="text"
                placeholder="VD: A"
                value={formData.firstName}
                onChange={e => {
                  setFormData({...formData, firstName: e.target.value});
                  if (fieldErrors.firstName) setFieldErrors({...fieldErrors, firstName: ''});
                }}
                className={fieldErrors.firstName ? 'border-rose-500 focus-visible:ring-rose-500' : ''}
              />
              {fieldErrors.firstName && <p className="mt-1 text-xs text-rose-500">{fieldErrors.firstName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-sky-900 mb-1">Năm sinh</label>
              <Input
                type="number"
                placeholder="VD: 2009"
                value={formData.birthYear}
                onChange={e => {
                  setFormData({...formData, birthYear: e.target.value});
                  if (fieldErrors.birthYear) setFieldErrors({...fieldErrors, birthYear: ''});
                }}
                className={fieldErrors.birthYear ? 'border-rose-500 focus-visible:ring-rose-500' : ''}
              />
              {fieldErrors.birthYear && <p className="mt-1 text-xs text-rose-500">{fieldErrors.birthYear}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-sky-900 mb-1">Giới tính</label>
              <Select
                value={formData.gender}
                onChange={e => setFormData({...formData, gender: e.target.value})}
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-sky-900 mb-1">Nghề nghiệp / Bối cảnh</label>
              <Input
                type="text"
                placeholder="VD: Học sinh, Nhân viên..."
                value={formData.occupation}
                onChange={e => setFormData({...formData, occupation: e.target.value})}
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
              <label className="block text-sm font-medium text-sky-900 mb-1">Trình độ hiện tại</label>
              <Select
                value={formData.currentLevel}
                onChange={e => setFormData({...formData, currentLevel: e.target.value})}
              >
                <option value="">Chọn trình độ...</option>
                <option value="Mất gốc">Mất gốc</option>
                <option value="A1">A1</option>
                <option value="A2">A2</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
                <option value="C1">C1</option>
                <option value="Khác">Khác</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-sky-900 mb-1">Mục tiêu học tập</label>
              <Input
                type="text"
                placeholder="VD: VSTEP, IELTS, Giao tiếp..."
                value={formData.goal}
                onChange={e => setFormData({...formData, goal: e.target.value})}
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
              <label className="block text-sm font-medium text-sky-900 mb-1">Học phí mỗi buổi (VNĐ) <span className="text-rose-500">*</span></label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="VD: 200,000"
                  value={formData.fee}
                  onChange={e => {
                    handleFeeChange(e);
                    if (fieldErrors.fee) setFieldErrors({...fieldErrors, fee: ''});
                  }}
                  className={`pr-12 ${fieldErrors.fee ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-sky-700/80 sm:text-sm">VNĐ</span>
                </div>
              </div>
              {fieldErrors.fee && <p className="mt-1 text-xs text-rose-500">{fieldErrors.fee}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-sky-900 mb-1">Chu kỳ thu học phí</label>
              <Select
                value={formData.feeCycle}
                onChange={e => setFormData({...formData, feeCycle: e.target.value})}
              >
                <option value="8">8 buổi/lần</option>
                <option value="12">12 buổi/lần</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-sky-900 mb-1">Lịch học ưu tiên</label>
              <Input
                type="text"
                placeholder="VD: Tối Thứ 3/Thứ 5"
                value={formData.schedule}
                onChange={e => setFormData({...formData, schedule: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-sky-900 mb-1">Trạng thái hoạt động</label>
              <Select
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value as 'active' | 'inactive'})}
              >
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Ngưng hoạt động</option>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-sky-900 mb-1">Ghi chú riêng</label>
              <Textarea
                rows={3}
                placeholder="Ghi chú về điểm mạnh, điểm yếu, lộ trình học..."
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
              />
            </div>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}
