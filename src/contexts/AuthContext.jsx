import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase/clientConfig';
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { getUserProfile } from '../firebase/db';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/clientConfig';

const AuthContext = createContext({ user: null, userRole: null, loading: true, logout: async () => {} });

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe;

    // First process redirect, then listen
    getRedirectResult(auth)
      .catch((e) => console.warn('Redirect result error:', e))
      .finally(() => {
        if (!isMounted) return;
        unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
          if (!isMounted) return;
          setLoading(true);
          setUser(null);
          setUserRole(null);

          if (fbUser) {
            let role = null;
            for (const r of ['client','driver','owner']) {
              const p = await getUserProfile(fbUser.uid, r);
              if (p) { role = r; break; }
            }
            if (!role) {
              // new client
              const ref = doc(db, 'clients', fbUser.uid);
              await setDoc(ref, {
                displayName: fbUser.displayName || '',
                email: fbUser.email,
                photoURL: fbUser.photoURL || '',
                phone: fbUser.phoneNumber || '',
                createdAt: new Date(), updatedAt: new Date()
              });
              role = 'client';
            }
            setUser(fbUser);
            setUserRole(role);
          }

          if (isMounted) setLoading(false);
        });
      });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const logout = async () => {
    await auth.signOut();
    setUser(null);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, userRole, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
