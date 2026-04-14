import React, { useState, useEffect } from 'react';
import { Student, ClassSession, formatVND } from '../types';
import { Plus, Edit2, Trash2, X, User, BookOpen, CreditCard, Calendar, FileText, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { motion } from 'motion/react';

const avatarColors = [
  'bg-red-100 text-red-600',
  'bg-orange-100 text-orange-600',
  'bg-amber-100 text-amber-600',
  'bg-green-100 text-green-600',
  'bg-emerald-100 text-emerald-600',
  'bg-teal-100 text-teal-600',
  'bg-cyan-100 text-cyan-600',
  'bg-blue-100 text-blue-600',
  'bg-indigo-100 text-indigo-600',
  'bg-violet-100 text-violet-600',
  'bg-purple-100 text-purple-600',
  'bg-fuchsia-100 text-fuchsia-600',
  'bg-pink-100 text-pink-600',
  'bg-rose-100 text-rose-600'
];

const getAvatarColor = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
};

interface Props {
  students: Student[];
  addStudent: (student: Student) => void;
  updateStudent: (student: Student) => void;
  deleteStudent: (id: string) => void;
  classes: ClassSession[];
  markClassesAsPaid?: (studentId: string, classIds: string[]) => void;
}

export default function StudentManagement({ students, addStudent, updateStudent, deleteStudent, classes, markClassesAsPaid }: Props) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths(prev => ({ ...prev, [monthKey]: !prev[monthKey] }));
  };
  
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Remove non-numeric characters for fee
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

    if (editingId) {
      updateStudent(studentData);
    } else {
      addStudent(studentData);
    }
    
    closeForm();
  };

  const handleFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Format as user types
    const value = e.target.value.replace(/\D/g, '');
    if (value) {
      const formatted = new Intl.NumberFormat('vi-VN').format(Number(value));
      setFormData({ ...formData, fee: formatted });
    } else {
      setFormData({ ...formData, fee: '' });
    }
  };

  const editStudent = (student: Student) => {
    // Try to split name if firstName/lastName aren't set
    let fName = student.firstName || '';
    let lName = student.lastName || '';
    
    if (!fName && !lName && student.name) {
      const parts = student.name.split(' ');
      fName = parts.pop() || '';
      lName = parts.join(' ');
    }

    setFormData({
      firstName: fName,
      lastName: lName,
      birthYear: student.birthYear?.toString() || '',
      gender: student.gender || 'Nam',
      occupation: student.occupation || student.background || '',
      currentLevel: student.currentLevel || '',
      goal: student.goal || '',
      targetColor: student.targetColor || '#D0E8FF',
      fee: student.fee ? new Intl.NumberFormat('vi-VN').format(student.fee) : '',
      feeCycle: student.feeCycle?.toString() || '8',
      schedule: student.schedule || '',
      notes: student.notes || '',
      status: student.status || 'active'
    });
    setEditingId(student.id);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    // Removed window.confirm due to iframe restrictions
    deleteStudent(id);
    if (selectedStudent?.id === id) {
      setSelectedStudent(null);
    }
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({ firstName: '', lastName: '', birthYear: '', gender: 'Nam', occupation: '', currentLevel: '', goal: '', targetColor: '#D0E8FF', fee: '', feeCycle: '8', schedule: '', notes: '', status: 'active' });
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    const newStudents = Array.from(sortedStudents);
    const [reorderedItem] = newStudents.splice(sourceIndex, 1);
    newStudents.splice(destinationIndex, 0, reorderedItem);

    // Update order for all affected items
    newStudents.forEach((student, index) => {
      if (student.order !== index) {
        updateStudent({ ...student, order: index });
      }
    });
  };

  const getUnpaidAmount = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return 0;
    
    const unpaidSessions = classes.filter(c => c.studentId === studentId && !c.isPaid);
    const totalDuration = unpaidSessions.reduce((sum, c) => sum + c.duration, 0);
    return totalDuration * student.fee;
  };

  const renderClassCard = (cls: ClassSession, idx: number, isPaid: boolean) => (
    <div key={cls.id} className="bg-white rounded-[20px] border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className={`${isPaid ? 'bg-emerald-50/50' : 'bg-blue-50/50'} px-6 py-3 border-b border-slate-200 flex justify-between items-center`}>
        <div className={`font-bold ${isPaid ? 'text-emerald-900' : 'text-blue-900'}`}>
          Buổi {idx + 1} <span className="text-slate-500 font-normal ml-2">({new Date(cls.date).toLocaleDateString('vi-VN')})</span>
        </div>
        <div className="text-sm font-medium text-slate-600 bg-white px-2 py-1 rounded border border-slate-200">
          {cls.duration} buổi
        </div>
      </div>
      <div className="p-6">
        <div className="mb-5 pb-5 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Chủ đề / Nội dung</p>
          <p className="text-slate-900 font-medium text-lg">{cls.topic || '—'}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <p className="text-sm font-semibold text-emerald-700 mb-1 flex items-center gap-2">👍 Điểm mạnh</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{cls.strengths || '—'}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-rose-700 mb-1 flex items-center gap-2">👎 Điểm yếu</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{cls.weaknesses || '—'}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-red-600 mb-1 flex items-center gap-2">❌ Các lỗi sai</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{cls.mistakes || '—'}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-600 mb-1 flex items-center gap-2">🛠️ Cách khắc phục</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{cls.remedies || '—'}</p>
          </div>
          <div className="md:col-span-2 lg:col-span-2">
            <p className="text-sm font-semibold text-indigo-600 mb-1 flex items-center gap-2">📝 Ghi chú kế hoạch buổi tiếp theo</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{cls.nextLessonPrep || '—'}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const sortedStudents = [...students].sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    // Fallback to alphabetical by firstName if order is not set
    const nameA = a.firstName || a.name || '';
    const nameB = b.firstName || b.name || '';
    return nameA.localeCompare(nameB, 'vi-VN');
  });

  const activeStudents = sortedStudents.filter(s => s.status !== 'inactive');
  const inactiveStudents = sortedStudents.filter(s => s.status === 'inactive');

  const toggleStudentStatus = (student: Student) => {
    const newStatus = student.status === 'inactive' ? 'active' : 'inactive';
    updateStudent({ ...student, status: newStatus });
  };

  const renderStudentRow = (student: Student, index: number, isInactive: boolean) => (
    // @ts-ignore: key is required by React but not in DraggableProps type
    <Draggable key={student.id} draggableId={student.id} index={index}>
      {(provided, snapshot) => (
        <tr 
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`hover:bg-slate-50 transition-colors ${snapshot.isDragging ? 'bg-indigo-50/50 shadow-md' : ''} ${isInactive ? 'opacity-60 bg-slate-50' : ''}`}
        >
          <td className="px-6 py-4 whitespace-nowrap text-slate-400">
            <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing p-1 hover:text-indigo-600 rounded">
              <GripVertical className="w-5 h-5" />
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex flex-col items-start">
              <button 
                onClick={() => setSelectedStudent(student)}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 transition-colors rounded-full pr-3 pl-1 py-1 text-left"
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${getAvatarColor(student.id)}`}>
                  {student.firstName ? student.firstName.charAt(0).toUpperCase() : student.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-800">
                  {student.lastName} {student.firstName}
                </span>
              </button>
              <div className="text-xs text-slate-500 mt-1 ml-2">
                {student.birthYear ? `${student.birthYear} • ` : ''}
                {student.occupation || student.background || 'Chưa cập nhật'}
              </div>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <button 
              onClick={(e) => { e.stopPropagation(); editStudent(student); }}
              className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-gray-800 hover:opacity-80 transition-opacity"
              style={{ backgroundColor: student.targetColor || '#D1F2EB' }}
              title="Nhấn để sửa mục tiêu"
            >
              {student.goal || 'Chưa cập nhật'}
            </button>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">
            {formatVND(student.fee)}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
            {student.schedule || 'Chưa xếp lịch'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm">
            <button
              onClick={() => toggleStudentStatus(student)}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${student.status === 'inactive' ? 'bg-slate-300' : 'bg-emerald-500'}`}
              role="switch"
              aria-checked={student.status !== 'inactive'}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${student.status === 'inactive' ? 'translate-x-0' : 'translate-x-4'}`}
              />
            </button>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <button 
              onClick={(e) => { e.stopPropagation(); editStudent(student); }} 
              className="text-slate-400 hover:text-indigo-600 mr-4 transition-colors"
              title="Sửa"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleDelete(student.id); }} 
              className="text-slate-400 hover:text-rose-600 transition-colors"
              title="Xóa"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </td>
        </tr>
      )}
    </Draggable>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Quản lý Học viên</h1>
        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm Học viên
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white shadow-[0_10px_30px_rgba(0,0,0,0.04)] rounded-[20px] border border-slate-100 p-6 mb-6 relative">
          <button 
            onClick={closeForm}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-slate-900 mb-6 pb-2 border-b border-slate-100">
            {editingId ? 'Sửa thông tin Học viên' : 'Thêm Học viên mới'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Phần 1: Thông tin cơ bản */}
            <fieldset className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <legend className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mb-2 flex items-center">
                <User className="w-4 h-4 mr-1.5" />
                Phần 1: Thông tin cơ bản & Bối cảnh
              </legend>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Họ và Tên đệm <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Nguyễn Văn"
                    value={formData.lastName}
                    onChange={e => setFormData({...formData, lastName: e.target.value})}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Tên <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="VD: A"
                    value={formData.firstName}
                    onChange={e => setFormData({...formData, firstName: e.target.value})}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Năm sinh</label>
                  <input
                    type="number"
                    placeholder="VD: 2009"
                    value={formData.birthYear}
                    onChange={e => setFormData({...formData, birthYear: e.target.value})}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Giới tính</label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({...formData, gender: e.target.value})}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Nghề nghiệp / Bối cảnh</label>
                  <input
                    type="text"
                    placeholder="VD: Học sinh, Nhân viên ngân hàng..."
                    value={formData.occupation}
                    onChange={e => setFormData({...formData, occupation: e.target.value})}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white"
                  />
                </div>
              </div>
            </fieldset>

            {/* Phần 2: Hồ sơ Học thuật */}
            <fieldset className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <legend className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full mb-2 flex items-center">
                <BookOpen className="w-4 h-4 mr-1.5" />
                Phần 2: Hồ sơ Học thuật
              </legend>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Trình độ hiện tại</label>
                  <select
                    value={formData.currentLevel}
                    onChange={e => setFormData({...formData, currentLevel: e.target.value})}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border bg-white"
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
                  <label className="block text-sm font-medium text-slate-700">Mục tiêu học tập</label>
                  <input
                    type="text"
                    placeholder="VD: VSTEP, IELTS 6.5, Giao tiếp..."
                    value={formData.goal}
                    onChange={e => setFormData({...formData, goal: e.target.value})}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border bg-white"
                  />
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-slate-500 mb-2">Màu sắc thẻ mục tiêu</label>
                    <div className="flex flex-wrap gap-2">
                      {['#D0E8FF', '#D1F2EB', '#D4EFDF', '#FCF3CF', '#FDEBD0', '#FAE5D3', '#FADBD8', '#E8DAEF', '#D7BDE2', '#F5B7B1', '#E5E7E9', '#E6E2D3'].map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData({...formData, targetColor: color})}
                          className={`w-6 h-6 rounded-full border-2 transition-all ${formData.targetColor === color ? 'border-slate-600 scale-110 shadow-sm' : 'border-transparent hover:scale-110'}`}
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
            <fieldset className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <legend className="text-sm font-semibold text-amber-600 bg-amber-50 px-3 py-1 rounded-full mb-2 flex items-center">
                <CreditCard className="w-4 h-4 mr-1.5" />
                Phần 3: Quản lý Tài chính & Ghi chú
              </legend>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Học phí mỗi buổi (VNĐ) <span className="text-rose-500">*</span></label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="text"
                      required
                      placeholder="VD: 200,000"
                      value={formData.fee}
                      onChange={handleFeeChange}
                      className="block w-full rounded-md border-slate-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm p-2 border bg-white pr-12"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-slate-500 sm:text-sm">VNĐ</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Chu kỳ thu học phí</label>
                  <select
                    value={formData.feeCycle}
                    onChange={e => setFormData({...formData, feeCycle: e.target.value})}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm p-2 border bg-white"
                  >
                    <option value="8">8 buổi/lần</option>
                    <option value="12">12 buổi/lần</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Lịch học ưu tiên</label>
                  <input
                    type="text"
                    placeholder="VD: Tối Thứ 3/Thứ 5"
                    value={formData.schedule}
                    onChange={e => setFormData({...formData, schedule: e.target.value})}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm p-2 border bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Trạng thái hoạt động</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as 'active' | 'inactive'})}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm p-2 border bg-white"
                  >
                    <option value="active">Đang hoạt động</option>
                    <option value="inactive">Ngưng hoạt động</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700">Ghi chú riêng</label>
                  <textarea
                    rows={3}
                    placeholder="Ghi chú về điểm mạnh, điểm yếu, lộ trình học..."
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm p-2 border bg-white"
                  />
                </div>
              </div>
            </fieldset>

            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={closeForm}
                className="mr-3 bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {editingId ? 'Lưu thay đổi' : 'Thêm Học viên'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow-[0_10px_30px_rgba(0,0,0,0.04)] rounded-[20px] border border-slate-100 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-slate-100 bg-emerald-50/50">
          <h2 className="text-lg font-semibold text-emerald-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Học viên đang hoạt động ({activeStudents.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="w-10 px-6 py-3"></th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Họ và Tên</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Mục tiêu</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Học phí/Buổi</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Lịch học</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Trạng thái</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Thao tác</span></th>
              </tr>
            </thead>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="active-students-list">
                {(provided) => (
                  <tbody 
                    className="bg-white divide-y divide-slate-200"
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {activeStudents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500">
                          Chưa có học viên nào đang hoạt động.
                        </td>
                      </tr>
                    ) : (
                      activeStudents.map((student, index) => renderStudentRow(student, index, false))
                    )}
                    {provided.placeholder}
                  </tbody>
                )}
              </Droppable>
            </DragDropContext>
          </table>
        </div>
      </div>

      {inactiveStudents.length > 0 && (
        <div className="bg-white shadow-[0_10px_30px_rgba(0,0,0,0.04)] rounded-[20px] border border-slate-100 overflow-hidden opacity-80">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-100">
            <h2 className="text-lg font-semibold text-slate-600 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              Học viên ngưng hoạt động ({inactiveStudents.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="w-10 px-6 py-3"></th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Họ và Tên</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Mục tiêu</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Học phí/Buổi</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Lịch học</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Trạng thái</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Thao tác</span></th>
                </tr>
              </thead>
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="inactive-students-list">
                  {(provided) => (
                    <tbody 
                      className="bg-white divide-y divide-slate-200"
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                    >
                      {inactiveStudents.map((student, index) => renderStudentRow(student, index, true))}
                      {provided.placeholder}
                    </tbody>
                  )}
                </Droppable>
              </DragDropContext>
            </table>
          </div>
        </div>
      )}

      {/* Modal Chi tiết Học viên */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div className="fixed inset-0 bg-slate-500/30 transition-opacity" aria-hidden="true" onClick={() => setSelectedStudent(null)}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="relative z-10 inline-flex flex-col align-bottom bg-slate-50 rounded-[20px] text-left overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.08)] transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full max-h-[90vh]">
              <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
                <h3 className="text-xl font-bold text-slate-900" id="modal-title">
                  Hồ sơ Học viên: {selectedStudent.name}
                </h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setSelectedStudent(null);
                      editStudent(selectedStudent);
                    }}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md transition-colors"
                  >
                    Sửa hồ sơ
                  </button>
                  <button 
                    onClick={() => setSelectedStudent(null)}
                    className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full p-1.5 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Phần 1: Thông tin cơ bản */}
                <div className="bg-white rounded-[20px] border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.04)] p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className={`h-20 w-20 rounded-full flex items-center justify-center font-bold text-3xl shrink-0 ${getAvatarColor(selectedStudent.id)}`}>
                      {selectedStudent.firstName ? selectedStudent.firstName.charAt(0).toUpperCase() : selectedStudent.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Họ và Tên</p>
                        <p className="font-semibold text-slate-900">{selectedStudent.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Năm sinh</p>
                        <p className="font-semibold text-slate-900">{selectedStudent.birthYear || '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Trình độ hiện tại</p>
                        <p className="font-semibold text-slate-900">{selectedStudent.currentLevel || '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Mục tiêu</p>
                        {selectedStudent.goal ? (
                          <button 
                            onClick={() => {
                              setSelectedStudent(null);
                              editStudent(selectedStudent);
                            }}
                            className="px-3 py-1 inline-flex text-sm font-semibold rounded-full text-gray-800 hover:opacity-80 transition-opacity"
                            style={{ backgroundColor: selectedStudent.targetColor || '#D1F2EB' }}
                            title="Nhấn để sửa mục tiêu"
                          >
                            {selectedStudent.goal}
                          </button>
                        ) : (
                          <p className="font-semibold text-slate-900">—</p>
                        )}
                      </div>
                      <div className="md:col-span-4">
                        <p className="text-sm text-slate-500 mb-1">Lịch học</p>
                        <p className="font-semibold text-slate-900">{selectedStudent.schedule || '—'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Phần 2: Theo dõi buổi học */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                    Theo dõi buổi học (Đợt hiện tại)
                  </h3>
                  
                  <div className="space-y-4">
                    {(() => {
                      const unpaidClasses = classes.filter(c => c.studentId === selectedStudent.id && !c.isPaid);
                      unpaidClasses.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                      const paidClassesCount = classes.filter(c => c.studentId === selectedStudent.id && c.isPaid).length;
                      
                      if (unpaidClasses.length === 0) {
                        return (
                          <div className="text-center py-10 bg-white rounded-[20px] border border-slate-200 border-dashed">
                            <p className="text-slate-500">Chưa có buổi học nào trong đợt này.</p>
                          </div>
                        );
                      }

                      return unpaidClasses.map((cls, idx) => renderClassCard(cls, paidClassesCount + idx, false));
                    })()}
                  </div>
                </div>

                {/* Phần 2.5: Lịch sử học tập */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-emerald-600" />
                    Lịch sử học tập (Đã thanh toán)
                  </h3>
                  
                  <div className="space-y-4">
                    {(() => {
                      const paidClasses = classes.filter(c => c.studentId === selectedStudent.id && c.isPaid);
                      if (paidClasses.length === 0) {
                        return (
                          <div className="text-center py-10 bg-white rounded-[20px] border border-slate-200 border-dashed">
                            <p className="text-slate-500">Chưa có lịch sử học tập.</p>
                          </div>
                        );
                      }

                      paidClasses.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                      const classesWithIndex = paidClasses.map((cls, idx) => ({ cls, idx }));
                      classesWithIndex.sort((a, b) => new Date(b.cls.date).getTime() - new Date(a.cls.date).getTime());

                      const groupedClasses: Record<string, {cls: ClassSession, idx: number}[]> = {};
                      classesWithIndex.forEach(item => {
                        const date = new Date(item.cls.date);
                        const monthYear = `Tháng ${date.getMonth() + 1}/${date.getFullYear()}`;
                        if (!groupedClasses[monthYear]) {
                          groupedClasses[monthYear] = [];
                        }
                        groupedClasses[monthYear].push(item);
                      });

                      return Object.entries(groupedClasses).map(([monthYear, monthClasses]) => (
                        <div key={monthYear} className="bg-white rounded-[20px] border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.04)] overflow-hidden">
                          <button
                            onClick={() => toggleMonth(monthYear)}
                            className="w-full px-6 py-4 flex justify-between items-center bg-slate-50 hover:bg-slate-100 transition-colors"
                          >
                            <div className="font-bold text-slate-800">
                              {monthYear} <span className="text-slate-500 font-normal ml-2">({monthClasses.length} buổi)</span>
                            </div>
                            {expandedMonths[monthYear] ? (
                              <ChevronUp className="w-5 h-5 text-slate-500" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-slate-500" />
                            )}
                          </button>
                          {expandedMonths[monthYear] && (
                            <div className="p-4 space-y-4 bg-slate-50/50">
                              {monthClasses.map(({ cls, idx }) => renderClassCard(cls, idx, true))}
                            </div>
                          )}
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Phần 3: Tóm tắt tài chính */}
                <div className="bg-white rounded-[20px] border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.04)] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Tóm tắt tài chính</p>
                    <div className="flex items-baseline gap-3">
                      <p className="text-2xl font-bold text-slate-900">{formatVND(getUnpaidAmount(selectedStudent.id))}</p>
                      <p className="text-sm font-medium text-slate-600">
                        ({classes.filter(c => c.studentId === selectedStudent.id && !c.isPaid).reduce((sum, c) => sum + c.duration, 0)} buổi chưa thanh toán)
                      </p>
                    </div>
                  </div>
                  {markClassesAsPaid && getUnpaidAmount(selectedStudent.id) > 0 && (
                    <button 
                      onClick={() => {
                        const unpaidIds = classes.filter(c => c.studentId === selectedStudent.id && !c.isPaid).map(c => c.id);
                        if (unpaidIds.length > 0) {
                          markClassesAsPaid(selectedStudent.id, unpaidIds);
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm whitespace-nowrap"
                    >
                      Đã thanh toán
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
