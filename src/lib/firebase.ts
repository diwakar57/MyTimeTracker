import { initializeApp, getApps, getApp as _getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAoBiVgfLO1oPGCmmyudeSI_4pa0F0wOsA",
  authDomain: "mytimetrackergit.firebaseapp.com",
  projectId: "mytimetrackergit",
  storageBucket: "mytimetrackergit.firebasestorage.app",
  messagingSenderId: "301128777642",
  appId: "1:301128777642:web:c0c2de9e36baf393b4b5d3",
  measurementId: "G-XP3WCZ29VS",
};

function getApp() {
  if (getApps().length === 0) {
    return initializeApp(firebaseConfig);
  }
  return _getApp();
}

export function getFirebaseAuth(): Auth {
  return getAuth(getApp());
}

export function getFirebaseDb(): Firestore {
  return getFirestore(getApp());
}
