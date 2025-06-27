import { useState, useEffect } from "react";
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { auth, db } from "../../firebase/clientConfig";
import { useNavigate } from "react-router-dom";
import { FaSpinner } from "react-icons/fa";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";

export default function ClientAuth() {
  const [isRegistering, setIsRegistering] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const provider = new GoogleAuthProvider();

  // Always use redirect for Google sign-in
  const handleGoogleAuth = async () => {
    setAuthError(null);
    setIsLoading(true);
    try {
      await signInWithRedirect(auth, provider);
    } catch (error) {
      setAuthError('Failed to sign in with Google. Please try again.');
      setIsLoading(false);
    }
  };

  // After redirect, check if profile exists, if not, create it
  useEffect(() => {
    const checkAndCreateProfile = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          const user = result.user;
          const clientRef = doc(db, 'clients', user.uid);
          const clientSnap = await getDoc(clientRef);
          if (!clientSnap.exists()) {
            await setDoc(clientRef, {
              displayName: user.displayName || '',
              email: user.email,
              photoURL: user.photoURL || '',
              phone: user.phoneNumber || '',
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
        }
      } catch (error) {
        setAuthError('Failed to complete sign in. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    checkAndCreateProfile();
  }, []);

  // Navigate based on auth state
  useEffect(() => {
    if (!authLoading && user && userRole === 'client') {
      navigate('/client/home');
    }
  }, [user, userRole, authLoading, navigate]);

  // If already authenticated as client, show only spinner
  if (!authError && (authLoading || (user && userRole === 'client'))) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-500 to-pink-700">
        <div className="flex items-center gap-2 text-white text-xl">
          <FaSpinner className="animate-spin" />
          Redirecting...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-500 to-pink-700 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
        <h1 className="mb-4 text-center text-2xl font-bold text-gray-800">
          {isRegistering ? "Create an Account" : "Welcome Back"}
        </h1>
        {authError && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {authError}
          </div>
        )}
        <div className="space-y-4">
          <button
            onClick={handleGoogleAuth}
            disabled={isLoading || authLoading}
            className="flex w-full items-center justify-center gap-2 rounded bg-pink-600 py-2 text-white hover:bg-pink-700 disabled:opacity-50"
          >
            {(isLoading || authLoading) ? (
              <>
                <FaSpinner className="animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                {isRegistering ? "Sign Up with Google" : "Sign In with Google"}
              </>
            )}
          </button>
          <button
            className="w-full rounded border border-pink-600 py-2 text-pink-600 hover:bg-pink-50 disabled:opacity-50"
            disabled={isLoading || authLoading}
            // TODO: Add phone number auth logic here later
          >
            {isRegistering ? "Sign Up with Phone Number" : "Sign In with Phone Number"}
          </button>
        </div>
        <p className="mt-6 text-center text-sm text-gray-600">
          {isRegistering ? "Already have an account?" : "Don't have an account?"}
          <button
            className="ml-1 font-semibold text-pink-600 hover:underline disabled:opacity-50"
            onClick={() => setIsRegistering(!isRegistering)}
            disabled={isLoading || authLoading}
          >
            {isRegistering ? "Sign In" : "Register"}
          </button>
        </p>
      </div>
    </div>
  );
}