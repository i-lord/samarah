import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../firebase/clientConfig';
import { GoogleAuthProvider, signInWithPopup, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { FaSpinner, FaPhone } from 'react-icons/fa';

export default function ClientAuth() {
  const { user, userRole, loading } = useAuth();
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [comingSoon, setComingSoon] = useState(false);
  const [isRegistering, setIsRegistering] = useState(true); // true = sign up, false = sign in
  const navigate = useNavigate();
  const provider = new GoogleAuthProvider();

  const handleGoogleAuth = async () => {
    setError('');
    setProcessing(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error('Popup sign-in error:', e);
      if (e.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup closed before completing authentication.');
      } else if (e.code === 'auth/cancelled-popup-request') {
        setError('Popup request was cancelled. Try again.');
      } else if (e.code === 'auth/network-request-failed') {
        setError('Network error. Check your connection.');
      } else {
        setError('Failed to sign in with Google.');
      }
    } finally {
      setProcessing(false);
    }
  };

  const handlePhoneAuth = () => {
    setComingSoon(true);
    setTimeout(() => setComingSoon(false), 2000);
  };

  useEffect(() => {
    if (!loading && user && userRole === 'client') {
      navigate('/client/home');
    } else if (!loading && user) {
      setError('Access denied for role: ' + userRole);
    }
  }, [user, userRole, loading, navigate]);

  if (loading || processing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-500 to-pink-700">
        <div className="flex items-center gap-2 text-white text-xl">
          <FaSpinner className="animate-spin" /> {processing ? 'Signing in...' : 'Loading...'}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-500 to-pink-700 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-3xl font-bold text-gray-800">
          {isRegistering ? 'Create an Account' : 'Welcome Back'}
        </h1>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        <button
          onClick={handleGoogleAuth}
          className="w-full rounded-lg bg-pink-600 py-3 text-lg font-semibold text-white hover:bg-pink-700 disabled:opacity-50 mb-4 transition-colors"
          disabled={processing}
        >
          {isRegistering ? 'Sign Up with Google' : 'Sign In with Google'}
        </button>
        <button
          onClick={handlePhoneAuth}
          className="w-full rounded-lg border-2 border-pink-500 py-3 text-lg font-semibold text-pink-600 bg-white hover:bg-pink-50 disabled:opacity-50 mb-2 transition-colors flex items-center justify-center gap-2"
          disabled={processing}
        >
          <FaPhone /> {isRegistering ? 'Sign Up with Phone Number' : 'Sign In with Phone Number'}
        </button>
        {comingSoon && (
          <div className="text-center text-pink-600 text-sm mb-2">Coming soon!</div>
        )}
        <div className="mt-4 text-center text-gray-700">
          {isRegistering ? (
            <>
              Already have an account?{' '}
              <button
                className="text-pink-600 font-semibold hover:underline"
                onClick={() => { setIsRegistering(false); setError(''); }}
                type="button"
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <button
                className="text-pink-600 font-semibold hover:underline"
                onClick={() => { setIsRegistering(true); setError(''); }}
                type="button"
              >
                Register
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
