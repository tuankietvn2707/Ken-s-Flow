import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Plus, Trash2, Check, X, AlertTriangle } from 'lucide-react';
import { Goal, Transaction } from '../types';
import { formatNumber, parseNumber } from './PersonalFinance';

interface Props {
  goals: Goal[];
  addGoal: (goal: Goal) => Promise<void>;
  updateGoal: (goal: Goal) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  addTransaction: (tx: Transaction) => Promise<void>;
}

export default function FinanceGoals({ goals, addGoal, updateGoal, deleteGoal, addTransaction }: Props) {
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalTargetStr, setGoalTargetStr] = useState('');
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositAmountStr, setDepositAmountStr] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    const target = parseNumber(goalTargetStr);
    if (target <= 0 || !goalName) return;

    setIsSubmitting(true);
    const newGoal: Goal = {
      id: Date.now().toString(),
      name: goalName,
      targetAmount: target,
      currentAmount: 0,
    };

    try {
      await addGoal(newGoal);
      setGoalName('');
      setGoalTargetStr('');
      setShowGoalForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoalId || isSubmitting) return;
    const amount = parseNumber(depositAmountStr);
    if (amount <= 0) return;

    const goal = goals.find(g => g.id === depositGoalId);
    if (!goal) return;

    setIsSubmitting(true);
    try {
      // Update goal
      const updatedGoal = { ...goal, currentAmount: goal.currentAmount + amount };
      await updateGoal(updatedGoal);

      // Add expense transaction
      const newTx: Transaction = {
        id: Date.now().toString(),
        type: 'expense',
        source: 'banking', // Default to banking for deposit
        amount,
        description: `Nạp tiền vào mục tiêu: ${goal.name}`,
        category: 'Tiết kiệm',
        date: new Date().toISOString().split('T')[0],
      };
      await addTransaction(newTx);

      setDepositGoalId(null);
      setDepositAmountStr('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
      className="glass-panel border border-sky-300/30 text-sky-950 p-6 rounded-2xl"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Mục Tiêu Tiết Kiệm</h2>
        <button onClick={() => setShowGoalForm(!showGoalForm)} className="p-1.5 bg-cyan-100 text-cyan-600 rounded-xl hover:bg-cyan-200 transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <AnimatePresence>
        {showGoalForm && (
          <motion.form 
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            onSubmit={handleAddGoal} className="mb-4 space-y-3 overflow-hidden"
          >
            <input
              type="text" placeholder="Tên mục tiêu" value={goalName} onChange={e => setGoalName(e.target.value)}
              className="w-full px-4 py-2 rounded-xl glass-panel/50 border border-sky-300/30 focus:ring-2 focus:ring-cyan-500 outline-none" required
            />
            <input
              type="text" placeholder="Số tiền mục tiêu (VNĐ)" 
              value={goalTargetStr} 
              onChange={e => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setGoalTargetStr(val ? formatNumber(parseInt(val, 10)) : '');
              }}
              className="w-full px-4 py-2 rounded-xl glass-panel/50 border border-sky-300/30 focus:ring-2 focus:ring-cyan-500 outline-none" required
            />
            <button type="submit" disabled={isSubmitting} className="w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-medium shadow shadow-cyan-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {isSubmitting && (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isSubmitting ? 'Đang thêm...' : 'Thêm Mục Tiêu'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {goals.map(goal => {
          const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
          const isCompleted = goal.currentAmount >= goal.targetAmount;
          return (
            <div key={goal.id} className="p-4 bg-sky-50/40 rounded-xl border border-sky-300/30 group relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-sky-100 text-sky-600'}`}>
                    {isCompleted ? <Check className="w-4 h-4" /> : <Target className="w-4 h-4" />}
                  </div>
                  <h3 className="font-semibold text-sky-950">{goal.name}</h3>
                </div>
                <button onClick={() => setConfirmDeleteId(goal.id)} className="opacity-0 group-hover:opacity-100 text-rose-500 p-1 hover:bg-rose-100 rounded transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-medium">{formatNumber(goal.currentAmount)}đ</span>
                <span className="opacity-60">{formatNumber(goal.targetAmount)}đ</span>
              </div>
              
              <div className="w-full bg-sky-200/50 rounded-full h-2 mb-3">
                <div 
                  className={`h-2 rounded-full transition-all duration-1000 ${isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {depositGoalId === goal.id ? (
                <form onSubmit={handleDeposit} className="flex gap-2">
                  <input
                    type="text" autoFocus placeholder="Số tiền nạp..."
                    value={depositAmountStr}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setDepositAmountStr(val ? formatNumber(parseInt(val, 10)) : '');
                    }}
                    className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-sky-300/60 focus:ring-2 focus:ring-cyan-500 outline-none"
                  />
                  <button type="submit" disabled={isSubmitting} className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 min-w-[32px] flex items-center justify-center">
                    {isSubmitting ? (
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : <Check className="w-4 h-4" />}
                  </button>
                  <button type="button" disabled={isSubmitting} onClick={() => setDepositGoalId(null)} className="p-1.5 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-200 transition-colors disabled:opacity-50"><X className="w-4 h-4" /></button>
                </form>
              ) : (
                !isCompleted && (
                  <button 
                    onClick={() => setDepositGoalId(goal.id)}
                    className="w-full py-1.5 text-sm font-medium text-sky-700 bg-sky-50/40 rounded-lg hover:bg-sky-200 transition-colors"
                  >
                    Nạp Tiết Kiệm
                  </button>
                )
              )}
            </div>
          );
        })}
        {goals.length === 0 && !showGoalForm && (
          <p className="text-center opacity-50 py-4 text-sm">Chưa có mục tiêu. Hãy thêm một mục tiêu để tiết kiệm hiệu quả hơn!</p>
        )}
      </div>

      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sky-950/20 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 border border-sky-100 relative"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-rose-100 mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-xl font-bold text-sky-950 text-center mb-2">Xác nhận xóa mục tiêu</h3>
              <p className="text-sky-700/80 text-center mb-8">
                Bạn có chắc chắn muốn xóa mục tiêu này? Hành động này không thể hoàn tác, nhưng các giao dịch đã nạp sẽ được giữ lại.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-sky-700 font-medium bg-sky-50 hover:bg-sky-100 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  onClick={async () => {
                    await deleteGoal(confirmDeleteId);
                    setConfirmDeleteId(null);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl text-white font-medium bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm"
                >
                  Xóa
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
