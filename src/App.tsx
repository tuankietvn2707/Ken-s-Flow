import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import { Student, ClassSession, Transaction, Goal, FinanceHistoryRecord } from './types';
import { Users, BookOpen, LayoutDashboard, LogOut, Wallet, History, Moon, Sun } from 'lucide-react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { collection, getDocs, doc, setDoc, deleteDoc, writeBatch, deleteField, getDoc, onSnapshot } from 'firebase/firestore';
import { Toaster, toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

// Lazy loaded components
const Dashboard = lazy(() => import('./components/Dashboard'));
const StudentManagement = lazy(() => import('./components/StudentManagement'));
const ClassTracker = lazy(() => import('./components/ClassTracker'));
const FinancialTracking = lazy(() => import('./components/FinancialTracking'));
const PersonalFinance = lazy(() => import('./components/PersonalFinance'));
const GlobalChatbot = lazy(() => import('./components/GlobalChatbot'));

import Login from './components/Login';

import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';
import { Modal } from './components/ui/Modal';
import FinanceHistory from './components/FinanceHistory';


const DongSign = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 4v12" />
    <circle cx="11" cy="12" r="4" />
    <path d="M11 8h8" />
    <path d="M7 20h12" />
  </svg>
);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState<string>('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [financeHistory, setFinanceHistory] = useState<FinanceHistoryRecord[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [initialBalance, setInitialBalance] = useState<{ cash: number; banking: number }>({ cash: 0, banking: 0 });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isGlobalHistoryOpen, setIsGlobalHistoryOpen] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const showLoading = () => setIsProcessing(true);
  const hideLoading = () => setIsProcessing(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const setupListeners = (uid: string) => {
    setLoadingData(true);
    let loadedCount = 0;
    const totalCollections = 5;

    const checkLoadingComplete = () => {
      loadedCount++;
      if (loadedCount >= totalCollections) {
        setLoadingData(false);
      }
    };

    // Profile listener
    const unsubProfile = onSnapshot(doc(db, `users/${uid}/profile/info`), (snap) => {
      if (snap.exists()) {
        setDisplayName(snap.data().displayName || '');
        setShowOnboarding(false);
      } else {
        setShowOnboarding(true);
      }
    });

    // Settings listener
    const unsubSettings = onSnapshot(doc(db, `users/${uid}/settings/finance`), (snap) => {
      if (snap.exists()) {
        setInitialBalance(snap.data().initialBalance || { cash: 0, banking: 0 });
      } else {
        setInitialBalance({ cash: 0, banking: 0 });
      }
    });

    // Students listener
    const unsubStudents = onSnapshot(collection(db, `users/${uid}/students`), (snap) => {
      setStudents(snap.docs.map(doc => doc.data() as Student));
      checkLoadingComplete();
    });

    // Classes listener
    const unsubClasses = onSnapshot(collection(db, `users/${uid}/classes`), (snap) => {
      setClasses(snap.docs.map(doc => doc.data() as ClassSession));
      checkLoadingComplete();
    });

    // Transactions listener
    const unsubTransactions = onSnapshot(collection(db, `users/${uid}/transactions`), (snap) => {
      const txs = snap.docs.map(doc => doc.data() as Transaction);
      setTransactions(txs);
      
      // Migration logic from localStorage to Firestore (only runs if Firestore is empty)
      if (txs.length === 0) {
        try {
          const localTxs = localStorage.getItem('pf_transactions');
          if (localTxs) {
            const parsedTxs = JSON.parse(localTxs) as Transaction[];
            if (Array.isArray(parsedTxs) && parsedTxs.length > 0) {
              const batch = writeBatch(db);
              parsedTxs.forEach(tx => {
                batch.set(doc(db, `users/${uid}/transactions`, tx.id), tx);
              });
              batch.commit().then(() => console.log("Migrated local transactions to Firestore."));
            }
          }
        } catch (e) {
          console.error("Migration error:", e);
        }
      }
      checkLoadingComplete();
    });

    // History listener
    const unsubHistory = onSnapshot(collection(db, `users/${uid}/financeHistory`), (snap) => {
      setFinanceHistory(snap.docs.map(doc => doc.data() as FinanceHistoryRecord));
      checkLoadingComplete();
    });

    // Goals listener
    const unsubGoals = onSnapshot(collection(db, `users/${uid}/goals`), (snap) => {
      setGoals(snap.docs.map(doc => doc.data() as Goal));
      checkLoadingComplete();
    });

    return () => {
      unsubProfile();
      unsubSettings();
      unsubStudents();
      unsubClasses();
      unsubTransactions();
      unsubHistory();
      unsubGoals();
    };
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    if (user) {
      unsubscribe = setupListeners(user.uid);
    } else {
      setStudents([]);
      setClasses([]);
      setTransactions([]);
      setFinanceHistory([]);
      setGoals([]);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Đã đăng xuất');
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error('Có lỗi xảy ra khi đăng xuất');
    }
  };

  // CRUD for Students
  const addStudent = useCallback(async (student: Student) => {
    if (!user) return;
    try {
      await setDoc(doc(db, `users/${user.uid}/students`, student.id), student);
      setStudents(prev => [...prev, student]);
      toast.success('Thêm học viên thành công');
    } catch (error) {
      console.error("Error adding student:", error);
      toast.error('Có lỗi xảy ra khi thêm học viên');
    }
  }, [user]);

  const updateStudent = useCallback(async (student: Student) => {
    if (!user) return;
    try {
      await setDoc(doc(db, `users/${user.uid}/students`, student.id), student);
      setStudents(prev => prev.map(s => s.id === student.id ? student : s));
      toast.success('Cập nhật học viên thành công');
    } catch (error) {
      console.error("Error updating student:", error);
      toast.error('Có lỗi xảy ra khi cập nhật học viên');
    }
  }, [user]);

  const deleteStudent = useCallback(async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/students`, id));
      setStudents(prev => prev.filter(s => s.id !== id));
      toast.success('Đã xóa học viên');
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.error('Có lỗi xảy ra khi xóa học viên');
    }
  }, [user]);

  // CRUD for Classes
  const addClass = useCallback(async (cls: ClassSession) => {
    if (!user) return;
    try {
      await setDoc(doc(db, `users/${user.uid}/classes`, cls.id), cls);
      setClasses(prev => [cls, ...prev]);
      toast.success('Thêm lớp học thành công');
    } catch (error) {
      console.error("Error adding class:", error);
      toast.error('Có lỗi xảy ra khi thêm lớp học');
      throw error;
    }
  }, [user]);

  const updateClass = useCallback(async (cls: ClassSession) => {
    if (!user) return;
    try {
      await setDoc(doc(db, `users/${user.uid}/classes`, cls.id), cls);
      setClasses(prev => prev.map(c => c.id === cls.id ? cls : c));
      toast.success('Cập nhật lớp học thành công');
    } catch (error) {
      console.error("Error updating class:", error);
      toast.error('Có lỗi xảy ra khi cập nhật lớp học');
      throw error;
    }
  }, [user]);

  const deleteClass = useCallback(async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/classes`, id));
      setClasses(prev => prev.filter(c => c.id !== id));
      toast.success('Đã xóa lớp học');
    } catch (error) {
      console.error("Error deleting class:", error);
      toast.error('Có lỗi xảy ra khi xóa lớp học');
    }
  }, [user]);

  // Financial
  const markClassesAsPaid = async (studentId: string, classIds: string[], studentName: string, amount: number, unpaidSessions: number) => {
    if (!user || classIds.length === 0) return;
    const batchId = Date.now();
    try {
      const batch = writeBatch(db);
      classIds.forEach(id => {
        const classRef = doc(db, `users/${user.uid}/classes`, id);
        batch.update(classRef, { isPaid: true, paymentBatchId: batchId });
      });

      const newHistoryRecord: FinanceHistoryRecord = {
        id: batchId.toString(),
        timestamp: new Date().toISOString(),
        studentId,
        studentName,
        amount,
        unpaidSessions,
        classIds
      };
      
      batch.set(doc(db, `users/${user.uid}/financeHistory`, newHistoryRecord.id), newHistoryRecord);

      await batch.commit();
      setClasses(prev => prev.map(c => classIds.includes(c.id) ? { ...c, isPaid: true, paymentBatchId: batchId } : c));
      setFinanceHistory(prev => [newHistoryRecord, ...prev].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      toast.success('Đã xác nhận thanh toán');
    } catch (error) {
      console.error("Error marking classes as paid:", error);
      toast.error('Có lỗi xảy ra khi xác nhận thanh toán');
    }
  };

  const deleteFinanceHistory = async (batchIdStr: string) => {
    if (!user) return;
    showLoading();
    try {
      const batchId = Number(batchIdStr);
      const classesToUndo = classes.filter(c => c.paymentBatchId === batchId);

      const batch = writeBatch(db);
      classesToUndo.forEach(c => {
        const classRef = doc(db, `users/${user.uid}/classes`, c.id);
        batch.update(classRef, { isPaid: false, paymentBatchId: deleteField() });
      });
      
      const historyRef = doc(db, `users/${user.uid}/financeHistory`, batchIdStr);
      batch.delete(historyRef);

      await batch.commit();

      setClasses(prev => prev.map(c =>
        c.paymentBatchId === batchId ? { ...c, isPaid: false, paymentBatchId: undefined } : c
      ));
      
      setFinanceHistory(prev => prev.filter(h => h.id !== batchIdStr));
      toast.success('Đã xóa lịch sử giao dịch và hoàn tác thanh toán liên quan');
    } catch (error) {
      console.error("Error deleting finance history:", error);
      toast.error('Có lỗi xảy ra khi xóa lịch sử giao dịch');
    } finally {
      hideLoading();
    }
  };

  const undoLastPayment = async (studentId: string) => {
    if (!user) return;
    showLoading();
    try {
      const studentClasses = classes.filter(c => c.studentId === studentId && c.isPaid && c.paymentBatchId);
      if (studentClasses.length === 0) return;

      const latestBatchId = Math.max(...studentClasses.map(c => c.paymentBatchId!));
      const classesToUndo = studentClasses.filter(c => c.paymentBatchId === latestBatchId);

      const batch = writeBatch(db);
      classesToUndo.forEach(c => {
        const classRef = doc(db, `users/${user.uid}/classes`, c.id);
        batch.update(classRef, { isPaid: false, paymentBatchId: deleteField() });
      });
      
      const historyRef = doc(db, `users/${user.uid}/financeHistory`, latestBatchId.toString());
      batch.delete(historyRef);

      await batch.commit();

      setClasses(prev => prev.map(c =>
        c.paymentBatchId === latestBatchId ? { ...c, isPaid: false, paymentBatchId: undefined } : c
      ));
      
      setFinanceHistory(prev => prev.filter(h => h.id !== latestBatchId.toString()));
      toast.success('Đã hoàn tác thanh toán gần nhất');
    } catch (error) {
      console.error("Error undoing payment:", error);
      toast.error('Có lỗi xảy ra khi hoàn tác');
    } finally {
      hideLoading();
    }
  };

  // Personal Finance CRUD
  const addTransaction = async (tx: Transaction) => {
    if (!user) return;
    try {
      await setDoc(doc(db, `users/${user.uid}/transactions`, tx.id), tx);
      setTransactions(prev => [tx, ...prev]);
      toast.success('Thêm giao dịch thành công');
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast.error('Có lỗi xảy ra khi thêm giao dịch');
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/transactions`, id));
      setTransactions(prev => prev.filter(t => t.id !== id));
      toast.success('Đã xóa giao dịch');
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error('Có lỗi xảy ra khi xóa giao dịch');
    }
  };

  const addGoal = async (goal: Goal) => {
    if (!user) return;
    try {
      await setDoc(doc(db, `users/${user.uid}/goals`, goal.id), goal);
      setGoals(prev => [...prev, goal]);
      toast.success('Thêm mục tiêu thành công');
    } catch (error) {
      console.error("Error adding goal:", error);
      toast.error('Có lỗi xảy ra khi thêm mục tiêu');
    }
  };

  const updateGoal = async (goal: Goal) => {
    if (!user) return;
    try {
      await setDoc(doc(db, `users/${user.uid}/goals`, goal.id), goal);
      setGoals(prev => prev.map(g => g.id === goal.id ? goal : g));
      toast.success('Cập nhật mục tiêu thành công');
    } catch (error) {
      console.error("Error updating goal:", error);
      toast.error('Có lỗi xảy ra khi cập nhật mục tiêu');
    }
  };

  const deleteGoal = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/goals`, id));
      setGoals(prev => prev.filter(g => g.id !== id));
      toast.success('Đã xóa mục tiêu');
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast.error('Có lỗi xảy ra khi xóa mục tiêu');
    }
  };

  const updateInitialBalance = async (balance: { cash: number; banking: number }) => {
    if (!user) return;
    try {
      await setDoc(doc(db, `users/${user.uid}/settings/finance`), { initialBalance: balance });
      setInitialBalance(balance);
      toast.success('Cập nhật số dư thành công');
    } catch (error) {
      console.error("Error updating initial balance:", error);
      toast.error('Có lỗi xảy ra khi cập nhật số dư');
    }
  };

  const consolidateAndResetBalance = async (newBalances: { cash: number; banking: number }) => {
    if (!user) return;
    try {
      showLoading();
      const batch = writeBatch(db);
      
      transactions.forEach(tx => {
        batch.delete(doc(db, `users/${user.uid}/transactions`, tx.id));
      });
      
      batch.set(doc(db, `users/${user.uid}/settings/finance`), { initialBalance: newBalances }, { merge: true });
      
      await batch.commit();

      setTransactions([]);
      setInitialBalance(newBalances);
      toast.success('Đã chốt sổ thành công');
      
    } catch (error) {
      console.error("Error consolidating finance:", error);
      toast.error('Có lỗi xảy ra khi chốt sổ');
    } finally {
      hideLoading();
    }
  };

  const handleSaveProfile = async (name: string) => {
    if (!user) return;
    try {
      await setDoc(doc(db, `users/${user.uid}/profile/info`), { displayName: name });
      setDisplayName(name);
      setShowOnboarding(false);
    } catch (error) {
      console.error("Error saving profile:", error);
    }
  };

  useEffect(() => {
    // Add global click listener to dismiss toasts
    const handleGlobalClick = () => {
      toast.dismiss();
    };
    
    // Use capture phase to ensure it catches all clicks early
    document.addEventListener('click', handleGlobalClick, { capture: true });
    
    return () => {
      document.removeEventListener('click', handleGlobalClick, { capture: true });
    };
  }, []);

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (showOnboarding) {
    return <Onboarding onSave={handleSaveProfile} />;
  }

  return (
    <div className="min-h-screen text-sky-950 dark:text-sky-50 font-sans relative overflow-x-hidden">
      {/* Premium Glassmorphism Background */}
      <div className="fixed inset-0 z-[-1] bg-gradient-to-br from-[#f8fafc] via-[#e8f4fd] to-[#f0f9ff]">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-sky-200/40 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-200/30 blur-[120px]" />
        <div className="absolute top-[40%] left-[20%] w-[30%] h-[30%] rounded-full bg-indigo-100/30 blur-[100px]" />
      </div>

      <Toaster position="top-center" richColors theme="light" />
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl border-b border-white dark:border-slate-700 fixed w-full top-0 z-50 shadow-[0_12px_40px_rgba(14,165,233,0.12)] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <button 
                  onClick={() => window.location.reload()}
                  className="animated-border-box cursor-pointer hover:opacity-80 transition-opacity flex bg-transparent outline-none border-none p-0"
                >
                  <div className="animated-border-inner flex items-center gap-2 m-0 p-2 px-3 bg-white/80 dark:bg-slate-900/80 rounded-[10px]">
                    <Wallet className="w-6 h-6 text-sky-600" />
                    <span className="text-xl font-bold text-sky-600">
                      TutorFlow
                    </span>
                  </div>
                </button>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-2">
                <TabButton 
                  active={activeTab === 'dashboard'} 
                  onClick={() => setActiveTab('dashboard')}
                  icon={<LayoutDashboard className="w-4 h-4 mr-2" />}
                  label="Tổng quan"
                  colorClass="glass-active text-sky-900 dark:text-sky-100 border-sky-300/30"
                  hoverClass="hover:bg-sky-50 hover:text-sky-800 dark:text-sky-200"
                />
                <TabButton 
                  active={activeTab === 'students'} 
                  onClick={() => setActiveTab('students')}
                  icon={<Users className="w-4 h-4 mr-2" />}
                  label="Học viên"
                  colorClass="glass-active text-sky-900 dark:text-sky-100 border-sky-300/30"
                  hoverClass="hover:bg-sky-50 hover:text-sky-800 dark:text-sky-200"
                />
                <TabButton 
                  active={activeTab === 'classes'} 
                  onClick={() => setActiveTab('classes')}
                  icon={<BookOpen className="w-4 h-4 mr-2" />}
                  label="Lớp học"
                  colorClass="glass-active text-sky-900 dark:text-sky-100 border-sky-300/30"
                  hoverClass="hover:bg-sky-50 hover:text-sky-800 dark:text-sky-200"
                />
                <TabButton 
                  active={activeTab === 'finances'} 
                  onClick={() => setActiveTab('finances')}
                  icon={<DongSign className="w-4 h-4 mr-2" />}
                  label="Tài chính"
                  colorClass="glass-active text-sky-900 dark:text-sky-100 border-sky-300/30"
                  hoverClass="hover:bg-sky-50 hover:text-sky-800 dark:text-sky-200"
                />
                <TabButton 
                  active={activeTab === 'personal_finance'} 
                  onClick={() => setActiveTab('personal_finance')}
                  icon={<Wallet className="w-4 h-4 mr-2" />}
                  label="Thu - Chi"
                  colorClass="glass-active text-sky-900 dark:text-sky-100 border-sky-300/30"
                  hoverClass="hover:bg-sky-50 hover:text-sky-800 dark:text-sky-200"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                aria-label="Toggle Dark Mode"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <UserMenu user={user} handleLogout={handleLogout} onViewHistory={() => setIsGlobalHistoryOpen(true)} />
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        <div className="sm:hidden border-t border-sky-300/30 flex overflow-x-auto p-2 gap-2">
           <MobileTabButton 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')}
              label="Tổng quan"
              colorClass="glass-active text-sky-900 dark:text-sky-100 border-sky-300/30"
            />
            <MobileTabButton 
              active={activeTab === 'students'} 
              onClick={() => setActiveTab('students')}
              label="Học viên"
              colorClass="glass-active text-sky-900 dark:text-sky-100 border-sky-300/30"
            />
            <MobileTabButton 
              active={activeTab === 'classes'} 
              onClick={() => setActiveTab('classes')}
              label="Lớp học"
              colorClass="glass-active text-sky-900 dark:text-sky-100 border-sky-300/30"
            />
            <MobileTabButton 
              active={activeTab === 'finances'} 
              onClick={() => setActiveTab('finances')}
              label="Tài chính"
              colorClass="glass-active text-sky-900 dark:text-sky-100 border-sky-300/30"
            />
            <MobileTabButton 
              active={activeTab === 'personal_finance'} 
              onClick={() => setActiveTab('personal_finance')}
              label="Thu - Chi"
              colorClass="glass-active text-sky-900 dark:text-sky-100 border-sky-300/30"
            />
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        {loadingData ? (
          <div className="py-20 animate-pulse">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="h-10 bg-sky-100 rounded-xl w-1/3"></div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="h-32 bg-sky-50 rounded-2xl border border-sky-100"></div>
                <div className="h-32 bg-sky-50 rounded-2xl border border-sky-100"></div>
                <div className="h-32 bg-sky-50 rounded-2xl border border-sky-100"></div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                <div className="h-96 bg-sky-50 rounded-2xl border border-sky-100"></div>
                <div className="h-96 bg-sky-50 rounded-2xl border border-sky-100"></div>
              </div>
            </div>
          </div>
        ) : (
          <Suspense fallback={
            <div className="py-20 animate-pulse">
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="h-10 bg-sky-100 rounded-xl w-1/3"></div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="h-32 bg-sky-50 rounded-2xl border border-sky-100"></div>
                  <div className="h-32 bg-sky-50 rounded-2xl border border-sky-100"></div>
                  <div className="h-32 bg-sky-50 rounded-2xl border border-sky-100"></div>
                </div>
              </div>
            </div>
          }>
            {activeTab === 'dashboard' && <Dashboard students={students} classes={classes} setActiveTab={setActiveTab} displayName={displayName} />}
            {activeTab === 'students' && <StudentManagement students={students} addStudent={addStudent} updateStudent={updateStudent} deleteStudent={deleteStudent} classes={classes} markClassesAsPaid={markClassesAsPaid} />}
            {activeTab === 'classes' && <ClassTracker students={students} classes={classes} addClass={addClass} updateClass={updateClass} deleteClass={deleteClass} />}
            {activeTab === 'finances' && <FinancialTracking students={students} classes={classes} markClassesAsPaid={markClassesAsPaid} undoLastPayment={undoLastPayment} />}
            {activeTab === 'personal_finance' && (
              <PersonalFinance 
                transactions={transactions}
                financeHistory={financeHistory}
                goals={goals}
                initialBalance={initialBalance}
                addTransaction={addTransaction}
                deleteTransaction={deleteTransaction}
                addGoal={addGoal}
                updateGoal={updateGoal}
                deleteGoal={deleteGoal}
                updateInitialBalance={updateInitialBalance}
                consolidateAndResetBalance={consolidateAndResetBalance}
                deleteFinanceHistory={deleteFinanceHistory}
              />
            )}
          </Suspense>
        )}
      </main>

      <Modal 
        isOpen={isGlobalHistoryOpen} 
        onClose={() => setIsGlobalHistoryOpen(false)} 
        maxWidth="5xl" 
        title="Lịch sử giao dịch"
      >
        <div className="mb-4">
          {financeHistory.length > 0 ? (
            <FinanceHistory financeHistory={financeHistory} deleteFinanceHistory={deleteFinanceHistory} />
          ) : (
            <div className="text-center py-20 bg-sky-50/50 rounded-[32px] border border-sky-100/50 shadow-inner">
              <History className="w-16 h-16 text-sky-200 mx-auto mb-4" />
              <p className="text-sky-800 dark:text-sky-200 font-medium text-lg">Chưa có lịch sử giao dịch nào.</p>
              <p className="text-sky-600/70 mt-1">Lịch sử sẽ xuất hiện khi bạn xác nhận thu học phí của học viên.</p>
            </div>
          )}
        </div>
      </Modal>


      
      <GlobalChatbot 
        transactions={transactions} 
        goals={goals} 
        students={students}
        classes={classes}
        addTransaction={addTransaction}
        addStudent={addStudent}
        updateStudent={updateStudent}
        deleteStudent={deleteStudent}
        addClass={addClass}
        updateClass={updateClass}
        deleteClass={deleteClass}
        deleteTransaction={deleteTransaction}
        addGoal={addGoal}
        updateGoal={updateGoal}
        deleteGoal={deleteGoal}
      />

      {/* Global Loading Overlay */}
      {isProcessing && (
        <div id="loading-overlay" className="fixed inset-0 z-[120] flex items-center justify-center bg-sky-900/20 backdrop-blur-md">
          <div className="flex flex-col items-center bg-white/80 dark:bg-slate-900/80 p-8 rounded-3xl shadow-2xl border border-white dark:border-slate-700/60 backdrop-blur-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-sky-200 border-b-sky-600 mb-4"></div>
            <span className="text-sky-950 dark:text-sky-50 font-bold tracking-tight">Đang xử lý...</span>
          </div>
        </div>
      )}
    </div>
  );
}

