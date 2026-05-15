import React, { useState } from 'react';
import { Student, ClassSession } from '../types';
import { Plus } from 'lucide-react';
import { motion } from 'motion/react';
import StudentForm from './StudentForm';
import StudentList from './StudentList';
import StudentDetail from './StudentDetail';
import { Button } from './ui/Button';

interface Props {
  students: Student[];
  addStudent: (student: Student) => void;
  updateStudent: (student: Student) => void;
  deleteStudent: (id: string) => void;
  classes: ClassSession[];
  markClassesAsPaid?: (studentId: string, classIds: string[], studentName: string, amount: number, unpaidSessions: number) => void;
}

export default function StudentManagement({ students, addStudent, updateStudent, deleteStudent, classes, markClassesAsPaid }: Props) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const handleDelete = (id: string) => {
    deleteStudent(id);
    if (selectedStudent?.id === id) {
      setSelectedStudent(null);
    }
  };

  const editStudent = (student: Student) => {
    setEditingId(student.id);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
  };

  const initialData = editingId ? students.find(s => s.id === editingId) : null;

  return (
    <div className="space-y-8 pb-10">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div className="flex flex-col gap-1 items-start">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-sky-950 tracking-tight">Quản lý Học viên</h1>
          <p className="text-sky-700/80 font-medium text-lg">Theo dõi thông tin, mục tiêu và trạng thái học viên</p>
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="bg-gradient-to-r from-sky-400 to-sky-500 hover:from-sky-500 hover:to-sky-600 text-white border border-white/40 shadow-[0_4px_16px_rgba(56,189,248,0.3)] hover:shadow-[0_8px_24px_rgba(56,189,248,0.4)] hover:-translate-y-0.5 transition-all duration-300 rounded-[20px] h-12 px-6 backdrop-blur-md group"
        >
          <Plus className="w-5 h-5 mr-2 group-hover:scale-110 group-hover:rotate-90 transition-all duration-300" />
          <span className="font-semibold text-[15px]">Thêm Học viên</span>
        </Button>
      </motion.div>

      {isFormOpen && (
        <StudentForm
          editingId={editingId}
          initialData={initialData}
          students={students}
          onClose={closeForm}
          onAdd={addStudent}
          onUpdate={updateStudent}
        />
      )}

      <StudentList 
        students={students}
        classes={classes}
        onUpdate={updateStudent}
        onDelete={handleDelete}
        onSelect={setSelectedStudent}
        onEdit={editStudent}
      />

      {selectedStudent && (
        <StudentDetail 
          student={selectedStudent}
          classes={classes}
          onClose={() => setSelectedStudent(null)}
          onEdit={editStudent}
          markClassesAsPaid={markClassesAsPaid}
        />
      )}
    </div>
  );
}
