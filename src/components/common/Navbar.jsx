import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaHome, FaUser, FaBus, FaChartBar, FaClipboardList } from 'react-icons/fa';

function getProfileIcon(user) {
  const [imgError, setImgError] = useState(false);
  if (user?.photoURL && !imgError) {
    return (
      <img
        src={user.photoURL}
        alt="Profile"
        className="w-6 h-6 rounded-full object-cover"
        onError={() => setImgError(true)}
      />
    );
  } else if (user?.displayName || user?.email) {
    const letter = (user.displayName || user.email)[0].toUpperCase();
    return (
      <span className="w-6 h-6 rounded-full bg-pink-200 text-pink-700 flex items-center justify-center font-bold text-base">
        {letter}
      </span>
    );
  } else {
    return <FaUser />;
  }
}

// Mobile/Tablet bottom navigation bar only
const Navbar = () => {
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
        icon: getProfileIcon(user),
      },
    ];
  } else if (userRole === 'driver') {
    navItems = [
      { label: 'Home', to: '/driver/home', icon: <FaHome /> },
      { label: 'Assignment', to: '/driver/assignment', icon: <FaBus /> },
      {
        label: 'Profile',
        to: '/driver/profile',
        icon: getProfileIcon(user),
      },
    ];
  } else if (userRole === 'owner') {
    navItems = [
      { label: 'Dashboard', to: '/owner/home', icon: <FaChartBar /> },
      { label: 'Buses', to: '/owner/buses', icon: <FaBus /> },
      {
        label: 'Profile',
        to: '/owner/profile',
        icon: getProfileIcon(user),
      },
    ];
  }

  if (!userRole || !navItems.length) return null;

  return (
    // Only show on mobile/tablet
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t shadow-lg z-40 flex md:hidden">
      <ul className="flex h-full justify-around items-center w-full">
        {navItems.map(({ label, to, icon }) => {
          const isActive = location.pathname === to;
          return (
            <li key={to} className="flex-1 h-full">
              <Link
                to={to}
                className={`flex flex-col items-center justify-center h-full px-2 ${
                  isActive ? 'text-pink-600' : 'text-gray-500'
                } hover:text-pink-600 transition-colors`}
              >
                <span className="text-xl flex items-center justify-center">{icon}</span>
                <span className="text-xs mt-0.5">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Navbar;