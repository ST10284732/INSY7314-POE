import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import API_CONFIG from "../config/apiConfig.js";
import '../styles/modern-banking.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    accountNumber: "",
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showMFA, setShowMFA] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaUsername, setMfaUsername] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear message when user starts typing
    if (message) {
      setMessage("");
      setMessageType("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const res = await fetch(API_CONFIG.getURL("/user/login"), {
        method: "POST",
        headers: API_CONFIG.getHeaders(),
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        console.log('Login response:', data); // Debug log
        if (data.token) {
          setMessage("Login successful! Redirecting...");
          setMessageType("success");
          login(data.token);
          
          // Redirect based on user role
          const userRole = data.user?.role || 'Customer';
          setTimeout(() => {
            if (userRole === 'Admin') {
              navigate('/admin/dashboard');
            } else if (userRole === 'Employee') {
              navigate('/employee/dashboard');
            } else {
              navigate('/dashboard'); // Customer dashboard
            }
          }, 1500);
        } else if (data.requiresMFA) {
          setMessage("Enter the 6-digit code from your authenticator app");
          setMessageType("info");
          setShowMFA(true);
          setMfaUsername(data.username);
        } else {
          setMessage("Login response missing token");
          setMessageType("error");
        }
      } else {
        setMessage(data.message || "Invalid credentials. Please try again.");
        setMessageType("error");
      }
    } catch (err) {
      setMessage("Unable to connect to server. Please check your connection.");
      setMessageType("error");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMFASubmit = async (e) => {
    e.preventDefault();
    
    if (mfaCode.length !== 6) {
      setMessage("Please enter a 6-digit code");
      setMessageType("error");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(API_CONFIG.getURL("/mfa/login"), {
        method: "POST",
        headers: API_CONFIG.getHeaders(),
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          accountNumber: formData.accountNumber,
          token: mfaCode
        }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        setMessage("MFA verification successful! Redirecting...");
        setMessageType("success");
        login(data.token);
        
        // Redirect based on user role
        const userRole = data.user?.role || 'Customer';
        setTimeout(() => {
          if (userRole === 'Admin') {
            navigate('/admin/dashboard');
          } else if (userRole === 'Employee') {
            navigate('/employee/dashboard');
          } else {
            navigate('/dashboard'); // Customer dashboard
          }
        }, 1500);
      } else {
        setMessage(data.message || "Invalid MFA code. Please try again.");
        setMessageType("error");
      }
    } catch (err) {
      setMessage("Unable to connect to server. Please check your connection.");
      setMessageType("error");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="card" style={{ maxWidth: '450px', width: '100%' }}>
        <div className="card-header text-center">
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <Link to="/" className="btn-link" style={{ textDecoration: 'none', fontSize: '14px' }}>
              <i className="fas fa-arrow-left"></i> Back to Home
            </Link>
          </div>
          <h2 style={{ margin: 0, color: 'var(--primary-blue)' }}>
            Secure Banking
          </h2>
          <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: 'var(--gray-600)' }}>
            Welcome back! Please sign in to your account
          </p>
        </div>

        <div className="card-body">
          {message && (
            <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`}>
              {message}
            </div>
          )}

          {!showMFA ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="username">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                className="form-input"
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleChange}
                required
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="accountNumber">
                Account Number
              </label>
              <input
                type="text"
                id="accountNumber"
                name="accountNumber"
                className="form-input"
                placeholder="Enter your account number"
                value={formData.accountNumber}
                onChange={handleChange}
                required
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  className="form-input"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: '50px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '16px',
                    color: 'var(--gray-500)'
                  }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--gray-600)' }}>
                  <input type="checkbox" /> Remember me
                </label>
                <button type="button" className="btn-link" style={{ fontSize: '14px' }}>
                  Forgot password?
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Signing In...
                </>
              ) : (
                "Sign In Securely"
              )}
            </button>
          </form>
          ) : (
          <form onSubmit={handleMFASubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="mfaCode">
                Authenticator Code
              </label>
              <input
                type="text"
                id="mfaCode"
                className="form-input"
                placeholder="Enter 6-digit code"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength="6"
                required
                autoComplete="one-time-code"
                style={{ textAlign: 'center', fontSize: '18px', letterSpacing: '3px' }}
              />
              <small style={{ color: 'var(--gray-600)', fontSize: '12px' }}>
                Open your authenticator app and enter the 6-digit code
              </small>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || mfaCode.length !== 6}
              style={{ width: '100%' }}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Verifying...
                </>
              ) : (
                "Verify MFA Code"
              )}
            </button>
          </form>
          )}
        </div>

        <div className="card-footer text-center">
          <p style={{ margin: 0, color: 'var(--gray-600)' }}>
            Don't have an account?{' '}
            <Link to="/register" className="btn-link" style={{ textDecoration: 'none' }}>
              Create Account
            </Link>
          </p>
          
          <div style={{ 
            marginTop: 'var(--space-4)', 
            padding: 'var(--space-3)', 
            background: 'var(--bg-accent)', 
            borderRadius: 'var(--radius-md)',
            fontSize: '12px',
            color: 'var(--gray-600)'
          }}>
            Your connection is secured with 256-bit SSL encryption
          </div>
        </div>
      </div>
    </div>
  );
}

