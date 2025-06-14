import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from './clientConfig';

// Create a new user with email & password
export const signUp = (email, password) =>
  createUserWithEmailAndPassword(auth, email, password);

// Sign in existing user with email & password
export const signIn = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

// Sign out the currently authenticated user
export const signOut = () => firebaseSignOut(auth);

// Listener for auth state changes (login/logout)
export const onAuthState = (callback) => onAuthStateChanged(auth, callback);
