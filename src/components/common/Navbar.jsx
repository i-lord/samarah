import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaHome, FaUser, FaBus, FaChartBar, FaClipboardList } from 'react-icons/fa';

// A bottom navigation bar that adapts links based on user role
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

  if (!userRole || !navItems.length) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t shadow-lg z-40">
      <ul className="flex h-full justify-around items-center">
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
}

export default Navbar;