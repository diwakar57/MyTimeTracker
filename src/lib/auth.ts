import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { getFirebaseAuth } from './firebase';

const googleProvider = new GoogleAuthProvider();

export function signInWithGoogle(): Promise<User> {
  return signInWithPopup(getFirebaseAuth(), googleProvider).then((result) => result.user);
}

export function registerWithEmail(email: string, password: string): Promise<User> {
  return createUserWithEmailAndPassword(getFirebaseAuth(), email, password).then((cred) => cred.user);
}

export function signInWithEmail(email: string, password: string): Promise<User> {
  return signInWithEmailAndPassword(getFirebaseAuth(), email, password).then((cred) => cred.user);
}

export function signOut(): Promise<void> {
  return firebaseSignOut(getFirebaseAuth());
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(getFirebaseAuth(), callback);
}
