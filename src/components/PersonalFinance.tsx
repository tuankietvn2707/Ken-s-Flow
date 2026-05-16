import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, MessageCircle, X } from 'lucide-react';
import { Button } from './ui/Button';
import FinanceChatbot from './FinanceChatbot';
import { Transaction, Goal, FinanceHistoryRecord } from '../types';

import FinanceOverview from './FinanceOverview';
import TransactionForm from './TransactionForm';
import TransactionList from './TransactionList';
import FinanceGoals from './FinanceGoals';
import FinanceHistory from './FinanceHistory';

export interface PersonalFinanceProps {
  transactions: Transaction[];
  financeHistory: FinanceHistoryRecord[];
  goals: Goal[];
  initialBalance: { cash: number; banking: number };
  addTransaction: (tx: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addGoal: (goal: Goal) => Promise<void>;
  updateGoal: (goal: Goal) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  updateInitialBalance: (balance: { cash: number; banking: number }) => Promise<void>;
  consolidateAndResetBalance: (newBalances: { cash: number; banking: number }) => Promise<void>;
  deleteFinanceHistory: (batchIdStr: string) => Promise<void>;
}

// Export formatting helpers for sub-components
export const formatNumber = (num: number | undefined | null) => {
  if (num === undefined || num === null || isNaN(Number(num))) return "0";
  return Number(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export const parseNumber = (str: string) => {
  return parseInt(str.replace(/,/g, ''), 10) || 0;
};

export default function PersonalFinance({
  transactions,
  financeHistory,
  goals,
  initialBalance,
  addTransaction,
  deleteTransaction,
  addGoal,
  updateGoal,
  deleteGoal,
  updateInitialBalance,
  consolidateAndResetBalance,
  deleteFinanceHistory
}: PersonalFinanceProps) {
  // Local state for initial balance inputs to prevent lag
  const [localCash, setLocalCash] = useState((initialBalance?.cash || 0).toString());
  const [localBanking, setLocalBanking] = useState((initialBalance?.banking || 0).toString());

  useEffect(() => {
    setLocalCash((initialBalance?.cash || 0).toString());
    setLocalBanking((initialBalance?.banking || 0).toString());
  }, [initialBalance]);

  // Calculate totals
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
  
  const cashIncome = transactions.filter(t => t.type === 'income' && t.source === 'cash').reduce((sum, t) => sum + (t.amount || 0), 0);
  const cashExpense = transactions.filter(t => t.type === 'expense' && t.source === 'cash').reduce((sum, t) => sum + (t.amount || 0), 0);
  const currentCashBalance = (initialBalance.cash || 0) + cashIncome - cashExpense;

  const bankingIncome = transactions.filter(t => t.type === 'income' && t.source === 'banking').reduce((sum, t) => sum + (t.amount || 0), 0);
  const bankingExpense = transactions.filter(t => t.type === 'expense' && t.source === 'banking').reduce((sum, t) => sum + (t.amount || 0), 0);
  const currentBankingBalance = (initialBalance.banking || 0) + bankingIncome - bankingExpense;
  
  const currentBalance = currentCashBalance + currentBankingBalance;

  return (
    <div className="space-y-6">
      <FinanceOverview 
        transactions={transactions}
        initialBalance={initialBalance}
        localCash={localCash}
        localBanking={localBanking}
        setLocalCash={setLocalCash}
        setLocalBanking={setLocalBanking}
        updateInitialBalance={updateInitialBalance}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        currentCashBalance={currentCashBalance}
        currentBankingBalance={currentBankingBalance}
        currentBalance={currentBalance}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <FinanceGoals 
          goals={goals}
          addGoal={addGoal}
          updateGoal={updateGoal}
          deleteGoal={deleteGoal}
          addTransaction={addTransaction}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <TransactionForm addTransaction={addTransaction} />
        <TransactionList 
          transactions={transactions}
          currentCashBalance={currentCashBalance}
          currentBankingBalance={currentBankingBalance}
          deleteTransaction={deleteTransaction}
          consolidateAndResetBalance={consolidateAndResetBalance}
        />
      </div>
      
      {financeHistory.length > 0 && (
        <FinanceHistory financeHistory={financeHistory} deleteFinanceHistory={deleteFinanceHistory} />
      )}

      {/* Chatbot Module (it manages its own FAB and Modal) */}
      <FinanceChatbot 
        transactions={transactions} 
        goals={goals} 
        addTransaction={addTransaction}
      />
    </div>
  );
}
