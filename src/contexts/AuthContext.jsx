import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase/clientConfig'
import { onAuthState, signOut } from '../firebase/auth';
import { getUserProfile } from '../firebase/db';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/clientConfig';

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
  const [roleChecked, setRoleChecked] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthState(async (firebaseUser) => {
      if (!isMounted) return;

      // Reset states when auth state changes
      if (isMounted) {
        setUser(null);
        setUserRole(null);
        setRoleChecked(false);
        setLoading(true);
      }

      if (firebaseUser) {
        try {
          // Check which role the user belongs to by scanning all role collections
          const roles = ['client', 'driver', 'owner'];
          let foundRole = null;

          for (const role of roles) {
            const profile = await getUserProfile(firebaseUser.uid, role);
            if (profile) {
              foundRole = role;
              break;
            }
          }

          // If no role found, create a client profile and re-check
          if (!foundRole) {
            try {
              const clientRef = doc(db, 'clients', firebaseUser.uid);
              await setDoc(clientRef, {
                displayName: firebaseUser.displayName || '',
                email: firebaseUser.email,
                photoURL: firebaseUser.photoURL || '',
                phone: firebaseUser.phoneNumber || '',
                createdAt: new Date(),
                updatedAt: new Date()
              });
              // Re-check roles after creating profile
              for (const role of roles) {
                const profile = await getUserProfile(firebaseUser.uid, role);
                if (profile) {
                  foundRole = role;
                  break;
                }
              }
            } catch (profileError) {
              console.error('[AuthContext] Error creating client profile:', profileError);
            }
          }

          if (isMounted) {
            // Only set user and role if we found a valid role
            if (foundRole) {
              setUser(firebaseUser);
              setUserRole(foundRole);
            }
            setRoleChecked(true);
            setLoading(false);
          }
        } catch (error) {
          console.error('Error checking user role:', error);
          if (isMounted) {
            setUser(null);
            setUserRole(null);
            setRoleChecked(true);
            setLoading(false);
          }
        }
      } else {
        if (isMounted) {
          setUser(null);
          setUserRole(null);
          setRoleChecked(true);
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Logout function
  const logout = async () => {
    try {
      await signOut();
      setUser(null);
      setUserRole(null);
      setRoleChecked(false);
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  const value = {
    user,
    userRole,
    loading: loading || !roleChecked, // Consider loading until role is checked
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);
