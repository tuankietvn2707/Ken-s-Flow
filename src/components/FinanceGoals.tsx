import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Plus, Trash2, Check, X, AlertTriangle } from 'lucide-react';
import { Goal, Transaction } from '../types';
import { formatNumber, parseNumber } from './PersonalFinance';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
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
      initial={{ y: 20, opacity: 0 }} 
      animate={{ y: 0, opacity: 1 }} 
      transition={{ delay: 0.3 }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Mục Tiêu Tiết Kiệm</CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowGoalForm(!showGoalForm)}
            className="h-8 w-8 text-sky-600 bg-sky-50 hover:bg-sky-100 hover:text-sky-700"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <AnimatePresence>
            {showGoalForm && (
              <motion.form 
                initial={{ height: 0, opacity: 0 }} 
                animate={{ height: 'auto', opacity: 1 }} 
                exit={{ height: 0, opacity: 0 }}
                onSubmit={handleAddGoal} 
                className="mb-6 space-y-3 overflow-hidden"
              >
                <Input
                  type="text" 
                  placeholder="Tên mục tiêu" 
                  value={goalName} 
                  onChange={e => setGoalName(e.target.value)}
                  required
                />
                <Input
                  type="text" 
                  placeholder="Số tiền mục tiêu (VNĐ)" 
                  value={goalTargetStr} 
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setGoalTargetStr(val ? formatNumber(parseInt(val, 10)) : '');
                  }}
                  required
                />
                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full"
                >
                  {isSubmitting && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {isSubmitting ? 'Đang thêm...' : 'Thêm Mục Tiêu'}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            {goals.map(goal => {
              const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
              const isCompleted = goal.currentAmount >= goal.targetAmount;
              return (
                <div key={goal.id} className="p-4 bg-sky-50/50 rounded-2xl border border-sky-100 group relative overflow-hidden transition-all hover:shadow-md">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                        {isCompleted ? <Check className="w-4 h-4" /> : <Target className="w-4 h-4" />}
                      </div>
                      <h3 className="font-semibold text-sky-950">{goal.name}</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setConfirmDeleteId(goal.id)}
                      className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 hover:bg-rose-100 transition-all h-8 w-8"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-sky-900">{formatNumber(goal.currentAmount)}đ</span>
                    <span className="text-sky-600/70">{formatNumber(goal.targetAmount)}đ</span>
                  </div>
                  
                  <div className="w-full bg-sky-200/50 rounded-full h-2 mb-3">
                    <div 
                      className={`h-2 rounded-full transition-all duration-1000 ${isCompleted ? 'bg-emerald-500' : 'bg-blue-500'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  {depositGoalId === goal.id ? (
                    <form onSubmit={handleDeposit} className="flex gap-2">
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
                          className="h-8 text-sm"
                        />
                      </div>
                      <Button 
                        type="submit" 
                        disabled={isSubmitting} 
                        variant="success"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                      >
                        {isSubmitting ? (
                          <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                        className="h-8 w-8 flex-shrink-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </form>
                  ) : (
                    !isCompleted && (
                      <Button 
                        onClick={() => setDepositGoalId(goal.id)}
                        variant="ghost"
                        className="w-full text-sm font-medium text-sky-700 bg-sky-100 hover:bg-sky-200"
                        size="sm"
                      >
                        Nạp Tiết Kiệm
                      </Button>
                    )
                  )}
                </div>
              );
            })}
            {goals.length === 0 && !showGoalForm && (
              <p className="text-center text-sky-600/70 py-4 text-sm mt-2">Chưa có mục tiêu. Hãy thêm một mục tiêu để tiết kiệm hiệu quả hơn!</p>
            )}
          </div>
        </CardContent>
      </Card>

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
              onClick={async () => {
                if (confirmDeleteId) await deleteGoal(confirmDeleteId);
                setConfirmDeleteId(null);
              }}
              className="flex-1"
            >
              Xóa
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
            Bạn có chắc chắn muốn xóa mục tiêu này? Hành động này không thể hoàn tác, nhưng các giao dịch đã nạp sẽ được giữ lại.
          </p>
        </div>
      </Modal>
    </motion.div>
  );
}
