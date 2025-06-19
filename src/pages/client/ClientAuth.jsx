import { useState, useEffect } from "react";
import { signInWithPopup, GoogleAuthProvider, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { auth, db } from "../../firebase/clientConfig";
import { useNavigate } from "react-router-dom";
import { FaSpinner } from "react-icons/fa";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";

export default function ClientAuth() {
  const [isRegistering, setIsRegistering] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, userRole, loading: authLoading } = useAuth();
  const [authError, setAuthError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const provider = new GoogleAuthProvider();
  const signInWithGoogle = () => signInWithPopup(auth, provider);
  const signInWithGoogleRedirect = () => signInWithRedirect(auth, provider);

  const createClientProfile = async (user) => {
    try {
      const clientRef = doc(db, 'clients', user.uid);
      const clientSnap = await getDoc(clientRef);

      if (!clientSnap.exists()) {
        // Create new client profile if it doesn't exist
        await setDoc(clientRef, {
          displayName: user.displayName || '',
          email: user.email,
          photoURL: user.photoURL || '',
          phone: user.phoneNumber || '',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      // Force a role check after creating/verifying the profile
      await checkRole();
      return true;
    } catch (error) {
      console.error('Error creating client profile:', error);
      throw error;
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setAuthError(null);
    
    try {
      // Attempt popup sign-in first
      const result = await signInWithGoogle();
      
      // If we get here, the sign-in was successful
      // The AuthContext will handle role checking and state updates
      // No need to manually check role or navigate here
    } catch (error) {
      console.error('Google auth error:', error);
      setAuthError('Failed to sign in with Google. Please try again.');
      
      // If popup fails, try redirect
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
        try {
          await signInWithGoogleRedirect();
        } catch (redirectError) {
          console.error('Google redirect auth error:', redirectError);
          setAuthError('Failed to sign in with Google. Please try again.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle redirect result when the page loads
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          // Redirect sign-in was successful
          // AuthContext will handle role checking and state updates
        }
      } catch (error) {
        console.error('Redirect result error:', error);
        setAuthError('Failed to complete sign in. Please try again.');
      }
    };

    checkRedirectResult();
  }, []);

  // Navigate based on auth state
  useEffect(() => {
    if (!authLoading) {
      if (user && userRole === 'client') {
        navigate('/client/home');
      } else if (user && userRole !== 'client') {
        // User is authenticated but not a client
        navigate('/');
      }
    }
  }, [user, userRole, authLoading, navigate]);

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
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded bg-pink-600 py-2 text-white hover:bg-pink-700 disabled:opacity-50"
          >
            {isLoading ? (
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
            disabled={isLoading}
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
            disabled={isLoading}
          >
            {isRegistering ? "Sign In" : "Register"}
          </button>
        </p>
      </div>
    </div>
  );
}