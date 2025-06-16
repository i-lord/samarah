import React from 'react';
import TopNav from '../common/TopNav';
import Navbar from '../common/Navbar';

const AccountLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-pink-50 pt-16 pb-16">
      <TopNav />
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
      <Navbar />
    </div>
  );
};

export default AccountLayout; 