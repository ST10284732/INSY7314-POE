import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate, Link } from 'react-router-dom';
import API_CONFIG from '../config/apiConfig.js';
import '../styles/modern-banking.css';

export default function EmployeeDashboard() {
  const { logout, user, token } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState(null);
  const [pendingPayments, setPendingPayments] = useState([]);
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
      
      // Fetch stats
      const statsRes = await fetch(API_CONFIG.getURL('/employee/stats'), {
        headers: {
          ...API_CONFIG.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }
      
      // Fetch recent pending payments
      const paymentsRes = await fetch(API_CONFIG.getURL('/employee/payments/pending?limit=5'), {
        headers: {
          ...API_CONFIG.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        setPendingPayments(paymentsData.data.payments);
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          background: 'var(--bg-primary)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div>
            <h1 style={{ 
              margin: 0, 
              color: 'var(--primary-blue)',
              fontSize: 'var(--font-size-3xl)',
              fontWeight: 'var(--font-bold)'
            }}>
              Employee Dashboard
            </h1>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>
              Payment Management Portal • {currentTime.toLocaleTimeString()}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Employee</div>
              <div style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>
                {user?.username || 'Staff Member'}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-secondary"
              style={{ fontSize: '14px' }}
            >
              <i className="fas fa-sign-out-alt"></i> Sign Out
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 'var(--space-6)',
          marginBottom: 'var(--space-8)'
        }}>
          <div className="card">
            <div className="card-body">
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                Pending Payments
              </div>
              <div style={{ fontSize: '32px', fontWeight: 'var(--font-bold)', color: 'var(--secondary-orange)' }}>
                {loading ? '...' : stats?.pendingCount || 0}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
                Awaiting review
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                Completed Today
              </div>
              <div style={{ fontSize: '32px', fontWeight: 'var(--font-bold)', color: 'var(--secondary-green)' }}>
                {loading ? '...' : stats?.completedCount || 0}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
                Successfully processed
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                Total Amount Pending
              </div>
              <div style={{ fontSize: '28px', fontWeight: 'var(--font-bold)', color: 'var(--primary-blue)' }}>
                {loading ? '...' : formatCurrency(stats?.pendingAmount || 0)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
                Total value
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                Failed/Cancelled
              </div>
              <div style={{ fontSize: '32px', fontWeight: 'var(--font-bold)', color: 'var(--secondary-red)' }}>
                {loading ? '...' : (stats?.failedCount || 0) + (stats?.cancelledCount || 0)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
                Rejected transactions
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card" style={{ marginBottom: 'var(--space-8)' }}>
          <div className="card-header">
            <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', color: 'var(--text-primary)' }}>Quick Actions</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
              <Link to="/employee/pending" style={{ textDecoration: 'none' }}>
                <button className="btn btn-primary" style={{ width: '100%', flexDirection: 'column', padding: 'var(--space-5)' }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                    <i className="fas fa-clock"></i>
                  </div>
                  <div style={{ fontSize: '14px' }}>Review Pending Payments</div>
                </button>
              </Link>
              <Link to="/employee/history" style={{ textDecoration: 'none' }}>
                <button className="btn btn-primary" style={{ width: '100%', flexDirection: 'column', padding: 'var(--space-5)' }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                    <i className="fas fa-file-invoice-dollar"></i>
                  </div>
                  <div style={{ fontSize: '14px' }}>View Payment History</div>
                </button>
              </Link>
              <Link to="/settings" style={{ textDecoration: 'none' }}>
                <button className="btn btn-primary" style={{ width: '100%', flexDirection: 'column', padding: 'var(--space-5)' }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                    <i className="fas fa-cog"></i>
                  </div>
                  <div style={{ fontSize: '14px' }}>Settings</div>
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Pending Payments */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', color: 'var(--text-primary)' }}>Recent Pending Payments</h3>
              <Link to="/employee/pending" className="btn btn-link">View All</Link>
            </div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {loading ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Loading...
              </div>
            ) : pendingPayments.length === 0 ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No pending payments at this time
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'left', color: 'var(--text-primary)', fontSize: '14px' }}>Payment ID</th>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'left', color: 'var(--text-primary)', fontSize: '14px' }}>Customer</th>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'left', color: 'var(--text-primary)', fontSize: '14px' }}>Recipient</th>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'right', color: 'var(--text-primary)', fontSize: '14px' }}>Amount</th>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'left', color: 'var(--text-primary)', fontSize: '14px' }}>Date</th>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-primary)', fontSize: '14px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingPayments.map((payment) => (
                      <tr key={payment._id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: 'var(--space-4)', fontFamily: 'monospace', fontSize: '12px' }}>
                          {payment.paymentId}
                        </td>
                        <td style={{ padding: 'var(--space-4)' }}>
                          {payment.userId?.username || 'N/A'}
                        </td>
                        <td style={{ padding: 'var(--space-4)' }}>
                          {payment.recipientName}
                        </td>
                        <td style={{ padding: 'var(--space-4)', textAlign: 'right', fontWeight: 'var(--font-semibold)' }}>
                          {payment.amount} {payment.currency}
                        </td>
                        <td style={{ padding: 'var(--space-4)', fontSize: '14px', color: 'var(--text-secondary)' }}>
                          {formatDate(payment.createdAt)}
                        </td>
                        <td style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
                          <Link to={`/employee/pending`}>
                            <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}>
                              Review
                            </button>
                          </Link>
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
