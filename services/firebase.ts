import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA7dDAbUtdhtwMGOlIkmquRXTzra5jPNbU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "brady-audit-suite-d5cb6.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "brady-audit-suite-d5cb6",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "brady-audit-suite-d5cb6.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "124700228964",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:124700228964:web:26b31092b603bfc41ece71",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-5XPSPMF7JY"
};

// Inicializar la aplicación de Firebase
export const app = initializeApp(firebaseConfig);

// Inicializar y exportar los servicios que usaremos en la V3
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
