import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import { getAI } from 'firebase/ai';

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
export const ai = getAI(app);

// Cấu hình Firebase cho app kensmartvocab (Kho từ vựng Global)
export const vocabConfig = {
  apiKey: "AIzaSyATPYGcBabX-qR8v3DD4sOV4FSBcX0O42s",
  authDomain: "smarv-8051f.firebaseapp.com",
  databaseURL: "https://smarv-8051f-default-rtdb.firebaseio.com",
  projectId: "smarv-8051f",
  storageBucket: "smarv-8051f.firebasestorage.app",
  messagingSenderId: "464584416861",
  appId: "1:464584416861:web:c6a990cfb24bc7ffdfb7b4",
  measurementId: "G-HME83VE7S5"
};

// Khởi tạo app thứ 2 (đặt tên là "vocabApp" để không trùng với app chính)
const vocabApp = initializeApp(vocabConfig, "vocabApp");
export const vocabDb = getFirestore(vocabApp);

// Khởi tạo Analytics (chỉ chạy trên trình duyệt)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
