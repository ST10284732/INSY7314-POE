import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import '../styles/modern-banking.css';

export default function Dashboard() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Mock user data - in a real app, this would come from your backend
  const [accountData] = useState({
    balance: 12547.83,
    accountNumber: 'ACC987654321',
    accountType: 'Premium Checking',
    availableCredit: 5000.00,
    recentTransactions: [
      { id: 1, description: 'Salary Deposit', amount: 3500.00, date: '2025-10-07', type: 'credit' },
      { id: 2, description: 'Online Purchase', amount: -89.99, date: '2025-10-06', type: 'debit' },
      { id: 3, description: 'ATM Withdrawal', amount: -200.00, date: '2025-10-05', type: 'debit' },
      { id: 4, description: 'Transfer In', amount: 750.00, date: '2025-10-04', type: 'credit' },
      { id: 5, description: 'Utility Payment', amount: -156.32, date: '2025-10-03', type: 'debit' },
    ]
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
      day: 'numeric'
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
              SecureBank
            </h1>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>
              Welcome back! {currentTime.toLocaleTimeString()}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Good evening</div>
              <div style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>
                {user?.username || 'Valued Customer'}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-secondary"
              style={{ fontSize: '14px' }}
            >
              ← Sign Out
            </button>
          </div>
        </div>

        {/* Account Overview Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--space-6)',
          marginBottom: 'var(--space-8)'
        }}>
          {/* Primary Account Card */}
          <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-blue-dark) 100%)', color: 'white' }}>
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: 'var(--space-2)' }}>
                    {accountData.accountType}
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-2)' }}>
                    {formatCurrency(accountData.balance)}
                  </div>
                  <div style={{ fontSize: '14px', opacity: 0.8 }}>
                    Account: {accountData.accountNumber}
                  </div>
                </div>
                <div style={{ fontSize: '32px', color: 'rgba(255,255,255,0.8)' }}>⬜</div>
              </div>
              <div style={{ 
                marginTop: 'var(--space-6)',
                display: 'flex',
                gap: 'var(--space-4)'
              }}>
                <button className="btn" style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  fontSize: '14px'
                }}>
                  Transfer
                </button>
                <button className="btn" style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  fontSize: '14px'
                }}>
                  ⦚ Statement
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', color: 'var(--text-primary)' }}>Quick Actions</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ flexDirection: 'column', height: '80px' }}
                  onClick={() => navigate('/create-payment')}
                >
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>↗</div>
                  <div style={{ fontSize: '12px' }}>Create Payment</div>
                </button>
                <button 
                  className="btn btn-primary" 
                  style={{ flexDirection: 'column', height: '80px' }}
                  onClick={() => navigate('/payments')}
                >
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>⦁⦁⦁</div>
                  <div style={{ fontSize: '12px' }}>Payment History</div>
                </button>
                <button 
                  className="btn btn-primary" 
                  style={{ flexDirection: 'column', height: '80px' }}
                  onClick={() => navigate('/mfa-setup')}
                >
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>⊞</div>
                  <div style={{ fontSize: '12px' }}>Security & MFA</div>
                </button>
                <button 
                  className="btn btn-primary" 
                  style={{ flexDirection: 'column', height: '80px' }}
                  onClick={() => navigate('/settings')}
                >
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>⚙</div>
                  <div style={{ fontSize: '12px' }}>Settings</div>
                </button>
              </div>
            </div>
          </div>

          {/* Available Credit */}
          <div className="card">
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                <div style={{ fontSize: '32px' }}>⬜</div>
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Available Credit</div>
                  <div style={{ fontSize: '24px', fontWeight: 'var(--font-semibold)', color: 'var(--secondary-green)' }}>
                    {formatCurrency(accountData.availableCredit)}
                  </div>
                </div>
              </div>
              <div style={{ 
                height: '8px', 
                background: 'var(--gray-200)', 
                borderRadius: '4px',
                marginBottom: 'var(--space-3)'
              }}>
                <div style={{
                  height: '100%',
                  width: '75%',
                  background: 'linear-gradient(90deg, var(--secondary-green), #20c997)',
                  borderRadius: '4px'
                }}></div>
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                75% available
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', color: 'var(--text-primary)' }}>Recent Transactions</h3>
              <button className="btn btn-link">View All</button>
            </div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <th style={{ padding: 'var(--space-4)', textAlign: 'left', color: 'var(--text-primary)', fontSize: '14px' }}>
                      Description
                    </th>
                    <th style={{ padding: 'var(--space-4)', textAlign: 'left', color: 'var(--text-primary)', fontSize: '14px' }}>
                      Date
                    </th>
                    <th style={{ padding: 'var(--space-4)', textAlign: 'right', color: 'var(--text-primary)', fontSize: '14px' }}>
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {accountData.recentTransactions.map((transaction) => (
                    <tr key={transaction.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: 'var(--space-4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                          <div style={{ 
                            fontSize: '18px',
                            width: '40px',
                            height: '40px',
                            borderRadius: 'var(--radius-full)',
                            background: transaction.type === 'credit' ? '#22c55e' : '#ef4444',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            lineHeight: '1',
                            textAlign: 'center'
                          }}>
                            {transaction.type === 'credit' ? '+' : '−'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 'var(--font-medium)' }}>{transaction.description}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              {transaction.type === 'credit' ? 'Credit' : 'Debit'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: 'var(--space-4)', color: 'var(--text-secondary)' }}>
                        {formatDate(transaction.date)}
                      </td>
                      <td style={{ 
                        padding: 'var(--space-4)', 
                        textAlign: 'right',
                        fontWeight: 'var(--font-semibold)',
                        color: transaction.type === 'credit' ? 'var(--secondary-green)' : 'var(--secondary-red)'
                      }}>
                        {transaction.type === 'credit' ? '+' : ''}{formatCurrency(transaction.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
