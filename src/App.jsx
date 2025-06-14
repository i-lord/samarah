import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import ClientAuth from './pages/client/ClientAuth';
import ClientHome from './pages/client/ClientHome';
import DriverAuth from './pages/driver/DriverAuth';
import OwnerAuth from './pages/owner/OwnerAuth';
import DriverHome from './pages/driver/DriverHome';
import OwnerHome from './pages/owner/OwnerHome';
import { ProtectedRoute } from './routes/AppRouter';
import Navbar from './components/common/Navbar';
import ClientProfile from './pages/client/ClientProfile';
import ClientBooking from './pages/client/ClientBooking';
import DriverProfile from './pages/driver/DriverProfile';
import DriverAssignment from './pages/driver/DriverAssignment';

// Layout component that includes Navbar for authenticated users
const AuthenticatedLayout = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  
  // Don't show navbar on auth pages
  const isAuthPage = location.pathname.includes('/auth');
  
  return (
    <div className="relative min-h-screen">
      <main className="pb-16"> {/* pb-16 matches navbar height */}
        {children}
      </main>
      {user && !isAuthPage && <Navbar />}
    </div>
  );
};

const App = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />

      {/* Client Routes */}
      <Route path="/client/auth" element={<ClientAuth />} />
      <Route
        path="/client/*"
        element={
          <ProtectedRoute role="client">
            <AuthenticatedLayout>
              <Routes>
                <Route path="home" element={<ClientHome />} />
                <Route path="profile" element={<ClientProfile />} />
                <Route path='bookings' element={<ClientBooking />} />
                {/* Add other client routes here */}
              </Routes>
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />

      {/* Driver Routes */}
      <Route path="/driver/auth" element={<DriverAuth />} />
      <Route
        path="/driver/*"
        element={
          <ProtectedRoute role="driver">
            <AuthenticatedLayout>
              <Routes>
                <Route path="home" element={<DriverHome />} />
                <Route path='profile' element={<DriverProfile />} />
                <Route path='assignment' element={<DriverAssignment />} />
                {/* Add other driver routes here */}
              </Routes>
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />

      {/* Owner Routes */}
      <Route path="/owner/auth" element={<OwnerAuth />} />
      <Route
        path="/owner/*"
        element={
          <ProtectedRoute role="owner">
            <AuthenticatedLayout>
              <Routes>
                <Route path="home" element={<OwnerHome />} />
                {/* Add other owner routes here */}
              </Routes>
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />

      {/* Fallback Route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;