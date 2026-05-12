import React, { useState, useMemo, useEffect } from 'react';
import { Student, ClassSession, formatVND } from '../types';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVertical, Edit2, Trash2, Search, Filter, LayoutGrid, List, AlertTriangle, MoreVertical, Calendar, DollarSign, BookOpen, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getAvatarColor } from './StudentManagementUtils';
import { Select } from './ui/Select';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';

interface Props {
  students: Student[];
  classes?: ClassSession[];
  onUpdate: (student: Student) => void;
  onDelete: (id: string) => void;
  onSelect: (student: Student) => void;
  onEdit: (student: Student) => void;
}

export default function StudentList({ students, classes = [], onUpdate, onDelete, onSelect, onEdit }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'unpaid' | 'upcoming' | 'inactive'>('all');
  
  const [sortBy, setSortBy] = useState<'order' | 'nameAsc' | 'nameDesc' | 'feeDesc'>(() => {
    const saved = localStorage.getItem('tutorflow_sortBy');
    return (saved as any) || 'order';
  });
  
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    const saved = localStorage.getItem('tutorflow_viewMode');
    return (saved as any) || 'list';
  });

  useEffect(() => {
    localStorage.setItem('tutorflow_sortBy', sortBy);
  }, [sortBy]);

  useEffect(() => {
    localStorage.setItem('tutorflow_viewMode', viewMode);
  }, [viewMode]);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const studentStats = useMemo(() => {
    const stats: Record<string, { unpaidCount: number, hasUpcoming: boolean }> = {};
    const today = new Date().toISOString().split('T')[0];
    
    students.forEach(s => {
      const studentClasses = classes.filter(c => c.studentId === s.id);
      const unpaidCount = studentClasses.filter(c => !c.isPaid).length;
      const hasUpcoming = studentClasses.some(c => c.date >= today);
      stats[s.id] = { unpaidCount, hasUpcoming };
    });
    return stats;
  }, [students, classes]);

  const filteredAndSortedStudents = useMemo(() => {
    let result = [...students];

    // Search
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.name?.toLowerCase().includes(lowerQ) || 
        s.firstName?.toLowerCase().includes(lowerQ) || 
        s.lastName?.toLowerCase().includes(lowerQ) ||
        s.occupation?.toLowerCase().includes(lowerQ) ||
        s.goal?.toLowerCase().includes(lowerQ)
      );
    }

    // Filter
    if (filter === 'active') {
      result = result.filter(s => s.status !== 'inactive');
    } else if (filter === 'inactive') {
      result = result.filter(s => s.status === 'inactive');
    } else if (filter === 'unpaid') {
      result = result.filter(s => s.status !== 'inactive' && studentStats[s.id]?.unpaidCount > 0);
    } else if (filter === 'upcoming') {
      result = result.filter(s => s.status !== 'inactive' && studentStats[s.id]?.hasUpcoming);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'nameAsc') {
        const nameA = a.firstName || a.name || '';
        const nameB = b.firstName || b.name || '';
        return nameA.localeCompare(nameB, 'vi-VN');
      } else if (sortBy === 'nameDesc') {
        const nameA = a.firstName || a.name || '';
        const nameB = b.firstName || b.name || '';
        return nameB.localeCompare(nameA, 'vi-VN');
      } else if (sortBy === 'feeDesc') {
        return (b.fee || 0) - (a.fee || 0);
      }
      // order
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      return 0;
    });

    return result;
  }, [students, studentStats, searchQuery, filter, sortBy]);

  const toggleStudentStatus = (student: Student) => {
    const newStatus = student.status === 'inactive' ? 'active' : 'inactive';
    onUpdate({ ...student, status: newStatus });
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination || filter !== 'active' || sortBy !== 'order' || searchQuery) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    if (sourceIndex === destinationIndex) return;

    const newStudents = [...filteredAndSortedStudents];
    const [reorderedItem] = newStudents.splice(sourceIndex, 1);
    newStudents.splice(destinationIndex, 0, reorderedItem);

    newStudents.forEach((student, index) => {
      if (student.order !== index) {
        onUpdate({ ...student, order: index });
      }
    });
  };

  // Status editable badge wrapper
  const StatusBadgeItem = ({ student }: { student: Student }) => (
    <div onClick={(e) => e.stopPropagation()}>
      <Select
        value={student.status || 'active'}
        onChange={(e) => onUpdate({ ...student, status: e.target.value as 'active' | 'inactive' })}
        className={`text-xs font-semibold rounded-full px-3 py-1 cursor-pointer border-0 ring-1 focus:ring-2 focus:ring-sky-500 text-center h-auto pr-6 ${
          student.status === 'inactive' 
          ? 'bg-gray-100 text-gray-600 ring-gray-200 hover:bg-gray-200' 
          : 'bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100'
        }`}
      >
        <option value="active">Hoạt động</option>
        <option value="inactive">Ngưng</option>
      </Select>
    </div>
  );

  const renderGridItem = (student: Student) => (
    <motion.div 
      key={student.id}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group ${student.status === 'inactive' ? 'opacity-70 border-gray-200' : 'border-sky-100 ring-inset hover:ring-1 hover:ring-sky-300'}`}
      onClick={() => onSelect(student)}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl shadow-sm ${getAvatarColor(student.id)}`}>
          {student.firstName ? student.firstName.charAt(0).toUpperCase() : student.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex items-center gap-2">
          <StatusBadgeItem student={student} />
        </div>
      </div>
      <div>
        <h3 className="font-bold text-sky-950 text-lg line-clamp-1 group-hover:text-sky-700 transition-colors">
          {student.lastName} {student.firstName}
        </h3>
        <p className="text-sm text-sky-700/70 mb-3">{student.occupation || 'Chưa cập nhật nghề nghiệp'}</p>
        
        <div className="space-y-2 mt-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-sky-700/60 flex items-center gap-1.5"><BookOpen className="w-4 h-4"/> Mục tiêu</span>
            <span className="font-semibold text-sky-900 px-2 py-0.5 rounded-md" style={{ backgroundColor: student.targetColor || '#f1f5f9' }}>
              {student.goal || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-sky-700/60 flex items-center gap-1.5"><Wallet className="w-4 h-4"/> Học phí</span>
            <span className="font-semibold text-sky-900">{formatVND(student.fee)}</span>
          </div>
        </div>
        
        <div className="mt-5 pt-4 border-t border-sky-50 flex items-center justify-between">
          <Button 
            variant="secondary"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onEdit(student); }}
          >
            Chỉnh sửa
          </Button>
          <Button 
            variant="danger"
            size="icon"
            onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(student.id); }}
            className="w-8 h-8 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );

  const renderListItem = (student: Student, index: number, provided?: any, snapshot?: any) => {
    const isInactive = student.status === 'inactive';
    const rowClass = `bg-white hover:bg-sky-50/50 transition-colors border-b border-sky-50 last:border-0 group cursor-pointer
      ${snapshot && snapshot.isDragging ? 'shadow-lg ring-1 ring-sky-300' : ''}
      ${isInactive ? 'opacity-70 bg-gray-50' : ''}
    `;

    return (
      <tr 
        ref={provided?.innerRef}
        {...provided?.draggableProps}
        className={rowClass}
        onClick={() => onSelect(student)}
      >
        <td className="px-4 py-4 whitespace-nowrap w-12">
          {provided && filter === 'active' && sortBy === 'order' && !searchQuery ? (
            <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-sky-100 text-sky-300 hover:text-sky-600 rounded-lg transition-colors inline-flex">
              <GripVertical className="w-5 h-5" />
            </div>
          ) : (
            <div className="w-8"></div> // spacer
          )}
        </td>
        <td className="px-4 py-4 whitespace-nowrap">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm ${getAvatarColor(student.id)}`}>
              {student.firstName ? student.firstName.charAt(0).toUpperCase() : student.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-bold text-sky-950 group-hover:text-sky-700 transition-colors">
                {student.lastName} {student.firstName}
              </div>
              <div className="text-xs text-sky-700/70 mt-0.5">
                {student.occupation || 'Chưa cập nhật'}
              </div>
            </div>
          </div>
        </td>
        <td className="px-4 py-4 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <StatusBadgeItem student={student} />
          </div>
        </td>
        <td className="px-4 py-4 whitespace-nowrap">
          <span 
            className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-lg text-gray-900 border border-black/5"
            style={{ backgroundColor: student.targetColor || '#f1f5f9' }}
          >
            {student.goal || 'Chưa cập nhật'}
          </span>
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-sm text-sky-950 font-semibold">
          {formatVND(student.fee)}
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-right">
          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              variant="outline"
              size="icon"
              onClick={(e) => { e.stopPropagation(); onEdit(student); }} 
              className="w-8 h-8 rounded-lg"
              title="Sửa"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="danger"
              size="icon" 
              onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(student.id); }} 
              className="w-8 h-8 rounded-lg"
              title="Xóa"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <Card className="p-4 flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex w-full lg:w-1/3 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-sky-400" />
          <Input 
            type="text" 
            placeholder="Tìm kiếm học viên..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 bg-sky-50/50"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center bg-sky-50/50 p-1 rounded-xl border border-sky-100">
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => setFilter('all')} 
              className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors h-auto ${filter === 'all' ? 'bg-white shadow-sm text-sky-900 border border-sky-200/50 hover:bg-white' : 'text-sky-600 hover:text-sky-900'}`}
            >
              Tất cả
            </Button>
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => setFilter('active')} 
              className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors h-auto ${filter === 'active' ? 'bg-white shadow-sm text-sky-900 border border-sky-200/50 hover:bg-white' : 'text-sky-600 hover:text-sky-900'}`}
            >
              Hoạt động
            </Button>
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => setFilter('unpaid')} 
              className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors h-auto ${filter === 'unpaid' ? 'bg-white shadow-sm text-sky-900 border border-sky-200/50 hover:bg-white' : 'text-sky-600 hover:text-sky-900'}`}
            >
              Chưa đóng phí
            </Button>
          </div>

          <div className="h-6 w-px bg-sky-200 hidden sm:block"></div>

          <Select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-auto truncate"
          >
            <option value="order">Sắp xếp tùy chỉnh</option>
            <option value="nameAsc">Tên (A-Z)</option>
            <option value="nameDesc">Tên (Z-A)</option>
            <option value="feeDesc">Học phí (Cao-Thấp)</option>
          </Select>

          <div className="flex items-center bg-sky-50/50 p-1 rounded-xl border border-sky-100 hidden sm:flex">
            <Button 
              variant="ghost"
              size="icon"
              onClick={() => setViewMode('list')} 
              className={`p-1.5 rounded-lg transition-colors h-8 w-8 ${viewMode === 'list' ? 'bg-white shadow-sm text-sky-700 hover:bg-white' : 'text-sky-400 hover:text-sky-700'}`}
              title="Danh sách"
            >
              <List className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost"
              size="icon"
              onClick={() => setViewMode('grid')} 
              className={`p-1.5 rounded-lg transition-colors h-8 w-8 ${viewMode === 'grid' ? 'bg-white shadow-sm text-sky-700 hover:bg-white' : 'text-sky-400 hover:text-sky-700'}`}
              title="Lưới"
            >
              <LayoutGrid className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {filteredAndSortedStudents.length === 0 ? (
          <motion.div 
            key="empty"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="bg-white rounded-3xl border border-sky-100 p-12 flex flex-col items-center justify-center text-center shadow-sm"
          >
            <div className="w-24 h-24 bg-sky-50 rounded-full flex items-center justify-center mb-6">
              <Search className="w-10 h-10 text-sky-300" />
            </div>
            <h3 className="text-xl font-bold text-sky-900 mb-2">Không tìm thấy học viên</h3>
            <p className="text-sky-600 max-w-md">
              Không có học viên nào khớp với điều kiện tìm kiếm/lọc hiện tại. Vui lòng thay đổi bộ lọc hoặc thêm học viên mới.
            </p>
          </motion.div>
        ) : (
          viewMode === 'grid' ? (
            <motion.div 
              key="grid"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filteredAndSortedStudents.map(student => renderGridItem(student))}
            </motion.div>
          ) : (
            <motion.div 
              key="list"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-sky-100 overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-sky-50/80 border-b border-sky-100">
                    <tr>
                      <th scope="col" className="w-10 px-4 py-3"></th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-sky-800 uppercase tracking-wider">Học sinh</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-sky-800 uppercase tracking-wider">Trạng thái</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-sky-800 uppercase tracking-wider">Mục tiêu</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-sky-800 uppercase tracking-wider">Học phí/buổi</th>
                      <th scope="col" className="relative px-4 py-3"><span className="sr-only">Thao tác</span></th>
                    </tr>
                  </thead>
                  {filter === 'active' && sortBy === 'order' && !searchQuery ? (
                    <DragDropContext onDragEnd={onDragEnd}>
                      <Droppable droppableId="student-list">
                        {(provided) => (
                          <tbody {...provided.droppableProps} ref={provided.innerRef}>
                            {filteredAndSortedStudents.map((student, index) => {
                              const DraggableComponent = Draggable as any;
                              return (
                                <DraggableComponent key={student.id} draggableId={student.id} index={index}>
                                  {(p: any, s: any) => renderListItem(student, index, p, s)}
                                </DraggableComponent>
                              );
                            })}
                            {provided.placeholder}
                          </tbody>
                        )}
                      </Droppable>
                    </DragDropContext>
                  ) : (
                    <tbody>
                      {filteredAndSortedStudents.map((student, index) => (
                        <React.Fragment key={student.id}>
                          {renderListItem(student, index)}
                        </React.Fragment>
                      ))}
                    </tbody>
                  )}
                </table>
              </div>
            </motion.div>
          )
        )}
      </AnimatePresence>

      <Modal
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        maxWidth="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)} className="flex-1">
              Hủy
            </Button>
            <Button 
              variant="danger" 
              onClick={() => {
                if (confirmDeleteId) onDelete(confirmDeleteId);
                setConfirmDeleteId(null);
              }}
              className="flex-1"
            >
              Xóa gốc rễ
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center pt-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-rose-100 mb-4">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
          </div>
          <h3 className="text-xl font-bold text-sky-950 text-center mb-2">Xác nhận xóa</h3>
          <p className="text-sky-700/80 text-center text-sm">
            Bạn có chắc chắn muốn xóa học viên này? Hành động này không thể hoàn tác và sẽ xóa toàn bộ lịch sử học tập, thanh toán liên quan.
          </p>
        </div>
      </Modal>
    </div>
  );
}