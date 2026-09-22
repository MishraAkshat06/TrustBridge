import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyB4aTkanSKhBUAClG06MnhIQAAfqXUGJKs',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'trustbridge-cc22a.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'trustbridge-cc22a',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'trustbridge-cc22a.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '421521332718',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:421521332718:web:ff54cb2d853e0dec9356ff'
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.authDomain && 
  firebaseConfig.projectId
);

const app = isFirebaseConfigured
  ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApp())
  : null;

export const auth = app ? getAuth(app) : null;
export const googleProvider = new GoogleAuthProvider();

export default app;
