import React, { useState, useEffect, useRef } from 'react';
import { Student, ClassSession, formatVND, parseDateSafe } from '../types';
import { Users, Calendar, Plus, UserPlus, CalendarPlus, CreditCard, Bell, BellRing } from 'lucide-react';
import { motion } from 'motion/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

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

const weeklyScheduleData = [
  { name: 'T2', sessions: 1, hours: 2 },
  { name: 'T3', sessions: 2, hours: 3 },
  { name: 'T4', sessions: 1, hours: 1.5 },
  { name: 'T5', sessions: 3, hours: 4.5 },
  { name: 'T6', sessions: 0, hours: 0 },
  { name: 'T7', sessions: 4, hours: 6 },
  { name: 'CN', sessions: 2, hours: 3 },
];

const formatYAxisCurrency = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(0)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return value.toString();
};

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const dayName = label === 'CN' ? 'Chủ Nhật' : `Thứ ${label.replace('T', '')}`;
    return (
      <div className="glass-panel/90 backdrop-blur-md p-3 border border-sky-300/30 shadow-lg rounded-xl">
        <p className="font-semibold text-sky-950 mb-1">{dayName}</p>
        <p className="text-sm text-sky-700/80">
          <span className="font-medium text-sky-600">{payload[0].value} buổi học</span>
          {' '}
          ({payload[1].value} giờ)
        </p>
      </div>
    );
  }
  return null;
};

const CustomAreaTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const actual = payload.find((p: any) => p.dataKey === 'actual')?.value || 0;
    const potential = payload.find((p: any) => p.dataKey === 'potential')?.value || 0;
    const remaining = potential - actual;

    return (
      <div className="glass-panel/90 backdrop-blur-md p-3 border border-sky-300/30 shadow-lg rounded-xl">
        <p className="font-semibold text-sky-950 mb-3">{`Tháng ${label.replace('T', '')}`}</p>
        <div className="space-y-2">
          <p className="text-sm flex justify-between items-center gap-4">
            <span className="text-sky-700/80">Tổng số tiền có thể thu:</span>
            <span className="font-medium text-sky-600">{formatVND(potential)}</span>
          </p>
          <p className="text-sm flex justify-between items-center gap-4">
            <span className="text-sky-700/80">Đã thanh toán:</span>
            <span className="font-semibold text-emerald-500">{formatVND(actual)}</span>
          </p>
          <p className="text-sm flex justify-between items-center gap-4 pt-2 border-t border-sky-300/30">
            <span className="text-sky-700/80">Chờ thanh toán:</span>
            <span className="font-medium text-amber-500">{formatVND(remaining)}</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

interface DashboardProps {
  students: Student[];
  classes: ClassSession[];
  setActiveTab?: (tab: string) => void;
  displayName?: string;
}

export default function Dashboard({ students, classes, setActiveTab, displayName }: DashboardProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  });

  // Calculate financial data dynamically based on selected month
  let tongTienCoTheThu = 0;
  let soTienThanhToan = 0;
  let choThanhToan = 0;

  // Calculate potential revenue based on fee * feeCycle for ALL active students (Global)
  students.filter(s => s.status !== 'inactive').forEach(student => {
    const feeCycle = student.feeCycle || 8;
    tongTienCoTheThu += (student.fee || 0) * feeCycle;
  });

  const filteredClasses = classes.filter(c => {
    const classDate = parseDateSafe(c.date);
    if (isNaN(classDate.getTime())) return false;
    const classMonth = `${classDate.getFullYear()}-${(classDate.getMonth() + 1).toString().padStart(2, '0')}`;
    return classMonth === selectedMonth;
  });

  filteredClasses.forEach(c => {
    const student = students.find(s => s.id === c.studentId);
    const feePerSession = student?.fee || 0;
    const amount = feePerSession * Number(c.duration);
    if (c.isPaid) {
      soTienThanhToan += amount;
    } else {
      choThanhToan += amount;
    }
  });

  const soTienCoTheThuConLai = tongTienCoTheThu - soTienThanhToan - choThanhToan;

  const donutData = [
    { name: 'Số tiền thanh toán', value: soTienThanhToan > 0 ? soTienThanhToan : 0, fill: '#BAFFC9' }, // Green Pastel
    { name: 'Chờ thanh toán', value: choThanhToan > 0 ? choThanhToan : 0, fill: '#FFB3BA' }, // Red Pastel
    { name: 'Số tiền có thể thu còn lại', value: soTienCoTheThuConLai > 0 ? soTienCoTheThuConLai : 0, fill: '#BDE0FE' } // Blue Pastel
  ];

  // Calculate classes this week
  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const classesThisWeek = classes.filter(c => {
    const classDate = parseDateSafe(c.date);
    if (isNaN(classDate.getTime())) return false;
    return classDate >= startOfWeek && classDate <= endOfWeek;
  }).length;

  // Calculate revenue trend dynamically
  const revenueTrendMap = new Map<string, { name: string, actual: number, potential: number, sortKey: string }>();
  
  classes.forEach(c => {
    const classDate = parseDateSafe(c.date);
    if (isNaN(classDate.getTime())) return;
    
    const month = classDate.getMonth() + 1;
    const year = classDate.getFullYear();
    const monthYear = `T${month}/${year.toString().slice(-2)}`;
    const sortKey = `${year}-${month.toString().padStart(2, '0')}`;
    
    const student = students.find(s => s.id === c.studentId);
    const feePerSession = student?.fee || 0;
    const amount = feePerSession * Number(c.duration);
    
    if (!revenueTrendMap.has(monthYear)) {
      revenueTrendMap.set(monthYear, { name: monthYear, actual: 0, potential: 0, sortKey });
    }
    
    const data = revenueTrendMap.get(monthYear)!;
    data.potential += amount;
    if (c.isPaid) {
      data.actual += amount;
    }
  });

  const dynamicRevenueTrendData = Array.from(revenueTrendMap.values())
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .map(({ name, actual, potential }) => ({ 
      name, 
      actual, 
      potential,
      remaining: potential - actual
    }));

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = displayName || 'bạn';
    if (hour < 12) return `Chào buổi sáng, ${name}!`;
    if (hour < 18) return `Chào buổi chiều, ${name}!`;
    return `Chào buổi tối, ${name}!`;
  };

  const playNotificationSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // Tạo âm báo (mô phỏng tiếng ting)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // 880Hz (A5)
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1); 
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.log('Không thể phát âm thanh', e);
    }
  };

  const [notificationPermission, setNotificationPermission] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [fcmToken, setFcmToken] = useState<string | null>(
    typeof window !== 'undefined' ? window.localStorage.getItem('fcm_token') : null
  );
  const [inAppNotifications, setInAppNotifications] = useState<{title: string, body: string, time: Date}[]>([]);

  // Thiết lập Firebase Messaging nếu đã được cấp quyền trước đó
  useEffect(() => {
    const setupMessaging = async () => {
      if (typeof window !== 'undefined' && "Notification" in window && Notification.permission === "granted") {
        try {
          const { getAppMessaging } = await import('../firebase');
          const { getToken, onMessage } = await import('firebase/messaging');
          const messaging = await getAppMessaging();
          
          if (messaging) {
            // Đăng ký Service Worker rõ ràng
            let swRegistration = undefined;
            if ('serviceWorker' in navigator) {
              swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
                scope: '/'
              });
            }

            // Lấy lại token để đảm bảo nó luôn mới
            const currentToken = await getToken(messaging, {
              serviceWorkerRegistration: swRegistration
            });
            if (currentToken) {
              window.localStorage.setItem('fcm_token', currentToken);
              setFcmToken(currentToken);
            }

            // Lắng nghe thông báo khi app đang mở (foreground)
            onMessage(messaging, (payload) => {
              console.log('Message received in foreground: ', payload);
              // Lưu vào list thông báo hiển thị trên thẻ giao diện
              const title = payload.notification?.title || payload.data?.title || "Thông báo";
              const body = payload.notification?.body || payload.data?.body || "Bạn có tin nhắn mới.";
              
              setInAppNotifications(prev => [{
                title,
                body,
                time: new Date()
              }, ...prev]);

              playNotificationSound();

              // Gửi Notification cục bộ của hệ điều hành
              if (Notification.permission === 'granted') {
                try {
                  // Cố gắng hiển thị qua window.Notification trước (hoạt động tốt trên Macbook/Windows)
                  const notification = new window.Notification(title, { 
                    body, 
                    icon: "/logo.png?v=2",
                    requireInteraction: true // Giữ thông báo trên màn hình cho đến khi user tương tác
                  });
                  
                  notification.onclick = function() {
                    window.focus();
                    this.close();
                  };
                } catch (e) {
                  // Fallback cho iOS Safari/PWA (yêu cầu dùng qua Service Worker)
                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistration().then(reg => {
                      if (reg) {
                        reg.showNotification(title, {
                          body,
                          icon: "/logo.png?v=2",
                          vibrate: [200, 100, 200],
                          requireInteraction: true
                        });
                      }
                    });
                  }
                }
              }
            });
          }
        } catch (error) {
          console.error("Lỗi khi kết nối FCM:", error);
        }
      }
    };
    setupMessaging();
  }, []);

  const requestNotificationPermission = async () => {
    try {
      if (!("Notification" in window)) {
        alert("Trình duyệt của bạn không hỗ trợ thông báo (Desktop Notifications).");
        return;
      }
      
      let permission = Notification.permission;
      if (permission !== "granted" && permission !== "denied") {
        permission = await Notification.requestPermission();
      }
      
      setNotificationPermission(permission);
      
      if (permission === "granted") {
        const { getAppMessaging } = await import('../firebase');
        const { getToken, onMessage } = await import('firebase/messaging');
        const messaging = await getAppMessaging();

        if (messaging) {
          try {
            let swRegistration = undefined;
            if ('serviceWorker' in navigator) {
              swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
                scope: '/'
              });
            }

            // Note: In production you should pass your VAPID key here if you have one.
            const currentToken = await getToken(messaging, { 
              serviceWorkerRegistration: swRegistration
              // vapidKey: 'YOUR_VAPID_KEY_HERE' 
            });
            if (currentToken) {
              console.log('FCM Token:', currentToken);
              // Lưu token vào local storage hoặc window để người dùng dễ lấy
              window.localStorage.setItem('fcm_token', currentToken);
              setFcmToken(currentToken);
              
              // Listener đã được đăng ký ở useEffect, không đăng ký lại ở đây để tránh trùng lặp

              new Notification("Đã kết nối với máy chủ thông báo!", { 
                body: "Bạn đã bật thông báo thành công. Có thể sao chép FCM Token dưới góc trái để test nghiệm.",
                icon: "/logo.png?v=2"
              });
            } else {
              console.log('No registration token available.');
            }
          } catch (err) {
            console.error('An error occurred while retrieving token. ', err);
            new Notification("Lỗi kết nối", { 
              body: "Lỗi kết nối máy chủ thông báo. " + err,
              icon: "/logo.png?v=2"
            });
          }
        } else {
           new Notification("Máy chủ đẩy không khả dụng!", { 
            body: "Trình duyệt của bạn không được server Push Notification hỗ trợ.",
            icon: "/logo.png?v=2"
          });
        }
      } else {
        alert("Bạn đã chặn quyền thông báo. Vui lòng cấp quyền lại trong cài đặt trình duyệt để tiếp tục.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const copyFcmToken = () => {
    if (fcmToken) {
      navigator.clipboard.writeText(fcmToken);
      alert("Đã sao chép FCM Token: " + fcmToken.substring(0, 20) + "...");
    } else {
      alert("Chưa có Token. Vui lòng bật thông báo trước!");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="text-2xl font-bold text-sky-950"
        >
          {getGreeting()}
        </motion.h1>

        <button 
          onClick={requestNotificationPermission}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm ${
            notificationPermission === 'granted' && fcmToken
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
              : notificationPermission === 'granted'
                ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100' 
                : 'bg-white text-sky-600 border border-indigo-200 hover:bg-sky-50'
          }`}
          title={notificationPermission === 'granted' && fcmToken ? "Đã bật thông báo" : notificationPermission === 'granted' ? "Đang kết nối..." : "Bật thông báo"}
        >
          {notificationPermission === 'granted' ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
          <span className="hidden sm:inline">
            {notificationPermission === 'granted' && fcmToken ? 'Đã bật thông báo' : notificationPermission === 'granted' ? 'Đang tải Token...' : 'Bật thông báo'}
          </span>
        </button>
      </div>

      {inAppNotifications.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="bg-sky-50 border border-indigo-100 rounded-3xl p-4 flex flex-col gap-3 shadow-sm"
        >
          <div className="flex justify-between items-center px-2">
            <h3 className="font-semibold text-indigo-800 flex items-center gap-2">
              <BellRing className="w-5 h-5" /> Thông báo mới ({inAppNotifications.length})
            </h3>
            <button onClick={() => setInAppNotifications([])} className="text-xs text-sky-500 hover:text-indigo-700 underline">Xoá tất cả</button>
          </div>
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-2">
            {inAppNotifications.map((note, idx) => (
              <div key={idx} className="glass-panel p-3 rounded-xl shadow-sm border border-sky-300/30">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-sky-900">{note.title}</h4>
                  <span className="text-xs text-sky-600/50">{note.time.toLocaleTimeString()}</span>
                </div>
                <p className="text-sm text-sky-700/80">{note.body}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="grid grid-cols-1 gap-5 sm:grid-cols-3"
      >
        <div 
          onClick={() => setActiveTab && setActiveTab('students')}
          className="glass-panel border-sky-300/30 overflow-hidden rounded-3xl shadow-[0_8px_32px_rgba(14,165,233,0.08)] cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(14,165,233,0.15)] hover:ring-2 hover:ring-sky-100"
        >
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-[#BAE1FF] rounded-xl p-3">
                <Users className="h-6 w-6 text-sky-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-sky-700/80 truncate">Học viên đang hoạt động</dt>
                  <dd className="text-3xl font-bold text-sky-950 mt-1">{students.filter(s => s.status !== 'inactive').length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab && setActiveTab('classes')}
          className="glass-panel border-sky-300/30 overflow-hidden rounded-3xl shadow-[0_8px_32px_rgba(14,165,233,0.08)] cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(14,165,233,0.15)] hover:ring-2 hover:ring-sky-100"
        >
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-[#BAFFC9] rounded-xl p-3">
                <Calendar className="h-6 w-6 text-emerald-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-sky-700/80 truncate">Lớp học tuần này</dt>
                  <dd className="text-3xl font-bold text-sky-950 mt-1">{classesThisWeek}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab && setActiveTab('finances')}
          className="glass-panel border-sky-300/30 overflow-hidden rounded-3xl shadow-[0_8px_32px_rgba(14,165,233,0.08)] cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(14,165,233,0.15)] hover:ring-2 hover:ring-sky-100"
        >
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-[#FFDFBA] rounded-xl p-3">
                <DongSign className="h-6 w-6 text-amber-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-sky-700/80 truncate">Chờ thanh toán</dt>
                  <dd className="text-2xl font-bold text-sky-950 mt-1">{formatVND(choThanhToan)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Button Tool Copy FCM Token for Dev/Testing */}
      {notificationPermission === 'granted' && fcmToken && (
        <div className="flex justify-end -mt-2">
           <button onClick={copyFcmToken} className="text-xs text-sky-600/50 hover:text-sky-500 underline flex items-center gap-1">
             <span>Copy FCM Token để test gửi thông báo</span>
           </button>
        </div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="grid grid-cols-1 gap-5 lg:grid-cols-2"
      >
        {/* Revenue Trend Chart (50%) */}
        <div className="glass-panel border-sky-300/30 rounded-3xl shadow-[0_8px_32px_rgba(14,165,233,0.08)] lg:col-span-1 flex flex-col">
          <div className="p-6 border-b border-sky-300/30">
            <h3 className="text-lg font-bold text-sky-900">Xu hướng doanh thu</h3>
          </div>
          <div className="p-6 flex-1 min-h-[450px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <BarChart data={dynamicRevenueTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} tickFormatter={formatYAxisCurrency} />
                <RechartsTooltip content={<CustomAreaTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '13px', fontWeight: 500, color: '#64748B' }} />
                <Bar dataKey="potential" name="Tổng số tiền có thể thu" fill="#BAE1FF" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="actual" name="Đã thanh toán" fill="#BAFFC9" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="remaining" name="Chờ thanh toán" fill="#FFDFBA" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tỷ lệ thu hồi học phí (Donut Chart) (50%) */}
        <div className="glass-panel border-sky-300/30 rounded-3xl shadow-[0_8px_32px_rgba(14,165,233,0.08)] lg:col-span-1 flex flex-col">
          <div className="p-6 border-b border-sky-300/30 flex justify-between items-center">
            <h3 className="text-lg font-bold text-sky-900 font-sans">Tỷ lệ thu hồi học phí</h3>
            <div className="relative">
              <input
                type="month"
                id="financialMonthFilter"
                value={selectedMonth}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedMonth(e.target.value);
                  }
                }}
                className="text-sm border border-sky-300/50 rounded-xl px-3 py-1.5 text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white/70 shadow-sm w-40 cursor-pointer hover:border-sky-300 transition-colors"
              />
            </div>
          </div>
          <div className="p-6 py-10 flex-1 min-h-[450px] flex flex-col">
            <div className="flex-1 relative min-h-0 min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="#FFFFFF"
                    strokeWidth={2}
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Pie
                    data={[{ name: 'Tổng số tiền có thể thu', value: tongTienCoTheThu, fill: '#FFB7B2' }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={100}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill="#FFB7B2" />
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: number) => formatVND(value)}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-sky-950">{(tongTienCoTheThu > 0 ? (soTienThanhToan / tongTienCoTheThu) * 100 : 0).toFixed(1)}%</span>
                <span className="text-xs font-medium text-sky-700/80 mt-1">Đã hoàn thành</span>
              </div>
            </div>
            
            <div className="mt-4 space-y-3">
              <div className="flex justify-center">
                <div className="flex items-center gap-2 bg-sky-50/40 px-4 py-2 rounded-xl border border-sky-300/30">
                  <div className="w-3 h-3 rounded-full bg-[#FFB7B2]"></div>
                  <span className="text-sm text-pink-400 font-bold">Tổng số tiền có thể thu: </span>
                  <span className="font-bold text-sky-900">{formatVND(tongTienCoTheThu)}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 px-4 max-w-md mx-auto w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#BDE0FE]"></div>
                    <span className="text-sm text-sky-700/80">Số tiền có thể thu còn lại:</span>
                  </div>
                  <span className="font-semibold text-sky-900">{formatVND(soTienCoTheThuConLai)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#BAFFC9]"></div>
                    <span className="text-sm text-sky-700/80">Số tiền thanh toán:</span>
                  </div>
                  <span className="font-semibold text-sky-900">{formatVND(soTienThanhToan)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#FFB3BA]"></div>
                    <span className="text-sm text-sky-700/80">Chờ thanh toán:</span>
                  </div>
                  <span className="font-semibold text-sky-900">{formatVND(choThanhToan)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
