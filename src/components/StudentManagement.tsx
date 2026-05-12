import React, { useState } from 'react';
import { Student, ClassSession } from '../types';
import { Plus } from 'lucide-react';
import { motion } from 'motion/react';
import StudentForm from './StudentForm';
import StudentList from './StudentList';
import StudentDetail from './StudentDetail';

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
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex justify-between items-center"
      >
        <h1 className="text-2xl font-bold text-sky-950">Quản lý Học viên</h1>
        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm Học viên
        </button>
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
