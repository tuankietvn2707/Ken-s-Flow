export interface Student {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  order?: number;
  birthYear: number | '';
  gender?: 'Nam' | 'Nữ' | string;
  occupation: string;
  currentLevel: string;
  goal: string;
  fee: number;
  feeCycle: number; // 8 or 12
  schedule: string;
  notes: string;
  targetColor?: string;
  status?: 'active' | 'inactive';
  // Legacy fields for backward compatibility
  background?: string;
}

export interface ClassSession {
  id: string;
  studentId: string;
  date: string;
  time?: string;
  topic: string;
  duration: number;
  isPaid: boolean;
  paymentBatchId?: number;
  strengths?: string;
  weaknesses?: string;
  mistakes?: string;
  remedies?: string;
  nextLessonPrep?: string;
}

export const formatVND = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};
