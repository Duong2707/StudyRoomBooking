import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCJxSOiGtpLQr6bEdwcKBSzEqV3Q9nN3JY",
  authDomain: "studyroombooking-9b372.firebaseapp.com",
  projectId: "studyroombooking-9b372",
  storageBucket: "studyroombooking-9b372.firebasestorage.app",
  messagingSenderId: "907599393641",
  appId: "1:907599393641:web:5e5cdae0108c44522cc3f8",
};

const app = getApps().length > 0
  ? getApp()
  : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;