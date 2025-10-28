import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Link } from 'react-router-dom';
import API_CONFIG from '../config/apiConfig.js';
import '../styles/modern-banking.css';

export default function PaymentHistory() {
  const { token, user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, completed, failed, cancelled

  useEffect(() => {
    fetchPaymentHistory();
  }, [filter]);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      const url = filter === 'all' 
        ? '/employee/payments/history'
        : `/employee/payments/history?status=${filter}`;
        
      const res = await fetch(API_CONFIG.getURL(url), {
        headers: {
          ...API_CONFIG.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setPayments(data.data.payments);
      } else {
        setError('Failed to load payment history');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load payment history');
    } finally {
      setLoading(false);
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

  const getStatusBadge = (status) => {
    const styles = {
      completed: { background: 'var(--secondary-green)', color: 'white' },
      failed: { background: 'var(--secondary-red)', color: 'white' },
      cancelled: { background: 'var(--gray-500)', color: 'white' }
    };

    return (
      <span style={{
        padding: '4px 8px',
        borderRadius: 'var(--radius-sm)',
        fontSize: '12px',
        fontWeight: 'var(--font-medium)',
        ...styles[status]
      }}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div style={{ background: 'var(--bg-secondary)', minHeight: '100vh', padding: 'var(--space-4)' }}>
      <div className="container">
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <Link to={user?.role === 'Admin' ? '/admin/dashboard' : '/employee/dashboard'} className="btn btn-link" style={{ marginBottom: 'var(--space-4)', display: 'inline-block' }}>
            ← Back to Dashboard
          </Link>
          <h1 style={{ margin: 0, color: 'var(--text-primary)' }}>Payment History</h1>
          <p style={{ margin: '8px 0 0 0', color: 'var(--text-secondary)' }}>
            View all approved and denied payments
          </p>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-6)' }}>{error}</div>}

        {/* Filter Buttons */}
        <div style={{ marginBottom: 'var(--space-6)', display: 'flex', gap: 'var(--space-3)' }}>
          <button
            onClick={() => setFilter('all')}
            className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`btn ${filter === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilter('failed')}
            className={`btn ${filter === 'failed' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Denied
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`btn ${filter === 'cancelled' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Cancelled
          </button>
        </div>

        {/* Payment History Table */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', color: 'var(--text-primary)' }}>
              Payment Records ({payments.length})
            </h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {loading ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Loading...</div>
            ) : payments.length === 0 ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No payment history found
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-light)' }}>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'left', color: 'var(--text-primary)' }}>Payment ID</th>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'left', color: 'var(--text-primary)' }}>Customer</th>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'left', color: 'var(--text-primary)' }}>Recipient</th>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'right', color: 'var(--text-primary)' }}>Amount</th>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-primary)' }}>Status</th>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'left', color: 'var(--text-primary)' }}>Updated</th>
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
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {payment.recipientBank}
                          </div>
                        </td>
                        <td style={{ padding: 'var(--space-4)', textAlign: 'right', fontWeight: 'var(--font-semibold)' }}>
                          {formatCurrency(payment.amount, payment.currency)}
                        </td>
                        <td style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
                          {getStatusBadge(payment.status)}
                        </td>
                        <td style={{ padding: 'var(--space-4)', fontSize: '14px', color: 'var(--text-secondary)' }}>
                          {formatDate(payment.updatedAt)}
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
