importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyCrvihJ12N8HqznCRL0-JJzHfl04qyNBjw",
  authDomain: "tutorflow-def01.firebaseapp.com",
  databaseURL: "https://tutorflow-def01-default-rtdb.firebaseio.com",
  projectId: "tutorflow-def01",
  storageBucket: "tutorflow-def01.firebasestorage.app",
  messagingSenderId: "11163283172",
  appId: "1:11163283172:web:455dde44215387a48506f1",
  measurementId: "G-7FDQMGN1J4"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || 'Thông báo mới';
  const notificationOptions = {
    body: payload.notification?.body || 'Bạn có thông báo mới.',
    icon: '/logo.png?v=2'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
