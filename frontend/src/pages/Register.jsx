import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/modern-banking.css';

function Register() {
  const navigate = useNavigate();

  // State for form fields
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    idNumber: '',
    accountNumber: '',
    username: '',
    password: ''
  });

  // State for messages and validation
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Validation rules
  const validateField = (name, value) => {
    const errors = { ...validationErrors };
    
    switch (name) {
      case 'firstname':
      case 'lastname':
        if (value.length < 2) {
          errors[name] = 'Must be at least 2 characters';
        } else if (!/^[a-zA-Z\s]+$/.test(value)) {
          errors[name] = 'Only letters and spaces allowed';
        } else {
          delete errors[name];
        }
        break;
      
      case 'idNumber':
        if (!/^\d{13}$/.test(value)) {
          errors[name] = 'Must be exactly 13 digits';
        } else {
          delete errors[name];
        }
        break;
      
      case 'accountNumber':
        if (!/^ACC\d{6,10}$/.test(value)) {
          errors[name] = 'Must start with ACC followed by 6-10 digits';
        } else {
          delete errors[name];
        }
        break;
      
      case 'username':
        if (value.length < 3) {
          errors[name] = 'Must be at least 3 characters';
        } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          errors[name] = 'Only letters, numbers, and underscores allowed';
        } else {
          delete errors[name];
        }
        break;
      
      case 'password':
        if (value.length < 8) {
          errors[name] = 'Must be at least 8 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(value)) {
          errors[name] = 'Must contain uppercase, lowercase, number, and special character';
        } else {
          delete errors[name];
        }
        break;
        
      default:
        break;
    }
    
    setValidationErrors(errors);
  };

  // Handle input change with validation
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    validateField(name, value);
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    Object.keys(formData).forEach(key => {
      validateField(key, formData[key]);
    });
    
    // Check if there are any validation errors
    if (Object.keys(validationErrors).length > 0) {
      setMessage('Please fix all validation errors');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const res = await fetch('http://localhost:3000/v1/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Account created successfully! Redirecting to login...');
        setMessageType('success');
        setTimeout(() => navigate('/login'), 2500);
      } else {
        setMessage(data.message || 'Registration failed. Please try again.');
        setMessageType('error');
      }
    } catch (err) {
      setMessage('Unable to connect to server. Please check your connection.');
      setMessageType('error');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="card" style={{ maxWidth: '500px', width: '100%' }}>
        <div className="card-header text-center">
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <Link to="/" className="btn-link" style={{ textDecoration: 'none', fontSize: '14px' }}>
              <i className="fas fa-arrow-left"></i> Back to Home
            </Link>
          </div>
          <h2 style={{ margin: 0, color: 'var(--primary-blue)' }}>
            Create Your Account
          </h2>
          <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: 'var(--gray-600)' }}>
            Join thousands of satisfied customers
          </p>
        </div>
        
        <div className="card-body">
          {message && (
            <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`}>
              {message}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
              <div className="form-group" style={{ flex: 1, margin: 0 }}>
                <label className="form-label" htmlFor="firstname">First Name</label>
                <input
                  type="text"
                  id="firstname"
                  name="firstname"
                  className={`form-input ${validationErrors.firstname ? 'error' : formData.firstname ? 'success' : ''}`}
                  placeholder="Enter your first name"
                  value={formData.firstname}
                  onChange={handleChange}
                  required
                />
                {validationErrors.firstname && (
                  <div style={{ color: 'var(--secondary-red)', fontSize: '12px', marginTop: '4px' }}>
                    {validationErrors.firstname}
                  </div>
                )}
              </div>
              
              <div className="form-group" style={{ flex: 1, margin: 0 }}>
                <label className="form-label" htmlFor="lastname">Last Name</label>
                <input
                  type="text"
                  id="lastname"
                  name="lastname"
                  className={`form-input ${validationErrors.lastname ? 'error' : formData.lastname ? 'success' : ''}`}
                  placeholder="Enter your last name"
                  value={formData.lastname}
                  onChange={handleChange}
                  required
                />
                {validationErrors.lastname && (
                  <div style={{ color: 'var(--secondary-red)', fontSize: '12px', marginTop: '4px' }}>
                    {validationErrors.lastname}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="idNumber">ID Number</label>
              <input
                type="text"
                id="idNumber"
                name="idNumber"
                className={`form-input ${validationErrors.idNumber ? 'error' : formData.idNumber ? 'success' : ''}`}
                placeholder="Enter your 13-digit ID number"
                value={formData.idNumber}
                onChange={handleChange}
                maxLength="13"
                required
              />
              {validationErrors.idNumber && (
                <div style={{ color: 'var(--secondary-red)', fontSize: '12px', marginTop: '4px' }}>
                  {validationErrors.idNumber}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="accountNumber">Account Number</label>
              <input
                type="text"
                id="accountNumber"
                name="accountNumber"
                className={`form-input ${validationErrors.accountNumber ? 'error' : formData.accountNumber ? 'success' : ''}`}
                placeholder="e.g., ACC123456789"
                value={formData.accountNumber}
                onChange={handleChange}
                required
              />
              {validationErrors.accountNumber && (
                <div style={{ color: 'var(--secondary-red)', fontSize: '12px', marginTop: '4px' }}>
                  {validationErrors.accountNumber}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                className={`form-input ${validationErrors.username ? 'error' : formData.username ? 'success' : ''}`}
                placeholder="Choose a unique username"
                value={formData.username}
                onChange={handleChange}
                required
              />
              {validationErrors.username && (
                <div style={{ color: 'var(--secondary-red)', fontSize: '12px', marginTop: '4px' }}>
                  {validationErrors.username}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                className={`form-input ${validationErrors.password ? 'error' : formData.password ? 'success' : ''}`}
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              {validationErrors.password && (
                <div style={{ color: 'var(--secondary-red)', fontSize: '12px', marginTop: '4px' }}>
                  {validationErrors.password}
                </div>
              )}
              <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '4px' }}>
                Must include: uppercase, lowercase, number, and special character
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-full"
              disabled={isLoading || Object.keys(validationErrors).length > 0}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        </div>

        <div className="card-footer text-center">
          <p style={{ margin: 0, color: 'var(--gray-600)' }}>
            Already have an account?{' '}
            <Link to="/login" className="btn-link" style={{ textDecoration: 'none' }}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;

