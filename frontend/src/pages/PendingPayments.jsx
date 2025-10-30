import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate, Link } from 'react-router-dom';
import API_CONFIG from '../config/apiConfig.js';
import '../styles/modern-banking.css';

export default function PendingPayments() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [updateReason, setUpdateReason] = useState('');

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_CONFIG.getURL('/employee/payments/pending'), {
        headers: {
          ...API_CONFIG.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setPayments(data.data.payments);
      } else {
        setError('Failed to load pending payments');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load pending payments');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (paymentId, newStatus) => {
    try {
      const res = await fetch(API_CONFIG.getURL(`/employee/payments/${paymentId}/status`), {
        method: 'PATCH',
        headers: {
          ...API_CONFIG.getHeaders(),
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newStatus,
          reason: updateReason || `Payment ${newStatus} by ${user.username}`
        })
      });

      if (res.ok) {
        setSuccess(`Payment ${newStatus} successfully`);
        setSelectedPayment(null);
        setUpdateReason('');
        fetchPendingPayments(); // Refresh list
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to update payment');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to update payment');
      setTimeout(() => setError(''), 3000);
    }
  };

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
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
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <Link to={user?.role === 'Admin' ? '/admin/dashboard' : '/employee/dashboard'} className="btn btn-link" style={{ marginBottom: 'var(--space-4)', display: 'inline-block' }}>
            <i className="fas fa-arrow-left"></i> Back to Dashboard
          </Link>
          <h1 style={{ margin: 0, color: 'var(--text-primary)' }}>Pending Payments</h1>
          <p style={{ margin: '8px 0 0 0', color: 'var(--text-secondary)' }}>
            Review and approve/deny customer payments
          </p>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-6)' }}>{error}</div>}
        {success && <div className="alert alert-success" style={{ marginBottom: 'var(--space-6)' }}>{success}</div>}

        {/* Payments List */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', color: 'var(--text-primary)' }}>
              Payments Awaiting Review ({payments.length})
            </h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {loading ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Loading...</div>
            ) : payments.length === 0 ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No pending payments at this time
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-light)' }}>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'left', color: 'var(--text-primary)' }}>Payment ID</th>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'left', color: 'var(--text-primary)' }}>Customer</th>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'left', color: 'var(--text-primary)' }}>Recipient</th>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'left', color: 'var(--text-primary)' }}>Bank</th>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'right', color: 'var(--text-primary)' }}>Amount</th>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'left', color: 'var(--text-primary)' }}>Date</th>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-primary)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment._id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: 'var(--space-4)', fontFamily: 'monospace', fontSize: '12px' }}>
                          {payment.paymentId}
                        </td>
                        <td style={{ padding: 'var(--space-4)' }}>
                          <div style={{ fontWeight: 'var(--font-medium)' }}>
                            {payment.userId?.firstname} {payment.userId?.lastname}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            @{payment.userId?.username}
                          </div>
                        </td>
                        <td style={{ padding: 'var(--space-4)' }}>
                          <div style={{ fontWeight: 'var(--font-medium)' }}>{payment.recipientName}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                            {payment.recipientAccount}
                          </div>
                        </td>
                        <td style={{ padding: 'var(--space-4)' }}>
                          <div>{payment.recipientBank}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                            {payment.swiftCode}
                          </div>
                        </td>
                        <td style={{ padding: 'var(--space-4)', textAlign: 'right', fontWeight: 'var(--font-semibold)' }}>
                          {formatCurrency(payment.amount, payment.currency)}
                        </td>
                        <td style={{ padding: 'var(--space-4)', fontSize: '14px', color: 'var(--text-secondary)' }}>
                          {formatDate(payment.createdAt)}
                        </td>
                        <td style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleUpdateStatus(payment._id, 'completed')}
                              className="btn"
                              style={{ 
                                fontSize: '12px', 
                                padding: '6px 12px',
                                background: 'var(--secondary-green)',
                                color: 'white',
                                border: 'none'
                              }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(payment._id, 'failed')}
                              className="btn"
                              style={{ 
                                fontSize: '12px', 
                                padding: '6px 12px',
                                background: 'var(--secondary-red)',
                                color: 'white',
                                border: 'none'
                              }}
                            >
                              Deny
                            </button>
                          </div>
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
