import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBusAlt } from 'react-icons/fa';

const Logo = ({ className = '' }) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/')}
      className={`flex items-center gap-2 font-black tracking-tight hover:opacity-90 transition-opacity ${className}`}
    >
      <FaBusAlt className="text-2xl" />
      <span className="text-xl bg-clip-text text-transparent bg-gradient-to-r from-pink-600 via-fuchsia-600 to-pink-700">
        Samarah
      </span>
    </button>
  );
};

export default Logo;