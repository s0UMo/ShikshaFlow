import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';

const getEnv = (key: string, fallback: string) => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  const proc = (globalThis as any).process;
  if (proc && proc.env && proc.env[key]) {
    return proc.env[key];
  }
  return fallback;
};

const firebaseConfig = {
  apiKey: getEnv("VITE_FIREBASE_API_KEY", "AIzaSyCKCPh6Dd2cWCC6hC8RUVzr4EdYQKWetyA"),
  authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN", "shikshaflow-1196a.firebaseapp.com"),
  projectId: getEnv("VITE_FIREBASE_PROJECT_ID", "shikshaflow-1196a"),
  storageBucket: getEnv("VITE_FIREBASE_STORAGE_BUCKET", "shikshaflow-1196a.firebasestorage.app"),
  messagingSenderId: getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID", "294122120820"),
  appId: getEnv("VITE_FIREBASE_APP_ID", "1:294122120820:web:85aef4845c717d955cd321")
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firestore with IndexedDB multi-tab offline persistence
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// Initialize Auth
export const auth = getAuth(app);
