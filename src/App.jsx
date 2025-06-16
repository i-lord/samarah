import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import ClientAuth from './pages/client/ClientAuth';
import ClientHome from './pages/client/ClientHome';
import DriverAuth from './pages/driver/DriverAuth';
import OwnerAuth from './pages/owner/OwnerAuth';
import DriverHome from './pages/driver/DriverHome';
import OwnerHome from './pages/owner/OwnerHome';
import { ProtectedRoute } from './routes/AppRouter';
import AccountLayout from './components/layouts/AccountLayout';
import ClientProfile from './pages/client/ClientProfile';
import ClientBooking from './pages/client/ClientBooking';
import DriverProfile from './pages/driver/DriverProfile';
import DriverAssignment from './pages/driver/DriverAssignment';
import OwnerProfile from './pages/owner/OwnerProfile';

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
            <AccountLayout>
              <Routes>
                <Route path="home" element={<ClientHome />} />
                <Route path="profile" element={<ClientProfile />} />
                <Route path="bookings" element={<ClientBooking />} />
              </Routes>
            </AccountLayout>
          </ProtectedRoute>
        }
      />

      {/* Driver Routes */}
      <Route path="/driver/auth" element={<DriverAuth />} />
      <Route
        path="/driver/*"
        element={
          <ProtectedRoute role="driver">
            <AccountLayout>
              <Routes>
                <Route path="home" element={<DriverHome />} />
                <Route path="profile" element={<DriverProfile />} />
                <Route path="assignment" element={<DriverAssignment />} />
              </Routes>
            </AccountLayout>
          </ProtectedRoute>
        }
      />

      {/* Owner Routes */}
      <Route path="/owner/auth" element={<OwnerAuth />} />
      <Route
        path="/owner/*"
        element={
          <ProtectedRoute role="owner">
            <AccountLayout>
              <Routes>
                <Route path="home" element={<OwnerHome />} />
                <Route path="profile" element={<OwnerProfile />} />
              </Routes>
            </AccountLayout>
          </ProtectedRoute>
        }
      />

      {/* Fallback Route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;