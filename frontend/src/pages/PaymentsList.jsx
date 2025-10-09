import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/modern-banking.css';

export default function PaymentsList() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPayments, setTotalPayments] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState(null);

  // Pagination
  const paymentsPerPage = 10;

  // Status options for filtering
  const statusOptions = [
    { value: 'all', label: 'All Payments' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  // Fetch payments from API
  const fetchPayments = async (page = 1, status = 'all') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: paymentsPerPage.toString()
      });

      if (status !== 'all') {
        params.append('status', status);
      }

      const response = await fetch(`http://localhost:3000/v1/payments?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPayments(data.data.payments);
        setCurrentPage(data.data.pagination.currentPage);
        setTotalPages(data.data.pagination.totalPages);
        setTotalPayments(data.data.pagination.totalPayments);
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch payments');
      }
    } catch (err) {
      console.error('Fetch payments error:', err);
      setError('Unable to connect to server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch payment statistics
  const fetchStats = async () => {
    try {
      const statsResponse = await fetch('http://localhost:3000/v1/payments/stats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (statsResponse.ok) {
        const data = await statsResponse.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Fetch stats error:', err);
    }
  };

  // Load payments on component mount and when filters change
  useEffect(() => {
    fetchPayments(currentPage, statusFilter);
    fetchStats();
  }, [currentPage, statusFilter, token]);

  // Handle status filter change
  const handleStatusFilterChange = (newStatus) => {
    setStatusFilter(newStatus);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Format currency
  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge style
  const getStatusBadge = (status) => {
    const styles = {
      pending: { background: '#fff3cd', color: '#856404', border: '1px solid #ffeaa7' },
      processing: { background: '#cce5ff', color: '#004085', border: '1px solid #80bdff' },
      completed: { background: '#d4edda', color: '#155724', border: '1px solid #c3e6cb' },
      failed: { background: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb' },
      cancelled: { background: '#f0f0f0', color: '#6c757d', border: '1px solid #dee2e6' }
    };

    return (
      <span style={{
        ...styles[status] || styles.pending,
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {status}
      </span>
    );
  };

  return (
    <div className="page-container" style={{ alignItems: 'flex-start', paddingTop: 'var(--space-8)' }}>
      <div style={{ width: '100%', maxWidth: '1200px' }}>
        
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 'var(--space-6)' 
        }}>
          <div>
            <h1 style={{ margin: 0, color: 'var(--primary-blue)' }}>Payment History</h1>
            <p style={{ margin: '4px 0 0 0', color: 'var(--gray-600)' }}>
              Manage and track your international payments
            </p>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/create-payment')}
          >
            Create New Payment
          </button>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: 'var(--space-4)', 
            marginBottom: 'var(--space-6)' 
          }}>
            <div className="card">
              <div className="card-body text-center">
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary-blue)' }}>
                  {stats.totalPayments}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--gray-600)' }}>Total Payments</div>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--secondary-green)' }}>
                  {stats.pendingPayments}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--gray-600)' }}>Pending</div>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--secondary-green)' }}>
                  {stats.completedPayments}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--gray-600)' }}>Completed</div>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--secondary-red)' }}>
                  {stats.failedPayments}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--gray-600)' }}>Failed</div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <label style={{ fontSize: '14px', fontWeight: '500' }}>Filter by Status:</label>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                {statusOptions.map(option => (
                  <button
                    key={option.value}
                    className={`btn ${statusFilter === option.value ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                    onClick={() => handleStatusFilterChange(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0 }}>
              Payments ({totalPayments} {totalPayments === 1 ? 'payment' : 'payments'})
            </h3>
          </div>
          
          <div className="card-body" style={{ padding: 0 }}>
            {loading ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
                <div className="spinner"></div>
                <div style={{ marginTop: 'var(--space-2)' }}>Loading payments...</div>
              </div>
            ) : error ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--secondary-red)' }}>
                {error}
              </div>
            ) : payments.length === 0 ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--gray-600)' }}>
                No payments found. 
                <button 
                  className="btn-link" 
                  onClick={() => navigate('/create-payment')}
                  style={{ marginLeft: 'var(--space-2)' }}
                >
                  Create your first payment
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-light)' }}>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--gray-600)', textTransform: 'uppercase' }}>Payment ID</th>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--gray-600)', textTransform: 'uppercase' }}>Recipient</th>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--gray-600)', textTransform: 'uppercase' }}>Amount</th>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--gray-600)', textTransform: 'uppercase' }}>Status</th>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--gray-600)', textTransform: 'uppercase' }}>Date</th>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--gray-600)', textTransform: 'uppercase' }}>Provider</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment, index) => (
                      <tr 
                        key={payment._id} 
                        style={{ 
                          borderBottom: '1px solid var(--border-light)',
                          background: index % 2 === 0 ? 'transparent' : 'var(--bg-accent)'
                        }}
                      >
                        <td style={{ padding: 'var(--space-4)' }}>
                          <div style={{ fontWeight: '500', fontSize: '14px' }}>
                            {payment.paymentId}
                          </div>
                        </td>
                        <td style={{ padding: 'var(--space-4)' }}>
                          <div style={{ fontWeight: '500' }}>{payment.recipientName}</div>
                          <div style={{ fontSize: '12px', color: 'var(--gray-600)' }}>
                            {payment.recipientBank}
                          </div>
                        </td>
                        <td style={{ padding: 'var(--space-4)' }}>
                          <div style={{ fontWeight: '600', fontSize: '16px' }}>
                            {formatCurrency(payment.amount, payment.currency)}
                          </div>
                        </td>
                        <td style={{ padding: 'var(--space-4)' }}>
                          {getStatusBadge(payment.status)}
                        </td>
                        <td style={{ padding: 'var(--space-4)' }}>
                          <div style={{ fontSize: '14px' }}>
                            {formatDate(payment.createdAt)}
                          </div>
                        </td>
                        <td style={{ padding: 'var(--space-4)' }}>
                          <div style={{ fontSize: '12px', padding: '2px 6px', background: 'var(--gray-100)', borderRadius: '4px', display: 'inline-block' }}>
                            {payment.provider}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="card-footer">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '14px', color: 'var(--gray-600)' }}>
                  Page {currentPage} of {totalPages} • {totalPayments} total payments
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <button 
                    className="btn btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <button 
                    className="btn btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Back to Dashboard */}
        <div style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}>
          <button 
            className="btn-link"
            onClick={() => navigate('/dashboard')}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
