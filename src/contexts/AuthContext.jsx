import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase/clientConfig'
import { onAuthState, signOut } from '../firebase/auth';
import { getUserProfile } from '../firebase/db';

// Create the context
const AuthContext = createContext({
  user: null,
  userRole: null,
  loading: true,
  logout: async () => {},
});

// Provide the context to children
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthState(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        // Check which role the user belongs to by scanning all role collections
        const roles = ['client', 'driver', 'owner'];
        for (const role of roles) {
          const profile = await getUserProfile(firebaseUser.uid, role);
          if (profile) {
            setUserRole(role);
            break;
          }
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe(); // Clean up listener on unmount
  }, []);

  // Logout function
  const logout = async () => {
    await signOut();
    setUser(null);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, userRole, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);
