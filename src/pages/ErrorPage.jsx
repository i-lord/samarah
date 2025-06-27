import React from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/common/Logo';
import { FaExclamationTriangle } from 'react-icons/fa';

const ErrorPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-rose-100 via-pink-200 to-pink-300 text-gray-800">
      <div className="mb-8">
        <Logo />
      </div>
      <div className="flex flex-col items-center bg-white/80 rounded-xl shadow-xl p-8">
        <FaExclamationTriangle className="text-5xl text-pink-600 mb-4" />
        <h1 className="text-3xl font-bold mb-2 text-pink-700">Oops! Something went wrong.</h1>
        <p className="mb-6 text-gray-700 text-center max-w-xs">
          The page you are looking for doesn't exist or an unexpected error has occurred.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-lg shadow transition"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
};

export default ErrorPage; 