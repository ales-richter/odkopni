import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, linkWithPopup } from "firebase/auth";
import {
  getFirestore, collection, addDoc, getDocs, getDoc, updateDoc,
  deleteDoc, doc, query, where, orderBy, onSnapshot, setDoc
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBm6eERqU-jh50BRFdEarycFy42Iqp6FJU",
  authDomain: "odkopni.firebaseapp.com",
  projectId: "odkopni",
  storageBucket: "odkopni.firebasestorage.app",
  messagingSenderId: "83040664350",
  appId: "1:83040664350:web:03cd864cec2a4c8c2f670f"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Google provider — při každém přihlášení nechá vybrat účet
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export {
  signInAnonymously, onAuthStateChanged,
  signInWithPopup, linkWithPopup,
  collection, addDoc, getDocs, getDoc, updateDoc,
  deleteDoc, doc, query, where, orderBy, onSnapshot, setDoc
};
