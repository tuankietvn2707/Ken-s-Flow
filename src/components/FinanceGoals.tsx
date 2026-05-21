import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Plus, Trash2, Check, X, AlertTriangle, ArrowRight, Wallet } from 'lucide-react';
import { Goal, Transaction } from '../types';
import { formatNumber, parseNumber } from './PersonalFinance';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';

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
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white dark:border-slate-700 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[32px] overflow-hidden"
    >
      <div className="flex flex-col">
        <div className="px-8 py-6 border-b border-white dark:border-slate-700/40 flex justify-between items-center bg-white/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 shadow-sm">
              <Target className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-sky-950 dark:text-sky-50 tracking-tight">Mục Tiêu Tiết Kiệm</h2>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowGoalForm(!showGoalForm)}
            className="h-9 w-9 rounded-full text-sky-600 hover:text-sky-700 bg-sky-50 shadow-sm border border-sky-100 transition-all hover:scale-105 hover:bg-sky-100"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-8">
          <AnimatePresence>
            {showGoalForm && (
              <motion.form 
                initial={{ height: 0, opacity: 0 }} 
                animate={{ height: 'auto', opacity: 1 }} 
                exit={{ height: 0, opacity: 0 }}
                onSubmit={handleAddGoal} 
                className="mb-6 space-y-4 overflow-hidden border-b border-sky-100 pb-6"
              >
                <div>
                  <label className="block text-xs font-bold text-sky-950 dark:text-sky-50/60 uppercase tracking-widest mb-1.5 pl-1">Tên mục tiêu</label>
                  <Input
                    type="text" 
                    placeholder="VD: Mua Macbook mới..." 
                    value={goalName} 
                    onChange={e => setGoalName(e.target.value)}
                    className="bg-white/80 dark:bg-slate-900/80 border-sky-200/60 focus:border-sky-400 focus:ring-sky-400/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-sky-950 dark:text-sky-50/60 uppercase tracking-widest mb-1.5 pl-1">Số tiền mục tiêu (VNĐ)</label>
                  <Input
                    type="text" 
                    placeholder="0 đ" 
                    value={goalTargetStr} 
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setGoalTargetStr(val ? formatNumber(parseInt(val, 10)) : '');
                    }}
                    className="bg-white/80 dark:bg-slate-900/80 border-sky-200/60 focus:border-sky-400 focus:ring-sky-400/20 font-semibold"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full bg-sky-500 hover:bg-sky-600 text-white rounded-xl shadow-[0_4px_16px_rgba(14,165,233,0.3)] hover:shadow-[0_8px_24px_rgba(14,165,233,0.4)] transition-all duration-300"
                >
                  {isSubmitting && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {isSubmitting ? 'Đang thêm...' : 'Lưu Mục Tiêu'}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            {goals.map((goal, idx) => {
              const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
              const isCompleted = goal.currentAmount >= goal.targetAmount;
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1, duration: 0.3 }}
                  key={goal.id} 
                  className="p-5 bg-white/70 backdrop-blur-md rounded-[20px] border border-white dark:border-slate-700 shadow-[0_4px_16px_rgba(0,0,0,0.03)] group relative overflow-hidden transition-all hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-0.5"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                       <div className={`w-8 h-8 flex items-center justify-center rounded-xl bg-gradient-to-br border shadow-sm ${isCompleted ? 'from-emerald-100 to-emerald-50 border-emerald-200 text-emerald-600' : 'from-sky-100 to-sky-50 border-sky-200 text-sky-600'}`}>
                          {isCompleted ? <Check className="w-4 h-4" /> : <Target className="w-4 h-4" />}
                       </div>
                      <h3 className="font-extrabold text-[15px] text-sky-950 dark:text-sky-50 tracking-tight">{goal.name}</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setConfirmDeleteId(goal.id)}
                      className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 shadow-none transition-all h-8 w-8 ml-2 flex-shrink-0 rounded-[12px]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="flex justify-between text-[13px] mb-2 font-bold whitespace-nowrap">
                    <span className="text-sky-950 dark:text-sky-50">{formatNumber(goal.currentAmount)} đ</span>
                    <span className="text-sky-900 dark:text-sky-100/50">{formatNumber(goal.targetAmount)} đ</span>
                  </div>
                  
                  <div className="w-full bg-sky-100/50 rounded-full h-2.5 mb-4 inset-shadow-sm overflow-hidden border border-sky-200/30">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r shadow-sm ${isCompleted ? 'from-emerald-400 to-emerald-500' : 'from-sky-400 to-cyan-500'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  {depositGoalId === goal.id ? (
                    <form onSubmit={handleDeposit} className="flex gap-2 bg-sky-50/50 p-1.5 rounded-2xl border border-sky-100/50">
                      <div className="relative flex-1">
                        <Input
                          type="text" 
                          autoFocus 
                          placeholder="Số tiền nạp..."
                          value={depositAmountStr}
                          onChange={e => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setDepositAmountStr(val ? formatNumber(parseInt(val, 10)) : '');
                          }}
                          className="h-9 text-sm bg-white/80 dark:bg-slate-900/80 border-transparent focus:border-sky-300 font-semibold"
                        />
                      </div>
                      <Button 
                        type="submit" 
                        disabled={isSubmitting} 
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 flex-shrink-0 bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm rounded-xl"
                      >
                        {isSubmitting ? (
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : <Check className="w-4 h-4" />}
                      </Button>
                      <Button 
                        type="button" 
                        disabled={isSubmitting} 
                        onClick={() => setDepositGoalId(null)} 
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 flex-shrink-0 text-sky-500 hover:text-sky-700 hover:bg-sky-100/80 rounded-xl"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </form>
                  ) : (
                    !isCompleted && (
                      <Button 
                        onClick={() => setDepositGoalId(goal.id)}
                        variant="ghost"
                        className="w-full text-sm font-bold text-sky-700 bg-sky-50/50 hover:bg-sky-100 hover:text-sky-800 dark:text-sky-200 border border-sky-100 shadow-sm rounded-xl py-2 h-auto hover:shadow-md transition-all group/btn flex items-center justify-center gap-1.5"
                      >
                        Nạp Tiết Kiệm
                        <ArrowRight className="w-3.5 h-3.5 opacity-50 group-hover/btn:opacity-100 transition-opacity" />
                      </Button>
                    )
                  )}
                </motion.div>
              );
            })}
            {goals.length === 0 && !showGoalForm && (
               <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <div className="w-16 h-16 bg-sky-50 rounded-full flex items-center justify-center mb-3">
                     <Target className="w-7 h-7 text-sky-300" />
                  </div>
                  <p className="text-[15px] font-semibold text-sky-900 dark:text-sky-100 mb-1">Chưa có mục tiêu nào</p>
                  <p className="text-[13px] text-sky-600/70 max-w-[250px]">Hãy thêm mục tiêu để bắt đầu hành trình tiết kiệm của bạn nhé.</p>
               </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        maxWidth="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)} className="flex-1 rounded-xl">
              Hủy
            </Button>
            <Button 
              variant="danger" 
              onClick={async () => {
                if (confirmDeleteId) await deleteGoal(confirmDeleteId);
                setConfirmDeleteId(null);
              }}
              className="flex-1 rounded-xl"
            >
              Xóa
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center pt-2">
          <div className="flex items-center justify-center w-14 h-14 rounded-[20px] bg-rose-50 border border-rose-100 mb-5 shadow-sm">
            <AlertTriangle className="w-7 h-7 text-rose-500" />
          </div>
          <h3 className="text-xl font-extrabold text-sky-950 dark:text-sky-50 text-center mb-2 tracking-tight">Xóa mục tiêu</h3>
          <p className="text-sky-700/80 text-center text-[15px] leading-relaxed">
            Bạn có muốn xóa mục tiêu này? Các giao dịch đã nạp trước đó sẽ được giữ lại.
          </p>
        </div>
      </Modal>
    </motion.div>
  );
}
