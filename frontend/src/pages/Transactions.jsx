import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Link } from 'react-router-dom';
import API_CONFIG from '../config/apiConfig.js';
import '../styles/modern-banking.css';

export default function Transactions() {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({ type: '', category: '' });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, [page, filter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      let url = `/account/transactions?page=${page}&limit=20`;
      if (filter.type) url += `&type=${filter.type}`;
      if (filter.category) url += `&category=${filter.category}`;
      
      const res = await fetch(API_CONFIG.getURL(url), {
        headers: {
          ...API_CONFIG.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setTransactions(data.data.transactions);
        setPagination(data.data.pagination);
      } else {
        setError('Failed to load transactions');
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount, currency) => {
    // Get currency preference from settings
    const savedSettings = localStorage.getItem('bankSettings');
    const preferredCurrency = savedSettings ? JSON.parse(savedSettings).currency : 'ZAR';
    
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: preferredCurrency || 'ZAR'
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <Link to="/dashboard" className="btn btn-link" style={{ marginBottom: 'var(--space-4)', display: 'inline-block' }}>
            <i className="fas fa-arrow-left"></i> Back to Dashboard
          </Link>
          <h1 style={{ margin: 0, color: 'var(--text-primary)' }}>Transaction History</h1>
          <p style={{ margin: '8px 0 0 0', color: 'var(--text-secondary)' }}>
            View all your account transactions
          </p>
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
              <div>
                <label className="form-label">Type</label>
                <select
                  className="form-input"
                  value={filter.type}
                  onChange={(e) => { setFilter({ ...filter, type: e.target.value }); setPage(1); }}
                >
                  <option value="">All Types</option>
                  <option value="deposit">Deposit</option>
                  <option value="withdrawal">Withdrawal</option>
                  <option value="payment">Payment</option>
                  <option value="transfer">Transfer</option>
                  <option value="salary">Salary</option>
                  <option value="refund">Refund</option>
                </select>
              </div>
              <div>
                <label className="form-label">Category</label>
                <select
                  className="form-input"
                  value={filter.category}
                  onChange={(e) => { setFilter({ ...filter, category: e.target.value }); setPage(1); }}
                >
                  <option value="">All Categories</option>
                  <option value="salary">Salary</option>
                  <option value="groceries">Groceries</option>
                  <option value="rent">Rent</option>
                  <option value="utilities">Utilities</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="transport">Transport</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="shopping">Shopping</option>
                  <option value="dining">Dining</option>
                  <option value="education">Education</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  onClick={() => { setFilter({ type: '', category: '' }); setPage(1); }}
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', color: 'var(--text-primary)' }}>
              {pagination ? `${pagination.totalCount} Transactions` : 'Transactions'}
            </h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {loading ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Loading transactions...
              </div>
            ) : error ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
                <div className="alert alert-error">{error}</div>
              </div>
            ) : transactions.length === 0 ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No transactions found
              </div>
            ) : (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-light)' }}>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'left', color: 'var(--text-primary)', fontSize: '14px' }}>Date</th>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'left', color: 'var(--text-primary)', fontSize: '14px' }}>Description</th>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'left', color: 'var(--text-primary)', fontSize: '14px' }}>Type</th>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'left', color: 'var(--text-primary)', fontSize: '14px' }}>Category</th>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'right', color: 'var(--text-primary)', fontSize: '14px' }}>Amount</th>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'right', color: 'var(--text-primary)', fontSize: '14px' }}>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction) => (
                        <tr key={transaction._id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <td style={{ padding: 'var(--space-4)', fontSize: '13px', color: 'var(--text-secondary)' }}>
                            {formatDate(transaction.transactionDate)}
                          </td>
                          <td style={{ padding: 'var(--space-4)', fontWeight: 'var(--font-medium)' }}>
                            {transaction.description}
                            {transaction.relatedParty && (
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                {transaction.relatedParty.name}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: 'var(--space-4)' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '12px',
                              background: transaction.amount > 0 ? '#d4edda' : '#f8d7da',
                              color: transaction.amount > 0 ? '#155724' : '#721c24',
                              textTransform: 'capitalize'
                            }}>
                              {transaction.type}
                            </span>
                          </td>
                          <td style={{ padding: 'var(--space-4)', fontSize: '13px', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                            {transaction.category}
                          </td>
                          <td style={{ 
                            padding: 'var(--space-4)', 
                            textAlign: 'right',
                            fontWeight: 'var(--font-semibold)',
                            fontSize: '15px',
                            color: transaction.amount > 0 ? 'var(--secondary-green)' : 'var(--secondary-red)'
                          }}>
                            {transaction.amount > 0 ? '+' : '-'}{formatCurrency(transaction.amount, transaction.currency)}
                          </td>
                          <td style={{ padding: 'var(--space-4)', textAlign: 'right', fontSize: '14px', color: 'var(--text-secondary)' }}>
                            {formatCurrency(transaction.balanceAfter, transaction.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <button
                        onClick={() => setPage(page - 1)}
                        disabled={!pagination.hasPrevPage}
                        className="btn btn-secondary"
                        style={{ fontSize: '14px' }}
                      >
                        <i className="fas fa-arrow-left"></i> Previous
                      </button>
                      <button
                        onClick={() => setPage(page + 1)}
                        disabled={!pagination.hasNextPage}
                        className="btn btn-secondary"
                        style={{ fontSize: '14px' }}
                      >
                        Next <i className="fas fa-arrow-right"></i>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
