import { useState, useEffect } from "react";
import { signInWithPopup, GoogleAuthProvider, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { auth, db } from "../../firebase/clientConfig";
import { useNavigate } from "react-router-dom";
import { FaSpinner } from "react-icons/fa";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";

const ClientAuth = () => {
  const [isRegistering, setIsRegistering] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, userRole, roleChecked, checkRole } = useAuth();

  // Watch for role changes and navigate when client role is confirmed
  useEffect(() => {
    const checkAndNavigate = async () => {
      if (user && !userRole && roleChecked) {
        // If we have a user but no role and role check is complete,
        // force a role check
        const role = await checkRole();
        if (role === 'client') {
          navigate("/client/home");
        }
      } else if (userRole === 'client') {
        navigate("/client/home");
      }
    };

    checkAndNavigate();
  }, [user, userRole, roleChecked, checkRole, navigate]);

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
    setLoading(true);
    setError("");
    const provider = new GoogleAuthProvider();
    
    try {
      // First try popup
      try {
        const result = await signInWithPopup(auth, provider);
        await createClientProfile(result.user);
        // Navigation will be handled by the useEffect watching userRole
      } catch (popupError) {
        // If popup fails (e.g., due to COOP), fall back to redirect
        console.log("Popup failed, falling back to redirect:", popupError);
        await signInWithRedirect(auth, provider);
        // The redirect will happen here, and the result will be handled when the page reloads
      }
    } catch (err) {
      console.error("Authentication error:", err);
      if (err.code === 'auth/popup-blocked') {
        setError("Please allow popups for this website to sign in with Google.");
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError("Sign-in was cancelled. Please try again.");
      } else if (err.code === 'auth/cancelled-popup-request') {
        // This is normal when falling back to redirect
        return;
      } else {
        setError("Authentication failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle redirect result when the page loads
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          // User successfully signed in via redirect
          await createClientProfile(result.user);
          // Navigation will be handled by the useEffect watching userRole
        }
      } catch (err) {
        console.error("Redirect sign-in error:", err);
        setError("Authentication failed. Please try again.");
      }
    };

    handleRedirectResult();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-500 to-pink-700 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
        <h1 className="mb-4 text-center text-2xl font-bold text-gray-800">
          {isRegistering ? "Create an Account" : "Welcome Back"}
        </h1>
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded bg-pink-600 py-2 text-white hover:bg-pink-700 disabled:opacity-50"
          >
            {loading ? (
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
            disabled={loading}
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
            disabled={loading}
          >
            {isRegistering ? "Sign In" : "Register"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default ClientAuth;