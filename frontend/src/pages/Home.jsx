import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="page-container">
      <div style={{
        textAlign: 'center',
        maxWidth: '800px',
        width: '100%'
      }}>
        {/* Hero Section */}
        <div className="card" style={{ marginBottom: 'var(--space-8)' }}>
          <div className="card-body" style={{ padding: 'var(--space-12)' }}>
            <h1 style={{
              fontSize: 'var(--font-size-4xl)',
              marginBottom: 'var(--space-6)',
              background: 'linear-gradient(135deg, var(--primary-blue), var(--primary-blue-dark))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              SecureBank International
            </h1>
            <p style={{
              fontSize: 'var(--font-size-lg)',
              color: 'var(--gray-600)',
              marginBottom: 'var(--space-8)',
              lineHeight: 'var(--leading-relaxed)'
            }}>
              Experience modern banking with world-class security, seamless international payments, 
              and 24/7 access to your finances. Join thousands of satisfied customers worldwide.
            </p>
            
            <div style={{
              display: 'flex',
              gap: 'var(--space-4)',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginBottom: 'var(--space-8)'
            }}>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <button className="btn btn-primary" style={{ minWidth: '160px' }}>
                  Sign In
                </button>
              </Link>
              <Link to="/register" style={{ textDecoration: 'none' }}>
                <button className="btn btn-secondary" style={{ minWidth: '160px' }}>
                  Get Started
                </button>
              </Link>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 'var(--space-8)',
              flexWrap: 'wrap',
              fontSize: '14px',
              color: 'var(--gray-500)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                • FDIC Insured
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                • 256-bit SSL Encryption
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                • Global Access
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 'var(--space-6)',
          marginBottom: 'var(--space-8)'
        }}>
          <div className="card">
            <div className="card-body text-center">
              <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)', fontWeight: 'bold' }}>PAYMENTS</div>
              <h3 style={{ marginBottom: 'var(--space-3)' }}>Secure Payments</h3>
              <p style={{ margin: 0, color: 'var(--gray-600)' }}>
                Make international payments with bank-grade security and real-time fraud protection.
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-body text-center">
              <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)', fontWeight: 'bold' }}>MOBILE</div>
              <h3 style={{ marginBottom: 'var(--space-3)' }}>Mobile Banking</h3>
              <p style={{ margin: 0, color: 'var(--gray-600)' }}>
                Access your accounts anywhere, anytime with our modern mobile-first platform.
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-body text-center">
              <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)', fontWeight: 'bold' }}>GLOBAL</div>
              <h3 style={{ marginBottom: 'var(--space-3)' }}>Global Reach</h3>
              <p style={{ margin: 0, color: 'var(--gray-600)' }}>
                Send and receive money across borders with competitive exchange rates.
              </p>
            </div>
          </div>
        </div>

        {/* Security Banner */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, var(--bg-accent) 0%, var(--primary-blue) 100%)',
          color: 'white'
        }}>
          <div className="card-body" style={{ padding: 'var(--space-8)' }}>
            <h3 style={{ color: 'white', marginBottom: 'var(--space-4)' }}>
              Your Security is Our Priority
            </h3>
            <p style={{ 
              margin: 0, 
              color: 'rgba(255,255,255,0.9)',
              fontSize: 'var(--font-size-lg)'
            }}>
              We use advanced encryption, multi-factor authentication, and continuous monitoring 
              to protect your financial information and transactions.
            </p>
            <div style={{
              marginTop: 'var(--space-6)',
              display: 'flex',
              justifyContent: 'center',
              gap: 'var(--space-6)',
              flexWrap: 'wrap',
              fontSize: '14px'
            }}>
              <div>• End-to-End Encryption</div>
              <div>• Real-time Monitoring</div>
              <div>• Biometric Login</div>
              <div>• PCI DSS Compliant</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}