const TabButton = React.memo(function TabButton({ active, onClick, icon, label, colorClass, hoverClass }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, colorClass: string, hoverClass: string }) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 border h-auto ${
        active 
          ? `${colorClass} shadow-md transform -translate-y-0.5` 
          : `border-transparent text-sky-700/80 ${hoverClass} hover:shadow-md hover:-translate-y-0.5`
      }`}
    >
      {icon}
      {label}
    </Button>
  );
});

const MobileTabButton = React.memo(function MobileTabButton({ active, onClick, label, colorClass }: { active: boolean, onClick: () => void, label: string, colorClass: string }) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={`whitespace-nowrap py-2 px-4 rounded-xl text-sm font-medium flex-1 text-center transition-all duration-300 border ${
        active 
          ? `${colorClass} shadow-sm` 
          : `border-transparent text-sky-700/80 hover:bg-white/10 hover:text-sky-900 dark:text-sky-100 hover:shadow-sm`
      }`}
    >
      {label}
    </Button>
  );
});

function Onboarding({ onSave }: { onSave: (name: string) => void }) {
  const [name, setName] = useState('');
  const [step, setStep] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      setStep(2);
      setTimeout(() => {
        onSave(name.trim());
      }, 2500);
    }
  };

  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-bounce">👋</div>
          <h1 className="text-2xl font-bold text-sky-950 dark:text-sky-50">
            Chào mừng <span className="text-sky-600">{name}</span> đến với WebApp!
          </h1>
          <p className="text-sky-700/80 animate-pulse">Đang chuẩn bị không gian làm việc cho bạn...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full glass rounded-3xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-sky-600" />
          </div>
          <h1 className="text-2xl font-bold text-sky-950 dark:text-sky-50">Chào mừng bạn!</h1>
          <p className="text-sky-700/80">Chúng tôi rất vui khi có bạn đồng hành.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-sky-900 dark:text-sky-100 mb-2">Bạn là_______?</label>
            <Input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên của bạn..."
              className="bg-white/70"
            />
          </div>
          <Button
            type="submit"
            className="w-full py-6 text-base"
          >
            Bắt đầu ngay
          </Button>
        </form>
      </div>
    </div>
  );
}

function UserMenu({ user, handleLogout, onViewHistory }: { user: User, handleLogout: () => void, onViewHistory: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const firstLetter = user.email ? user.email.charAt(0).toUpperCase() : 'U';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center hover:bg-sky-200 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 overflow-hidden"
        title={user.email || ''}
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          firstLetter
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-sky-100 overflow-hidden z-50 flex flex-col origin-top-right transform"
          >
            <div className="px-4 py-4 border-b border-sky-100 bg-sky-50/50 text-center">
              <div className="w-14 h-14 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-2xl mx-auto mb-3 shadow-inner overflow-hidden">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  firstLetter
                )}
              </div>
              <p className="text-sm font-semibold text-sky-900 dark:text-sky-100 truncate px-2" title={user.email || ''}>
                {user.email}
              </p>
            </div>
            
            <button
              onClick={() => {
                setIsOpen(false);
                onViewHistory();
              }}
              className="flex items-center w-full px-5 py-3.5 text-sm text-sky-700 hover:bg-sky-50 transition-colors gap-3 font-medium border-b border-sky-50"
            >
              <History className="w-4 h-4 text-sky-500" />
              Lịch sử giao dịch
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                handleLogout();
              }}
              className="flex items-center w-full px-5 py-3.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors gap-3 justify-center font-medium"
            >
              <LogOut className="w-4 h-4" />
              Đăng xuất
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
