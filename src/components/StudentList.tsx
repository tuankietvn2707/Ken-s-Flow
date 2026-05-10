import React from 'react';
import { Student, formatVND } from '../types';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVertical, Edit2, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { getAvatarColor } from './StudentManagementUtils';

interface Props {
  students: Student[];
  onUpdate: (student: Student) => void;
  onDelete: (id: string) => void;
  onSelect: (student: Student) => void;
  onEdit: (student: Student) => void;
}

export default function StudentList({ students, onUpdate, onDelete, onSelect, onEdit }: Props) {
  const sortedStudents = [...students].sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    const nameA = a.firstName || a.name || '';
    const nameB = b.firstName || b.name || '';
    return nameA.localeCompare(nameB, 'vi-VN');
  });

  const activeStudents = sortedStudents.filter(s => s.status !== 'inactive');
  const inactiveStudents = sortedStudents.filter(s => s.status === 'inactive');

  const toggleStudentStatus = (student: Student) => {
    const newStatus = student.status === 'inactive' ? 'active' : 'inactive';
    onUpdate({ ...student, status: newStatus });
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    const newStudents = Array.from(sortedStudents);
    const [reorderedItem] = newStudents.splice(sourceIndex, 1);
    newStudents.splice(destinationIndex, 0, reorderedItem);

    newStudents.forEach((student, index) => {
      if (student.order !== index) {
        onUpdate({ ...student, order: index });
      }
    });
  };

  const renderStudentRow = (student: Student, index: number, isInactive: boolean) => (
    // @ts-ignore: key is required by React but not in DraggableProps type
    <Draggable key={student.id} draggableId={student.id} index={index}>
      {(provided, snapshot) => (
        <tr 
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`hover:bg-theme-section transition-colors ${snapshot.isDragging ? 'bg-theme-section shadow-md' : ''} ${isInactive ? 'opacity-60 bg-theme-section' : ''}`}
        >
          <td className="px-6 py-4 whitespace-nowrap text-theme-muted">
            <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing p-1 hover:text-sky-600 rounded">
              <GripVertical className="w-5 h-5" />
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex flex-col items-start">
              <button 
                onClick={() => onSelect(student)}
                className="flex items-center gap-2 glass-panel hover:glass-active transition-colors rounded-full pr-3 pl-1 py-1 text-left"
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${getAvatarColor(student.id)}`}>
                  {student.firstName ? student.firstName.charAt(0).toUpperCase() : student.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-900">
                  {student.lastName} {student.firstName}
                </span>
              </button>
              <div className="text-xs text-theme-muted mt-1 ml-2">
                {student.birthYear ? `${student.birthYear} • ` : ''}
                {student.occupation || student.background || 'Chưa cập nhật'}
              </div>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(student); }}
              className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-gray-900 dark:text-gray-900 hover:opacity-80 transition-opacity"
              style={{ backgroundColor: student.targetColor || '#D1F2EB' }}
              title="Nhấn để sửa mục tiêu"
            >
              {student.goal || 'Chưa cập nhật'}
            </button>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-primary font-medium">
            {formatVND(student.fee)}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-muted">
            {student.schedule || 'Chưa xếp lịch'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm">
            <button
              onClick={() => toggleStudentStatus(student)}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 ${student.status === 'inactive' ? 'bg-sky-300' : 'bg-emerald-500'}`}
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
              onClick={(e) => { e.stopPropagation(); onEdit(student); }} 
              className="text-theme-muted hover:text-sky-600 mr-4 transition-colors"
              title="Sửa"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(student.id); }} 
              className="text-theme-muted hover:text-rose-600 transition-colors"
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
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass rounded-3xl overflow-hidden mb-8 border"
        style={{ 
          background: 'var(--card-bg)', 
          borderColor: 'var(--glass-border)',
          boxShadow: '0 8px 32px var(--glass-shadow)' 
        }}
      >
        <div className="px-6 py-4 border-b" style={{ background: 'var(--card-header-bg)', borderColor: 'var(--glass-border)' }}>
          <h2 className="text-lg font-semibold text-emerald-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Học viên đang hoạt động ({activeStudents.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-sky-300/40">
            <thead className="bg-theme-section border-b border-theme">
              <tr>
                <th scope="col" className="w-10 px-6 py-3"></th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">Họ và Tên</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">Mục tiêu</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">Học phí/Buổi</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">Lịch học</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">Trạng thái</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Thao tác</span></th>
              </tr>
            </thead>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="active-students-list">
                {(provided) => (
                  <tbody 
                    className="divide-y divide-[var(--glass-border)]"
                    style={{ background: 'var(--table-body-bg)' }}
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {activeStudents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-10 text-center text-sm" style={{ color: 'var(--table-body-empty-color)' }}>
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
      </motion.div>

      {inactiveStudents.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass rounded-3xl overflow-hidden opacity-80 border"
          style={{ 
            background: 'var(--card-bg)', 
            borderColor: 'var(--glass-border)',
            boxShadow: '0 8px 32px var(--glass-shadow)' 
          }}
        >
          <div className="px-6 py-4 border-b" style={{ background: 'var(--card-header-bg)', borderColor: 'var(--glass-border)' }}>
            <h2 className="text-lg font-semibold text-theme-muted flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
              Học viên ngưng hoạt động ({inactiveStudents.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-sky-300/40">
              <thead className="bg-theme-section border-b border-theme">
                <tr>
                  <th scope="col" className="w-10 px-6 py-3"></th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">Họ và Tên</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">Mục tiêu</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">Học phí/Buổi</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">Lịch học</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">Trạng thái</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Thao tác</span></th>
                </tr>
              </thead>
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="inactive-students-list">
                  {(provided) => (
                    <tbody 
                      className="divide-y divide-[var(--glass-border)]"
                      style={{ background: 'var(--table-body-bg)' }}
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
        </motion.div>
      )}
    </>
  );
}
