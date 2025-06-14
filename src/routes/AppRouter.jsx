import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LandingPage from '../pages/LandingPage';
import ClientAuth from '../pages/client/ClientAuth';
import ClientHome from '../pages/client/ClientHome';
import DriverHome from '../pages/driver/DriverHome';
import DriverAuth from '../pages/driver/DriverAuth';
import OwnerAuth from '../pages/owner/OwnerAuth';
import OwnerHome from '../pages/owner/OwnerHome';
// …import other pages…

export function ProtectedRoute({ children, role }) {
  const { user, userRole } = useAuth();
  
  if (!user) {
    return <Navigate to={`/${role}/auth`} />;
  }
  
  if (userRole !== role) {
    return <Navigate to="/" />;
  }
  
  return children;
}

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route path="/client/auth" element={<ClientAuth />} />
         <Route path="/driver/auth" element={<DriverAuth />} />
        <Route path="/owner/auth" element={<OwnerAuth />} />

        <Route
          path="/client/*"
          element={
            <ProtectedRoute role="client">
              <ClientHome />
            </ProtectedRoute>
          }
        />
         <Route
          path="/driver/*"
          element={
            <ProtectedRoute role="driver">
              <DriverHome />
            </ProtectedRoute>
          }
        />
         <Route
          path="/owner/*"
          element={
            <ProtectedRoute role="owner">
              <OwnerHome />
            </ProtectedRoute>
          }
        />
      </Routes>
      </BrowserRouter>
  );
}

export default AppRouter