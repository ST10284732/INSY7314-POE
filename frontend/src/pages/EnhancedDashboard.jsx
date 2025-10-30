import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate, Link } from 'react-router-dom';
import API_CONFIG from '../config/apiConfig.js';
import '../styles/modern-banking.css';

export default function EnhancedDashboard() {
  const { logout, user, token } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [accountData, setAccountData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDescription, setDepositDescription] = useState('');

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
      
      // Fetch account balance
      const balanceRes = await fetch(API_CONFIG.getURL('/account/balance'), {
        headers: {
          ...API_CONFIG.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      });

      if (balanceRes.ok) {
        const balanceData = await balanceRes.json();
        setAccountData(balanceData.data);
      }

      // Fetch recent transactions
      const transactionsRes = await fetch(API_CONFIG.getURL('/account/transactions?limit=5'), {
        headers: {
          ...API_CONFIG.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      });

      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json();
        setTransactions(transactionsData.data.transactions);
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    
    try {
      const res = await fetch(API_CONFIG.getURL('/account/deposit'), {
        method: 'POST',
        headers: {
          ...API_CONFIG.getHeaders(),
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(depositAmount),
          description: depositDescription || 'Deposit to account'
        })
      });

      if (res.ok) {
        setShowDepositModal(false);
        setDepositAmount('');
        setDepositDescription('');
        fetchDashboardData(); // Refresh data
      } else {
        const data = await res.json();
        setError(data.message || 'Deposit failed');
      }
    } catch (err) {
      setError('Failed to process deposit');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatCurrency = (amount) => {
    // Get currency preference from settings
    const savedSettings = localStorage.getItem('bankSettings');
    const currency = savedSettings ? JSON.parse(savedSettings).currency : 'ZAR';
    
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency || 'ZAR'
    }).format(amount);
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

  if (loading) {
    return (
      <div style={{ background: 'var(--bg-secondary)', minHeight: '100vh', padding: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>
            <i className="fas fa-credit-card"></i>
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>Loading your account...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-secondary)', minHeight: '100vh', padding: 'var(--space-4)' }}>
      <div className="container">
        {/* Header */}
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
            <h1 style={{ margin: 0, fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-bold)' }}>
              SecureBank International
            </h1>
            <p style={{ margin: '4px 0 0 0', opacity: 0.9 }}>
              Welcome back, {accountData?.accountHolder} • {currentTime.toLocaleTimeString()}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button 
              onClick={fetchDashboardData}
              className="btn" 
              style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
              title="Refresh account data"
            >
              <i className="fas fa-sync-alt"></i> Refresh
            </button>
            <Link to="/settings" style={{ textDecoration: 'none' }}>
              <button className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
                <i className="fas fa-cog"></i> Settings
              </button>
            </Link>
            <button onClick={handleLogout} className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
              <i className="fas fa-sign-out-alt"></i> Sign Out
            </button>
          </div>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-6)' }}>{error}</div>}

        {/* Account Balance Card */}
        <div className="card" style={{ marginBottom: 'var(--space-8)', background: 'linear-gradient(135deg, var(--secondary-green) 0%, #2d7d2e 100%)', color: 'white' }}>
          <div className="card-body" style={{ padding: 'var(--space-8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Available Balance</div>
                <div style={{ fontSize: '48px', fontWeight: 'var(--font-bold)', marginBottom: '8px' }}>
                  {formatCurrency(accountData?.balance || 0)}
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>
                  {accountData?.accountType} • {accountData?.accountNumber}
                </div>
              </div>
              <button onClick={() => setShowDepositModal(true)} className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
                + Add Funds
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <h3 style={{ marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>Quick Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--space-4)' }}>
            <Link to="/create-payment" style={{ textDecoration: 'none' }}>
              <button className="btn btn-primary" style={{ width: '100%', flexDirection: 'column', padding: 'var(--space-5)' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                  <i className="fas fa-paper-plane"></i>
                </div>
                <div style={{ fontSize: '14px' }}>Send Money</div>
              </button>
            </Link>
            <Link to="/payments" style={{ textDecoration: 'none' }}>
              <button className="btn btn-primary" style={{ width: '100%', flexDirection: 'column', padding: 'var(--space-5)' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                  <i className="fas fa-file-invoice-dollar"></i>
                </div>
                <div style={{ fontSize: '14px' }}>Payments</div>
              </button>
            </Link>
            <Link to="/transactions" style={{ textDecoration: 'none' }}>
              <button className="btn btn-primary" style={{ width: '100%', flexDirection: 'column', padding: 'var(--space-5)' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                  <i className="fas fa-chart-line"></i>
                </div>
                <div style={{ fontSize: '14px' }}>History</div>
              </button>
            </Link>
            <Link to="/beneficiaries" style={{ textDecoration: 'none' }}>
              <button className="btn btn-primary" style={{ width: '100%', flexDirection: 'column', padding: 'var(--space-5)' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                  <i className="fas fa-address-book"></i>
                </div>
                <div style={{ fontSize: '14px' }}>Beneficiaries</div>
              </button>
            </Link>
            <Link to="/mfa-setup" style={{ textDecoration: 'none' }}>
              <button className="btn btn-primary" style={{ width: '100%', flexDirection: 'column', padding: 'var(--space-5)' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                  <i className="fas fa-shield-alt"></i>
                </div>
                <div style={{ fontSize: '14px' }}>Security</div>
              </button>
            </Link>
          </div>
        </div>

        {/* Statistics Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
          <div className="card">
            <div className="card-body">
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Monthly Spending</div>
              <div style={{ fontSize: '28px', fontWeight: 'var(--font-bold)', color: 'var(--secondary-red)' }}>
                {formatCurrency(accountData?.monthlySpending || 0)}
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Monthly Income</div>
              <div style={{ fontSize: '28px', fontWeight: 'var(--font-bold)', color: 'var(--secondary-green)' }}>
                {formatCurrency(accountData?.monthlySalary || 0)}
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Transactions</div>
              <div style={{ fontSize: '28px', fontWeight: 'var(--font-bold)', color: 'var(--primary-blue)' }}>
                {accountData?.transactionCount || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', color: 'var(--text-primary)' }}>Recent Transactions</h3>
              <Link to="/transactions" className="btn btn-link">View All</Link>
            </div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {transactions.length === 0 ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No transactions yet. Start by adding funds to your account!
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'left', color: 'var(--text-primary)', fontSize: '14px' }}>Date</th>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'left', color: 'var(--text-primary)', fontSize: '14px' }}>Description</th>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'left', color: 'var(--text-primary)', fontSize: '14px' }}>Type</th>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'right', color: 'var(--text-primary)', fontSize: '14px' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction._id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: 'var(--space-4)', fontSize: '14px', color: 'var(--text-secondary)' }}>
                          {formatDate(transaction.transactionDate)}
                        </td>
                        <td style={{ padding: 'var(--space-4)', fontWeight: 'var(--font-medium)' }}>
                          {transaction.description}
                        </td>
                        <td style={{ padding: 'var(--space-4)' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '12px',
                            background: transaction.amount > 0 ? '#d4edda' : '#f8d7da',
                            color: transaction.amount > 0 ? '#155724' : '#721c24'
                          }}>
                            {transaction.type}
                          </span>
                        </td>
                        <td style={{ 
                          padding: 'var(--space-4)', 
                          textAlign: 'right',
                          fontWeight: 'var(--font-semibold)',
                          color: transaction.amount > 0 ? 'var(--secondary-green)' : 'var(--secondary-red)'
                        }}>
                          {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
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

      {/* Deposit Modal */}
      {showDepositModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: '90%', maxWidth: '500px' }}>
            <div className="card-header">
              <h3 style={{ margin: 0 }}>Add Funds</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleDeposit}>
                <div className="form-group">
                  <label className="form-label">Amount</label>
                  <input
                    type="number"
                    className="form-input"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={depositDescription}
                    onChange={(e) => setDepositDescription(e.target.value)}
                    placeholder="e.g., Monthly salary"
                  />
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    Confirm Deposit
                  </button>
                  <button type="button" onClick={() => setShowDepositModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
