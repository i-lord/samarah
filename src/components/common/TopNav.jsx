import React from 'react';
import Logo from './Logo';

const TopNav = ({ children }) => {
  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-pink-50 border-b border-pink-100 shadow-sm z-50">
      <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
        <Logo className="text-pink-700" />
        {children}
      </div>
    </div>
  );
};

export default TopNav; 