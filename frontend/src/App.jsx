import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/EnhancedDashboard.jsx';
import Transactions from './pages/Transactions.jsx';
import Beneficiaries from './pages/Beneficiaries.jsx';
import EmployeeDashboard from './pages/EmployeeDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import CreatePayment from './pages/CreatePayment.jsx';
import PaymentsList from './pages/PaymentsList.jsx';
import PendingPayments from './pages/PendingPayments.jsx';
import PaymentHistory from './pages/PaymentHistory.jsx';
import ManageEmployees from './pages/ManageEmployees.jsx';
import CreateStaff from './pages/CreateStaff.jsx';
import MFASetup from './pages/MFASetup.jsx';
import Settings from './pages/Settings.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import RoleProtectedRoute from './components/RoleProtectedRoute.jsx';
import SessionIndicator from './components/SessionIndicator.jsx';
import { useAutoLogout } from './hooks/useAutoLogout.js';
import './styles/modern-banking.css';

function App() {
  // Get auto-logout setting from localStorage
  const [autoLogoutEnabled, setAutoLogoutEnabled] = useState(() => {
    const savedSettings = localStorage.getItem('bankSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      return settings.autoLogout !== false; // Default to true
    }
    return true; // Default enabled
  });

  // Initialize auto-logout functionality
  const { getTimeRemaining } = useAutoLogout(autoLogoutEnabled, 15);

  // Listen for changes in localStorage to update auto-logout setting
  useEffect(() => {
    const handleStorageChange = () => {
      const savedSettings = localStorage.getItem('bankSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setAutoLogoutEnabled(settings.autoLogout !== false);
      }
    };

    // Listen for storage changes
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for manual updates within the same tab
    const interval = setInterval(() => {
      const savedSettings = localStorage.getItem('bankSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        const newEnabled = settings.autoLogout !== false;
        if (newEnabled !== autoLogoutEnabled) {
          setAutoLogoutEnabled(newEnabled);
        }
      }
    }, 1000); // Check every second

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [autoLogoutEnabled]);

  // Apply saved dark mode preference on app startup
  useEffect(() => {
    // Check separate theme preference first (persists across logouts)
    const savedTheme = localStorage.getItem('bankTheme');
    if (savedTheme !== null) {
      const isDarkMode = JSON.parse(savedTheme);
      if (isDarkMode) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
    } else {
      // Fallback to general settings
      const savedSettings = localStorage.getItem('bankSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (settings.darkMode) {
          document.body.classList.add('dark-mode');
        } else {
          document.body.classList.remove('dark-mode');
        }
      }
    }
  }, []);
  return (
    <Router 
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Customer routes */}
        <Route
          path="/dashboard"
          element={
            <RoleProtectedRoute allowedRoles="Customer">
              <Dashboard />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/create-payment"
          element={
            <RoleProtectedRoute allowedRoles="Customer">
              <CreatePayment />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <RoleProtectedRoute allowedRoles="Customer">
              <PaymentsList />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <RoleProtectedRoute allowedRoles="Customer">
              <Transactions />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/beneficiaries"
          element={
            <RoleProtectedRoute allowedRoles="Customer">
              <Beneficiaries />
            </RoleProtectedRoute>
          }
        />
        
        {/* Employee routes */}
        <Route
          path="/employee/dashboard"
          element={
            <RoleProtectedRoute allowedRoles="Employee">
              <EmployeeDashboard />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/employee/pending"
          element={
            <RoleProtectedRoute allowedRoles="Employee">
              <PendingPayments />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/employee/history"
          element={
            <RoleProtectedRoute allowedRoles="Employee">
              <PaymentHistory />
            </RoleProtectedRoute>
          }
        />
        
        {/* Admin routes */}
        <Route
          path="/admin/dashboard"
          element={
            <RoleProtectedRoute allowedRoles="Admin">
              <AdminDashboard />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/employees"
          element={
            <RoleProtectedRoute allowedRoles="Admin">
              <ManageEmployees />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/create-staff"
          element={
            <RoleProtectedRoute allowedRoles="Admin">
              <CreateStaff />
            </RoleProtectedRoute>
          }
        />
        
        {/* Shared protected routes */}
        <Route
          path="/mfa-setup"
          element={
            <ProtectedRoute>
              <MFASetup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

      </Routes>
      
      {/* Session timeout indicator */}
      <SessionIndicator />
    </Router>
  );
}

export default App;
