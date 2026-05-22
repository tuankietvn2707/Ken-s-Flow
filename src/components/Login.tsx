import React, { useState } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { Wallet } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { motion } from 'motion/react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Đăng nhập Google thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden bg-slate-50">
      {/* Animated Mesh Gradients */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-sky-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob pointer-events-none"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-2000 pointer-events-none"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-4000 pointer-events-none"></div>

      {/* Floating Decorative Elements */}
      <div className="absolute top-[20%] left-[8%] animate-float-slow opacity-50 pointer-events-none">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="18" cy="18" r="16" stroke="url(#loginGrad1)" strokeWidth="3" strokeDasharray="4 4" />
          <defs>
            <linearGradient id="loginGrad1" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38BDF8" stopOpacity="0.7" />
              <stop offset="1" stopColor="#818CF8" stopOpacity="0.2" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="absolute bottom-[25%] right-[10%] animate-float opacity-40 pointer-events-none">
        <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="44" height="44" rx="14" stroke="url(#loginGrad2)" strokeWidth="3" transform="rotate(12 25 25)" />
          <defs>
            <linearGradient id="loginGrad2" x1="0" y1="0" x2="50" y2="50" gradientUnits="userSpaceOnUse">
              <stop stopColor="#A78BFA" stopOpacity="0.6" />
              <stop offset="1" stopColor="#38BDF8" stopOpacity="0.15" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="absolute top-[60%] left-[75%] animate-float-fast opacity-30 pointer-events-none">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 0V28M0 14H28" stroke="url(#loginGrad3)" strokeWidth="5" strokeLinecap="round" />
          <defs>
            <linearGradient id="loginGrad3" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#34D399" stopOpacity="0.6" />
              <stop offset="1" stopColor="#38BDF8" stopOpacity="0.2" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Logo */}
      <motion.div 
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="sm:mx-auto sm:w-full sm:max-w-md relative z-10"
      >
        <div className="flex justify-center">
          <div className="bg-gradient-to-br from-sky-500 to-indigo-600 text-white p-3 rounded-2xl shadow-[0_8px_32px_rgba(14,165,233,0.3)]">
            <Wallet className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-indigo-600 tracking-tight">
          TutorFlow
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 font-medium">
          {isLogin ? 'Đăng nhập để quản lý lớp học' : 'Đăng ký tài khoản mới'}
        </p>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10"
      >
        <div className="bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_8px_40px_rgba(14,165,233,0.08)] rounded-[28px] py-8 px-6 sm:px-10 relative overflow-hidden">
          <div className="bg-noise rounded-[28px]"></div>
          <div className="relative z-10">
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm font-medium"
                >
                  {error}
                </motion.div>
              )}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">Email</label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/80 border-slate-200/80 focus:border-sky-400 focus:ring-sky-200"
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">Mật khẩu</label>
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/80 border-slate-200/80 focus:border-sky-400 focus:ring-sky-200"
                  placeholder="••••••••"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full py-6 text-base bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 shadow-[0_8px_24px_rgba(14,165,233,0.3)] hover:shadow-[0_12px_32px_rgba(14,165,233,0.4)] transition-all duration-300 rounded-[16px] relative overflow-hidden group btn-magnetic"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                <span className="relative z-10 font-bold tracking-wide">
                  {loading ? 'Đang xử lý...' : (isLogin ? 'Đăng nhập' : 'Đăng ký')}
                </span>
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200/80" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white/70 text-slate-500 font-medium rounded-full">Hoặc tiếp tục với</span>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  variant="outline"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center border-slate-200/80 bg-white/60 hover:bg-white hover:shadow-md transition-all duration-300 rounded-[16px] py-5 group btn-magnetic"
                >
                  <svg className="w-5 h-5 mr-2.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span className="font-semibold text-slate-700">Google</span>
                </Button>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Button
                variant="link"
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-sm text-sky-600 hover:text-sky-700 font-semibold"
              >
                {isLogin ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
