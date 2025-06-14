import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
} from 'firebase/firestore';
import { db } from './clientConfig';

// Create or overwrite a user profile in a role-based collection.
// role should be 'client', 'driver', or 'owner'. 
// `data` is an object containing whatever fields you need to store.
export const createUserProfile = async (uid, role, data) => {
  const col = collection(db, role + 's'); // e.g. 'clients', 'drivers', 'owners'
  await setDoc(doc(col, uid), data);
};

// Fetch a user’s profile by UID and role. Returns `null` if not found.
export const getUserProfile = async (uid, role) => {
  const docRef = doc(db, role + 's', uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
};

// Example: Query all buses for a given route (expand as needed)
export const getBusesByRoute = async (routeName) => {
  const busesRef = collection(db, 'availableBuses');
  const q = query(busesRef, where('routeName', '==', routeName));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// Example: Create a new booking document
export const createBooking = async (bookingData) => {
  const bookingsRef = collection(db, 'bookings');
  const docRef = await addDoc(bookingsRef, bookingData);
  return { id: docRef.id, ...bookingData };
};

// (Add additional Firestore helpers as needed)
