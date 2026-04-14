import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Cấu hình Firebase của bạn
export const firebaseConfig = {
  apiKey: "AIzaSyCrvihJ12N8HqznCRL0-JJzHfl04qyNBjw",
  authDomain: "tutorflow-def01.firebaseapp.com",
  databaseURL: "https://tutorflow-def01-default-rtdb.firebaseio.com",
  projectId: "tutorflow-def01",
  storageBucket: "tutorflow-def01.firebasestorage.app",
  messagingSenderId: "11163283172",
  appId: "1:11163283172:web:455dde44215387a48506f1",
  measurementId: "G-7FDQMGN1J4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Khởi tạo Analytics (chỉ chạy trên trình duyệt)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
