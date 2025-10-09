import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import CreatePayment from './pages/CreatePayment.jsx';
import PaymentsList from './pages/PaymentsList.jsx';
import MFASetup from './pages/MFASetup.jsx';
import Settings from './pages/Settings.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import './styles/modern-banking.css';

function App() {
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

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-payment"
          element={
            <ProtectedRoute>
              <CreatePayment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <PaymentsList />
            </ProtectedRoute>
          }
        />
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
    </Router>
  );
}

export default App;
