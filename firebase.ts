import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export const firebaseConfig = {
  apiKey: "AIzaSyAQHuS-mgFNOX2NRGs2MOcbKtfOKC97_e4",
  authDomain: "bac-240.firebaseapp.com",
  projectId: "bac-240",
  storageBucket: "bac-240.firebasestorage.app",
  messagingSenderId: "773836224514",
  appId: "1:773836224514:web:4ff986e39336d6f4b10f1b"
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
