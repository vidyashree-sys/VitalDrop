import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';

// Import all Pages
import Auth from './pages/Auth';
import HospitalDashboard from './pages/HospitalDashboard';
import BloodBankDashboard from './pages/BloodBankDashboard';
import DriverDashboard from './pages/DriverDashboard'; 
import AdminDashboard from './pages/AdminDashboard';
import DonorDashboard from './pages/DonorDashboard'; 
import PublicPortal from './pages/PublicPortal';

// --- PROTECTED ROUTE COMPONENT ---
const ProtectedRoute = ({ children, allowedRole }) => {
  const { token, user } = useContext(AuthContext);

  if (!token) return <Navigate to="/login" replace />;

  // Wait for user data to load
  if (!user) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a', color: '#3b82f6', fontWeight: '900', fontSize: '18px', letterSpacing: '2px' }}>
        INITIALIZING SECURE CONNECTION...
      </div>
    );
  }

  // Role verification
  if (user.role !== allowedRole) {
    switch (user.role) {
      case 'hospital': return <Navigate to="/hospital-dashboard" replace />;
      case 'blood_bank': return <Navigate to="/bank-dashboard" replace />;
      case 'driver': return <Navigate to="/driver-dashboard" replace />;
      case 'admin': return <Navigate to="/admin-dashboard" replace />;
      case 'donor': return <Navigate to="/donor-dashboard" replace />;
      default: return <Navigate to="/" replace />;
    }
  }

  return children;
};

// --- APP ROUTES COMPONENT ---
const AppRoutes = () => {
  const { token, user } = useContext(AuthContext);

  // Helper to find the right dashboard
  const getDashboard = (role) => {
    switch (role) {
      case 'hospital': return '/hospital-dashboard';
      case 'blood_bank': return '/bank-dashboard';
      case 'driver': return '/driver-dashboard';
      case 'admin': return '/admin-dashboard';
      case 'donor': return '/donor-dashboard';
      default: return '/';
    }
  };

  return (
    <Routes>
      {/* PUBLIC PORTAL */}
      <Route path="/" element={<PublicPortal />} />
      
      {/* AUTHENTICATION ROUTES (Catches both /login and /register) */}
      <Route path="/login" element={token && user ? <Navigate to={getDashboard(user.role)} replace /> : <Auth />} />
      <Route path="/register" element={token && user ? <Navigate to={getDashboard(user.role)} replace /> : <Auth />} />

      {/* SECURE ROUTES */}
      <Route path="/hospital-dashboard" element={<ProtectedRoute allowedRole="hospital"><HospitalDashboard /></ProtectedRoute>} />
      <Route path="/bank-dashboard" element={<ProtectedRoute allowedRole="blood_bank"><BloodBankDashboard /></ProtectedRoute>} />
      <Route path="/driver-dashboard" element={<ProtectedRoute allowedRole="driver"><DriverDashboard /></ProtectedRoute>} />
      <Route path="/admin-dashboard" element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/donor-dashboard" element={<ProtectedRoute allowedRole="donor"><DonorDashboard /></ProtectedRoute>} />

      {/* CATCH-ALL REDIRECT */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// --- MAIN APP COMPONENT ---
function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;