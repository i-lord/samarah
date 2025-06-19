import React from 'react';
import Logo from './Logo';

const TopNav = ({ navLinks, profile }) => {
  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-pink-50 border-b border-pink-100 shadow-sm z-50">
      <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
        {/* Logo on the left */}
        <div className="flex-shrink-0">
          <Logo className="text-pink-700" />
        </div>
        {/* Centered nav links (desktop only) */}
        <div className="hidden md:flex flex-1 justify-center gap-8">
          {navLinks}
        </div>
        {/* Profile icon at far right (desktop only) */}
        <div className="hidden md:flex items-center ml-8">
          {profile}
        </div>
      </div>
    </div>
  );
};

export default TopNav; 