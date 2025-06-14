import { useState } from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../../firebase/clientConfig";
import { useNavigate } from "react-router-dom";

const ClientAuth = () => {
  const [isRegistering, setIsRegistering] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleGoogleAuth = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      // TODO: Add logic for handling user profile in Firestore
      navigate("/client/home");
    } catch (err) {
      console.error(err);
      setError("Google authentication failed.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-500 to-pink-700 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
        <h1 className="mb-4 text-center text-2xl font-bold text-gray-800">
          {isRegistering ? "Create an Account" : "Welcome Back"}
        </h1>
        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

        <div className="space-y-4">
          <button
            onClick={handleGoogleAuth}
            className="w-full rounded bg-pink-600 py-2 text-white hover:bg-pink-700"
          >
            {isRegistering ? "Sign Up with Google" : "Sign In with Google"}
          </button>

          <button
            className="w-full rounded border border-pink-600 py-2 text-pink-600 hover:bg-pink-50"
            // TODO: Add phone number auth logic here later
          >
            {isRegistering ? "Sign Up with Phone Number" : "Sign In with Phone Number"}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          {isRegistering ? "Already have an account?" : "Don’t have an account?"}
          <button
            className="ml-1 font-semibold text-pink-600 hover:underline"
            onClick={() => setIsRegistering(!isRegistering)}
          >
            {isRegistering ? "Sign In" : "Register"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default ClientAuth