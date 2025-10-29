import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate, Link } from 'react-router-dom';
import API_CONFIG from '../config/apiConfig.js';
import '../styles/modern-banking.css';

export default function AdminDashboard() {
  const { logout, user, token } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState(null);
  const [recentEmployees, setRecentEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch admin stats
      const statsRes = await fetch(API_CONFIG.getURL('/admin/stats'), {
        headers: {
          ...API_CONFIG.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }
      
      // Fetch recent employees
      const employeesRes = await fetch(API_CONFIG.getURL('/admin/employees?limit=5'), {
        headers: {
          ...API_CONFIG.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (employeesRes.ok) {
        const employeesData = await employeesRes.json();
        setRecentEmployees(employeesData.data.employees);
      }
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ background: 'var(--bg-secondary)', minHeight: '100vh', padding: 'var(--space-4)' }}>
      {/* Header */}
      <div className="container">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-8)',
          padding: 'var(--space-6)',
          background: 'linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-blue-dark) 100%)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          color: 'white'
        }}>
          <div>
            <h1 style={{ 
              margin: 0, 
              fontSize: 'var(--font-size-3xl)',
              fontWeight: 'var(--font-bold)'
            }}>
              Admin Dashboard
            </h1>
            <p style={{ margin: '4px 0 0 0', opacity: 0.9 }}>
              System Administration Portal • {currentTime.toLocaleTimeString()}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Administrator</div>
              <div style={{ fontWeight: 'var(--font-semibold)' }}>
                {user?.username || 'Admin'}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="btn"
              style={{ 
                fontSize: '14px',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)'
              }}
            >
              ← Sign Out
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 'var(--space-6)' }}>
            {error}
          </div>
        )}

        {/* Statistics Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-6)',
          marginBottom: 'var(--space-8)'
        }}>
          <div className="card">
            <div className="card-body">
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                Total Users
              </div>
              <div style={{ fontSize: '36px', fontWeight: 'var(--font-bold)', color: 'var(--primary-blue)' }}>
                {loading ? '...' : stats?.totalUsers || 0}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
                All system users
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                Customers
              </div>
              <div style={{ fontSize: '36px', fontWeight: 'var(--font-bold)', color: 'var(--secondary-green)' }}>
                {loading ? '...' : stats?.customers || 0}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
                Active customer accounts
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                Employees
              </div>
              <div style={{ fontSize: '36px', fontWeight: 'var(--font-bold)', color: 'var(--secondary-orange)' }}>
                {loading ? '...' : stats?.employees || 0}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
                Staff members
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                Administrators
              </div>
              <div style={{ fontSize: '36px', fontWeight: 'var(--font-bold)', color: 'var(--secondary-red)' }}>
                {loading ? '...' : stats?.admins || 0}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
                System administrators
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card" style={{ marginBottom: 'var(--space-8)' }}>
          <div className="card-header">
            <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', color: 'var(--text-primary)' }}>Staff Management</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
              <Link to="/admin/employees" style={{ textDecoration: 'none' }}>
                <button className="btn btn-primary" style={{ width: '100%', flexDirection: 'column', padding: 'var(--space-5)' }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>👥</div>
                  <div style={{ fontSize: '14px' }}>Manage Employees</div>
                </button>
              </Link>
              <Link to="/admin/create-staff" style={{ textDecoration: 'none' }}>
                <button className="btn btn-primary" style={{ width: '100%', flexDirection: 'column', padding: 'var(--space-5)' }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>➕</div>
                  <div style={{ fontSize: '14px' }}>Create Staff User</div>
                </button>
              </Link>
              <Link to="/settings" style={{ textDecoration: 'none' }}>
                <button className="btn btn-primary" style={{ width: '100%', flexDirection: 'column', padding: 'var(--space-5)' }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚙</div>
                  <div style={{ fontSize: '14px' }}>Settings</div>
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Employees */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', color: 'var(--text-primary)' }}>Recent Staff Members</h3>
              <Link to="/admin/employees" className="btn btn-link">View All</Link>
            </div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {loading ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Loading...
              </div>
            ) : recentEmployees.length === 0 ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No employees found
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'left', color: 'var(--text-primary)', fontSize: '14px' }}>Name</th>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'left', color: 'var(--text-primary)', fontSize: '14px' }}>Username</th>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'left', color: 'var(--text-primary)', fontSize: '14px' }}>Role</th>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'left', color: 'var(--text-primary)', fontSize: '14px' }}>Account Number</th>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-primary)', fontSize: '14px' }}>MFA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentEmployees.map((employee) => (
                      <tr key={employee._id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: 'var(--space-4)' }}>
                          <div style={{ fontWeight: 'var(--font-medium)' }}>
                            {employee.firstname} {employee.lastname}
                          </div>
                        </td>
                        <td style={{ padding: 'var(--space-4)', color: 'var(--text-secondary)' }}>
                          {employee.username}
                        </td>
                        <td style={{ padding: 'var(--space-4)' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '12px',
                            fontWeight: 'var(--font-medium)',
                            background: employee.role === 'Admin' ? 'var(--secondary-red)' : 'var(--secondary-orange)',
                            color: 'white'
                          }}>
                            {employee.role}
                          </span>
                        </td>
                        <td style={{ padding: 'var(--space-4)', fontFamily: 'monospace', fontSize: '13px' }}>
                          {employee.accountNumber}
                        </td>
                        <td style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
                          {employee.mfaEnabled ? '✓' : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
