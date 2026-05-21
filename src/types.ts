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

export const formatVND = (amount: number | string | undefined | null) => {
  const parsed = Number(amount);
  const safeAmount = isNaN(parsed) ? 0 : parsed;
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(safeAmount);
};

export const parseDateSafe = (dateStr?: string): Date => {
  if (!dateStr) return new Date(NaN);
  
  // Handle DD/MM/YYYY format
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      // Convert to YYYY-MM-DD for standard parsing
      return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00`);
    }
  }
  
  // Handle standard formats (YYYY-MM-DD, ISO, etc.)
  const parsed = new Date(dateStr);
  
  // If Safari fails to parse YYYY-MM-DD without time, try adding time
  if (isNaN(parsed.getTime()) && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return new Date(`${dateStr}T00:00:00`);
  }
  
  return parsed;
};

export type TransactionType = 'income' | 'expense';
export type PaymentSource = 'cash' | 'banking';

export interface Transaction {
  id: string;
  type: TransactionType;
  source: PaymentSource;
  amount: number;
  description: string;
  category: string;
  date: string;
}

export interface FinanceHistoryRecord {
  id: string;
  timestamp: string; // ISO String
  studentId: string;
  studentName: string;
  amount: number;
  unpaidSessions: number;
  classIds: string[];
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
}
