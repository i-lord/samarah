import React from 'react';
import TopNav from '../common/TopNav';
import Navbar from '../common/Navbar';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaUser, FaBus, FaChartBar, FaClipboardList } from 'react-icons/fa';

const AccountLayout = ({ children }) => {
  const { userRole, user } = useAuth();
  const location = useLocation();

  // Define nav items per role
  let navItems = [];
  if (userRole === 'client') {
    navItems = [
      { label: 'Home', to: '/client/home', icon: <FaHome /> },
      { label: 'Bookings', to: '/client/bookings', icon: <FaClipboardList /> },
      { 
        label: 'Profile', 
        to: '/client/profile', 
        icon: user?.photoURL ? (
          <img 
            src={user.photoURL} 
            alt="Profile" 
            className="w-6 h-6 rounded-full object-cover"
          />
        ) : <FaUser />
      },
    ];
  } else if (userRole === 'driver') {
    navItems = [
      { label: 'Home', to: '/driver/home', icon: <FaHome /> },
      { label: 'Assignment', to: '/driver/assignment', icon: <FaBus /> },
      { 
        label: 'Profile', 
        to: '/driver/profile', 
        icon: user?.photoURL ? (
          <img 
            src={user.photoURL} 
            alt="Profile" 
            className="w-6 h-6 rounded-full object-cover"
          />
        ) : <FaUser />
      },
    ];
  } else if (userRole === 'owner') {
    navItems = [
      { label: 'Dashboard', to: '/owner/home', icon: <FaChartBar /> },
      { label: 'Buses', to: '/owner/buses', icon: <FaBus /> },
      { 
        label: 'Profile', 
        to: '/owner/profile', 
        icon: user?.photoURL ? (
          <img 
            src={user.photoURL} 
            alt="Profile" 
            className="w-6 h-6 rounded-full object-cover"
          />
        ) : <FaUser />
      },
    ];
  }

  // Split nav items: all except profile, and profile
  const mainNavItems = navItems.slice(0, navItems.length - 1);
  const profileNavItem = navItems[navItems.length - 1];

  // Render nav links for TopNav (desktop)
  const navLinks = mainNavItems.map(({ label, to, icon }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        key={to}
        to={to}
        className={`flex flex-col items-center px-2 ${
          isActive ? 'text-pink-600' : 'text-gray-500'
        } hover:text-pink-600 transition-colors`}
      >
        <span className="text-xl flex items-center justify-center">{icon}</span>
        <span className="text-xs mt-0.5">{label}</span>
      </Link>
    );
  });

  // Render profile for TopNav (desktop)
  const profile = profileNavItem ? (
    <Link
      to={profileNavItem.to}
      className={`flex flex-col items-center px-2 ${
        location.pathname === profileNavItem.to ? 'text-pink-600' : 'text-gray-500'
      } hover:text-pink-600 transition-colors`}
    >
      <span className="text-xl flex items-center justify-center">{profileNavItem.icon}</span>
      <span className="text-xs mt-0.5">{profileNavItem.label}</span>
    </Link>
  ) : null;

  return (
    <div className="min-h-screen bg-pink-50 pt-16 pb-16">
      <TopNav navLinks={navLinks} profile={profile} />
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
      <Navbar />
    </div>
  );
};

export default AccountLayout; 