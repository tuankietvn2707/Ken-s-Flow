import React, { useState, useEffect } from 'react';
import { Student, ClassSession, Transaction, Goal } from './types';
import { Users, BookOpen, LayoutDashboard, LogOut, Wallet } from 'lucide-react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { collection, getDocs, doc, setDoc, deleteDoc, writeBatch, deleteField, getDoc } from 'firebase/firestore';

// Components
import Dashboard from './components/Dashboard';
import StudentManagement from './components/StudentManagement';
import ClassTracker from './components/ClassTracker';
import FinancialTracking from './components/FinancialTracking';
import PersonalFinance from './components/PersonalFinance';
import Login from './components/Login';
import FloatingActionButton from './components/FloatingActionButton';

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
  const [goals, setGoals] = useState<Goal[]>([]);
  const [initialBalance, setInitialBalance] = useState<{ cash: number; banking: number }>({ cash: 0, banking: 0 });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loadingData, setLoadingData] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const showLoading = () => setIsProcessing(true);
  const hideLoading = () => setIsProcessing(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchData(user.uid);
    } else {
      setStudents([]);
      setClasses([]);
    }
  }, [user]);

  const fetchData = async (uid: string) => {
    setLoadingData(true);
    try {
      const [studentsSnap, classesSnap, transactionsSnap, goalsSnap, settingsSnap, profileSnap] = await Promise.all([
        getDocs(collection(db, `users/${uid}/students`)),
        getDocs(collection(db, `users/${uid}/classes`)),
        getDocs(collection(db, `users/${uid}/transactions`)),
        getDocs(collection(db, `users/${uid}/goals`)),
        getDoc(doc(db, `users/${uid}/settings/finance`)),
        getDoc(doc(db, `users/${uid}/profile/info`))
      ]);
      
      if (profileSnap.exists()) {
        setDisplayName(profileSnap.data().displayName || '');
        setShowOnboarding(false);
      } else {
        setShowOnboarding(true);
      }
      const studentsData = studentsSnap.docs.map(doc => doc.data() as Student);
      const classesData = classesSnap.docs.map(doc => doc.data() as ClassSession);
      const transactionsData = transactionsSnap.docs.map(doc => doc.data() as Transaction);
      const goalsData = goalsSnap.docs.map(doc => doc.data() as Goal);
      const settingsData = settingsSnap.exists() ? settingsSnap.data() : { initialBalance: { cash: 0, banking: 0 } };
      
      setStudents(studentsData);
      setClasses(classesData);
      setTransactions(transactionsData);
      setGoals(goalsData);
      setInitialBalance(settingsData.initialBalance || { cash: 0, banking: 0 });

      // Migration logic from localStorage to Firestore
      if (transactionsData.length === 0 && goalsData.length === 0 && !settingsSnap.exists()) {
        try {
          const localTxs = localStorage.getItem('pf_transactions');
          const localGoals = localStorage.getItem('pf_goals');
          const localBalance = localStorage.getItem('pf_initial_balance');

          if (localTxs || localGoals || localBalance) {
            const batch = writeBatch(db);
            let hasData = false;

            if (localTxs) {
              const txs = JSON.parse(localTxs) as Transaction[];
              if (Array.isArray(txs)) {
                txs.forEach(tx => {
                  batch.set(doc(db, `users/${uid}/transactions`, tx.id), tx);
                });
                setTransactions(txs);
                hasData = true;
              }
            }

            if (localGoals) {
              const gs = JSON.parse(localGoals) as Goal[];
              if (Array.isArray(gs)) {
                gs.forEach(g => {
                  batch.set(doc(db, `users/${uid}/goals`, g.id), g);
                });
                setGoals(gs);
                hasData = true;
              }
            }

            if (localBalance) {
              const balance = Number(localBalance);
              if (!isNaN(balance)) {
                batch.set(doc(db, `users/${uid}/settings/finance`), { initialBalance: balance });
                setInitialBalance(balance);
                hasData = true;
              }
            }

            if (hasData) {
              await batch.commit();
              console.log("Successfully migrated local data to Firestore.");
            }
          }
        } catch (migrateError) {
          console.error("Error during migration:", migrateError);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // CRUD for Students
  const addStudent = async (student: Student) => {
    if (!user) return;
    try {
      await setDoc(doc(db, `users/${user.uid}/students`, student.id), student);
      setStudents(prev => [...prev, student]);
    } catch (error) {
      console.error("Error adding student:", error);
    }
  };

  const updateStudent = async (student: Student) => {
    if (!user) return;
    try {
      await setDoc(doc(db, `users/${user.uid}/students`, student.id), student);
      setStudents(prev => prev.map(s => s.id === student.id ? student : s));
    } catch (error) {
      console.error("Error updating student:", error);
    }
  };

  const deleteStudent = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/students`, id));
      setStudents(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error("Error deleting student:", error);
    }
  };

  // CRUD for Classes
  const addClass = async (cls: ClassSession) => {
    if (!user) return;
    try {
      await setDoc(doc(db, `users/${user.uid}/classes`, cls.id), cls);
      setClasses(prev => [cls, ...prev]);
    } catch (error) {
      console.error("Error adding class:", error);
      throw error;
    }
  };

  const updateClass = async (cls: ClassSession) => {
    if (!user) return;
    try {
      await setDoc(doc(db, `users/${user.uid}/classes`, cls.id), cls);
      setClasses(prev => prev.map(c => c.id === cls.id ? cls : c));
    } catch (error) {
      console.error("Error updating class:", error);
      throw error;
    }
  };

  const deleteClass = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/classes`, id));
      setClasses(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error("Error deleting class:", error);
    }
  };

  // Financial
  const markClassesAsPaid = async (studentId: string, classIds: string[]) => {
    if (!user || classIds.length === 0) return;
    const batchId = Date.now();
    try {
      const batch = writeBatch(db);
      classIds.forEach(id => {
        const classRef = doc(db, `users/${user.uid}/classes`, id);
        batch.update(classRef, { isPaid: true, paymentBatchId: batchId });
      });
      await batch.commit();
      setClasses(prev => prev.map(c => classIds.includes(c.id) ? { ...c, isPaid: true, paymentBatchId: batchId } : c));
    } catch (error) {
      console.error("Error marking classes as paid:", error);
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
      await batch.commit();

      setClasses(prev => prev.map(c =>
        c.paymentBatchId === latestBatchId ? { ...c, isPaid: false, paymentBatchId: undefined } : c
      ));
    } catch (error) {
      console.error("Error undoing payment:", error);
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
    } catch (error) {
      console.error("Error adding transaction:", error);
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/transactions`, id));
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  const addGoal = async (goal: Goal) => {
    if (!user) return;
    try {
      await setDoc(doc(db, `users/${user.uid}/goals`, goal.id), goal);
      setGoals(prev => [...prev, goal]);
    } catch (error) {
      console.error("Error adding goal:", error);
    }
  };

  const updateGoal = async (goal: Goal) => {
    if (!user) return;
    try {
      await setDoc(doc(db, `users/${user.uid}/goals`, goal.id), goal);
      setGoals(prev => prev.map(g => g.id === goal.id ? goal : g));
    } catch (error) {
      console.error("Error updating goal:", error);
    }
  };

  const deleteGoal = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/goals`, id));
      setGoals(prev => prev.filter(g => g.id !== id));
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
  };

  const updateInitialBalance = async (balance: { cash: number; banking: number }) => {
    if (!user) return;
    try {
      await setDoc(doc(db, `users/${user.uid}/settings/finance`), { initialBalance: balance });
      setInitialBalance(balance);
    } catch (error) {
      console.error("Error updating initial balance:", error);
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

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <button 
                  onClick={() => window.location.reload()}
                  className="animated-border-box cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <div className="animated-border-inner">
                    <BookOpen className="w-6 h-6 text-indigo-600" />
                    <span className="text-xl font-bold text-indigo-600">
                      TutorFlow
                    </span>
                  </div>
                </button>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-2">
                <TabButton 
                  active={activeTab === 'dashboard'} 
                  onClick={() => setActiveTab('dashboard')}
                  icon={<LayoutDashboard className="w-4 h-4 mr-2" />}
                  label="Tổng quan"
                  colorClass="bg-blue-900/10 text-blue-900 border-blue-900/20"
                  hoverClass="hover:bg-blue-900/5 hover:text-blue-800 hover:border-blue-900/10"
                />
                <TabButton 
                  active={activeTab === 'students'} 
                  onClick={() => setActiveTab('students')}
                  icon={<Users className="w-4 h-4 mr-2" />}
                  label="Học viên"
                  colorClass="bg-blue-100/70 text-blue-800 border-blue-200"
                  hoverClass="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-100"
                />
                <TabButton 
                  active={activeTab === 'classes'} 
                  onClick={() => setActiveTab('classes')}
                  icon={<BookOpen className="w-4 h-4 mr-2" />}
                  label="Lớp học"
                  colorClass="bg-green-100/70 text-green-800 border-green-200"
                  hoverClass="hover:bg-green-50 hover:text-green-700 hover:border-green-100"
                />
                <TabButton 
                  active={activeTab === 'finances'} 
                  onClick={() => setActiveTab('finances')}
                  icon={<DongSign className="w-4 h-4 mr-2" />}
                  label="Tài chính"
                  colorClass="bg-orange-100/70 text-orange-800 border-orange-200"
                  hoverClass="hover:bg-orange-50 hover:text-orange-700 hover:border-orange-100"
                />
                <TabButton 
                  active={activeTab === 'personal_finance'} 
                  onClick={() => setActiveTab('personal_finance')}
                  icon={<Wallet className="w-4 h-4 mr-2" />}
                  label="Thu - Chi"
                  colorClass="bg-cyan-100/70 text-cyan-800 border-cyan-200"
                  hoverClass="hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-100"
                />
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-slate-500 mr-4 hidden sm:block">{user.email}</span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-1.5 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        <div className="sm:hidden border-t border-slate-200 flex overflow-x-auto p-2 gap-2">
           <MobileTabButton 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')}
              label="Tổng quan"
              colorClass="bg-blue-900/10 text-blue-900 border-blue-900/20"
            />
            <MobileTabButton 
              active={activeTab === 'students'} 
              onClick={() => setActiveTab('students')}
              label="Học viên"
              colorClass="bg-blue-100/70 text-blue-800 border-blue-200"
            />
            <MobileTabButton 
              active={activeTab === 'classes'} 
              onClick={() => setActiveTab('classes')}
              label="Lớp học"
              colorClass="bg-green-100/70 text-green-800 border-green-200"
            />
            <MobileTabButton 
              active={activeTab === 'finances'} 
              onClick={() => setActiveTab('finances')}
              label="Tài chính"
              colorClass="bg-orange-100/70 text-orange-800 border-orange-200"
            />
            <MobileTabButton 
              active={activeTab === 'personal_finance'} 
              onClick={() => setActiveTab('personal_finance')}
              label="Thu - Chi"
              colorClass="bg-cyan-100/70 text-cyan-800 border-cyan-200"
            />
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loadingData ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && <Dashboard students={students} classes={classes} setActiveTab={setActiveTab} displayName={displayName} />}
            {activeTab === 'students' && <StudentManagement students={students} addStudent={addStudent} updateStudent={updateStudent} deleteStudent={deleteStudent} classes={classes} markClassesAsPaid={markClassesAsPaid} />}
            {activeTab === 'classes' && <ClassTracker students={students} classes={classes} addClass={addClass} updateClass={updateClass} deleteClass={deleteClass} />}
            {activeTab === 'finances' && <FinancialTracking students={students} classes={classes} markClassesAsPaid={markClassesAsPaid} undoLastPayment={undoLastPayment} />}
            {activeTab === 'personal_finance' && (
              <PersonalFinance 
                transactions={transactions}
                goals={goals}
                initialBalance={initialBalance}
                addTransaction={addTransaction}
                deleteTransaction={deleteTransaction}
                addGoal={addGoal}
                updateGoal={updateGoal}
                deleteGoal={deleteGoal}
                updateInitialBalance={updateInitialBalance}
              />
            )}
          </>
        )}
      </main>

      {activeTab !== 'personal_finance' && <FloatingActionButton setActiveTab={setActiveTab} />}

      {/* Global Loading Overlay */}
      {isProcessing && (
        <div id="loading-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
            <span className="text-white font-medium">Đang xử lý...</span>
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon, label, colorClass, hoverClass }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, colorClass: string, hoverClass: string }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center px-4 py-2 my-2 rounded-xl text-sm font-medium transition-all duration-300 border ${
        active 
          ? `${colorClass} shadow-md transform -translate-y-0.5` 
          : `border-transparent text-slate-500 ${hoverClass} hover:shadow-md hover:-translate-y-0.5`
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function MobileTabButton({ active, onClick, label, colorClass }: { active: boolean, onClick: () => void, label: string, colorClass: string }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap py-2 px-4 rounded-lg text-sm font-medium flex-1 text-center transition-all duration-300 border ${
        active 
          ? `${colorClass} shadow-sm` 
          : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700 hover:shadow-sm'
      }`}
    >
      {label}
    </button>
  );
}

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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-bounce">👋</div>
          <h1 className="text-2xl font-bold text-slate-800">
            Chào mừng <span className="text-indigo-600">{name}</span> đến với WebApp!
          </h1>
          <p className="text-slate-500 animate-pulse">Đang chuẩn bị không gian làm việc cho bạn...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Chào mừng bạn!</h1>
          <p className="text-slate-500">Chúng tôi rất vui khi có bạn đồng hành.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Bạn là_______?</label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên của bạn..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Bắt đầu ngay
          </button>
        </form>
      </div>
    </div>
  );
}
