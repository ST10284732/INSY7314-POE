import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate, Link } from 'react-router-dom';
import API_CONFIG from '../config/apiConfig.js';
import '../styles/modern-banking.css';

export default function CreateStaff() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    idNumber: '',
    accountNumber: '',
    username: '',
    password: '',
    role: 'Employee'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(API_CONFIG.getURL('/admin/staff'), {
        method: 'POST',
        headers: {
          ...API_CONFIG.getHeaders(),
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(`${formData.role} created successfully!`);
        setTimeout(() => navigate('/admin/employees'), 2000);
      } else {
        setError(data.message || 'Failed to create staff user');
      }
    } catch (err) {
      setError('Failed to create staff user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-secondary)', minHeight: '100vh', padding: 'var(--space-4)' }}>
      <div className="container" style={{ maxWidth: '600px' }}>
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <Link to="/admin/dashboard" className="btn btn-link" style={{ marginBottom: 'var(--space-4)', display: 'inline-block' }}>
            ← Back to Dashboard
          </Link>
          <h1 style={{ margin: 0, color: 'var(--text-primary)' }}>Create Staff User</h1>
          <p style={{ margin: '8px 0 0 0', color: 'var(--text-secondary)' }}>
            Add a new employee or administrator to the system
          </p>
        </div>

        <div className="card">
          <div className="card-body">
            {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-6)' }}>{error}</div>}
            {success && <div className="alert alert-success" style={{ marginBottom: 'var(--space-6)' }}>{success}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  name="firstname"
                  className="form-input"
                  value={formData.firstname}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  name="lastname"
                  className="form-input"
                  value={formData.lastname}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">ID Number</label>
                <input
                  type="text"
                  name="idNumber"
                  className="form-input"
                  value={formData.idNumber}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Account Number</label>
                <input
                  type="text"
                  name="accountNumber"
                  className="form-input"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  name="username"
                  className="form-input"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  name="password"
                  className="form-input"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="8"
                />
                <small style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                  Must be at least 8 characters with uppercase, lowercase, number, and special character
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  name="role"
                  className="form-input"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  <option value="Employee">Employee</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={loading}
              >
                {loading ? 'Creating...' : `Create ${formData.role}`}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
