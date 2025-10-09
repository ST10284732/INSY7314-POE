import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import '../styles/modern-banking.css';

export default function MFASetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mfaStatus, setMfaStatus] = useState(null);
  const [setupStep, setSetupStep] = useState('status'); // 'status', 'generate', 'verify', 'complete'
  const [qrCode, setQrCode] = useState('');
  const [manualKey, setManualKey] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    checkMFAStatus();
  }, []);

  const checkMFAStatus = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMFAStatus();
      setMfaStatus(response.data.data);
    } catch (error) {
      console.error('Failed to check MFA status:', error);
      setError('Failed to load MFA status');
    } finally {
      setLoading(false);
    }
  };

  const generateMFASetup = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiService.generateMFASetup();
      
      console.log('MFA Response:', response); // Debug log
      setQrCode(response.data.data.qrCode);
      setManualKey(response.data.data.manualEntryKey);
      setSetupStep('verify');
      setSuccess('MFA setup generated! Scan the QR code with your authenticator app.');
    } catch (error) {
      console.error('Failed to generate MFA setup:', error);
      setError(error.response?.data?.message || 'Failed to generate MFA setup');
    } finally {
      setLoading(false);
    }
  };

  const verifyMFASetup = async (e) => {
    e.preventDefault();
    
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit verification code');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await apiService.verifyMFASetup(verificationCode);
      
      console.log('Verification Response:', response); // Debug log
      setBackupCodes(response.data.data?.backupCodes || []);
      setSetupStep('complete');
      setSuccess('MFA setup completed successfully!');
      
      // Refresh MFA status
      await checkMFAStatus();
    } catch (error) {
      console.error('Failed to verify MFA setup:', error);
      setError(error.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const disableMFA = async () => {
    if (!window.confirm('Are you sure you want to disable Multi-Factor Authentication? This will make your account less secure.')) {
      return;
    }

    const password = window.prompt('Please enter your password to confirm:');
    if (!password) return;

    try {
      setLoading(true);
      setError('');
      await apiService.disableMFA(password);
      
      setSuccess('MFA has been disabled');
      setSetupStep('status');
      await checkMFAStatus();
    } catch (error) {
      console.error('Failed to disable MFA:', error);
      setError(error.response?.data?.message || 'Failed to disable MFA');
    } finally {
      setLoading(false);
    }
  };

  const downloadBackupCodes = () => {
    const content = `SecureBank Multi-Factor Authentication Backup Codes\n\nAccount: ${user?.username}\nGenerated: ${new Date().toLocaleString()}\n\nBackup Codes (use only once each):\n${backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}\n\nKeep these codes in a safe place. You can use them to access your account if you lose your authenticator device.`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `securebank-backup-codes-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && !mfaStatus) {
    return (
      <div style={{ background: 'var(--bg-secondary)', minHeight: '100vh', padding: 'var(--space-4)' }}>
        <div className="container">
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
              <div style={{ fontSize: '24px', marginBottom: 'var(--space-4)' }}>🔄</div>
              <div>Loading MFA settings...</div>
            </div>
          </div>
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
          marginBottom: 'var(--space-6)',
          padding: 'var(--space-6)',
          background: 'var(--bg-primary)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div>
            <h1 style={{ 
              margin: 0, 
              color: 'var(--primary-blue)',
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-bold)'
            }}>
              🔐 Multi-Factor Authentication
            </h1>
            <p style={{ margin: '4px 0 0 0', color: 'var(--gray-600)' }}>
              Secure your account with an additional layer of protection
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-secondary"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div style={{
            background: 'var(--secondary-red)',
            color: 'white',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius)',
            marginBottom: 'var(--space-4)'
          }}>
            ❌ {error}
          </div>
        )}

        {success && (
          <div style={{
            background: 'var(--secondary-green)',
            color: 'white',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius)',
            marginBottom: 'var(--space-4)'
          }}>
            ✅ {success}
          </div>
        )}

        {/* MFA Status */}
        {setupStep === 'status' && mfaStatus && (
          <div className="card">
            <div className="card-header">
              <h2 style={{ margin: 0 }}>Current MFA Status</h2>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                <div style={{ 
                  fontSize: '48px',
                  color: mfaStatus.mfaEnabled ? 'var(--secondary-green)' : 'var(--secondary-red)'
                }}>
                  {mfaStatus.mfaEnabled ? '🔐' : '🔓'}
                </div>
                <div>
                  <h3 style={{ margin: 0, color: mfaStatus.mfaEnabled ? 'var(--secondary-green)' : 'var(--secondary-red)' }}>
                    MFA is {mfaStatus.mfaEnabled ? 'ENABLED' : 'DISABLED'}
                  </h3>
                  <p style={{ margin: '4px 0 0 0', color: 'var(--gray-600)' }}>
                    {mfaStatus.mfaEnabled 
                      ? `Setup completed. ${mfaStatus.backupCodesRemaining} backup codes remaining.`
                      : 'Your account is not protected by multi-factor authentication.'
                    }
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                {!mfaStatus.mfaEnabled ? (
                  <button
                    onClick={() => setSetupStep('generate')}
                    className="btn btn-primary"
                  >
                    🔐 Enable MFA Protection
                  </button>
                ) : (
                  <button
                    onClick={disableMFA}
                    className="btn btn-secondary"
                    disabled={loading}
                  >
                    🔓 Disable MFA
                  </button>
                )}
              </div>

              {/* Information Box */}
              <div style={{
                background: 'var(--bg-accent)',
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius)',
                marginTop: 'var(--space-6)'
              }}>
                <h4 style={{ margin: '0 0 var(--space-2) 0', color: 'var(--primary-blue)' }}>
                  What is Multi-Factor Authentication?
                </h4>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5 }}>
                  MFA adds an extra layer of security to your account by requiring a second form of verification 
                  (like a code from your phone) in addition to your password. This helps protect your account 
                  even if someone else knows your password.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Generate MFA Setup */}
        {setupStep === 'generate' && (
          <div className="card">
            <div className="card-header">
              <h2 style={{ margin: 0 }}>Setup Multi-Factor Authentication</h2>
            </div>
            <div className="card-body">
              <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
                <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>📱</div>
                <h3>Step 1: Install an Authenticator App</h3>
                <p style={{ color: 'var(--gray-600)', marginBottom: 'var(--space-4)' }}>
                  You'll need an authenticator app on your phone to generate verification codes.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '32px' }}>📱</div>
                    <div style={{ fontSize: '14px', fontWeight: 'var(--font-medium)' }}>Google Authenticator</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '32px' }}>🔐</div>
                    <div style={{ fontSize: '14px', fontWeight: 'var(--font-medium)' }}>Authy</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '32px' }}>🛡️</div>
                    <div style={{ fontSize: '14px', fontWeight: 'var(--font-medium)' }}>Microsoft Authenticator</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-4)' }}>
                <button
                  onClick={() => setSetupStep('status')}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={generateMFASetup}
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Generating...' : 'Continue to Setup'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Verify MFA Setup */}
        {setupStep === 'verify' && (
          <div className="card">
            <div className="card-header">
              <h2 style={{ margin: 0 }}>Step 2: Scan QR Code & Verify</h2>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
                {/* QR Code */}
                <div style={{ textAlign: 'center' }}>
                  <h3>Scan with your app</h3>
                  {qrCode && (
                    <div style={{ background: 'white', padding: 'var(--space-4)', borderRadius: 'var(--radius)', display: 'inline-block' }}>
                      <img src={qrCode} alt="MFA QR Code" style={{ maxWidth: '200px', height: 'auto' }} />
                    </div>
                  )}
                </div>

                {/* Manual Entry */}
                <div>
                  <h3>Or enter manually</h3>
                  <p style={{ fontSize: '14px', color: 'var(--gray-600)', marginBottom: 'var(--space-3)' }}>
                    If you can't scan the QR code, enter this key manually in your authenticator app:
                  </p>
                  <div style={{ 
                    background: 'var(--gray-100)', 
                    padding: 'var(--space-3)', 
                    borderRadius: 'var(--radius)',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    wordBreak: 'break-all',
                    marginBottom: 'var(--space-4)'
                  }}>
                    {manualKey}
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(manualKey)}
                    className="btn btn-secondary"
                    style={{ fontSize: '14px' }}
                  >
                    📋 Copy Key
                  </button>
                </div>
              </div>

              {/* Verification Form */}
              <form onSubmit={verifyMFASetup}>
                <h3>Enter verification code</h3>
                <p style={{ fontSize: '14px', color: 'var(--gray-600)', marginBottom: 'var(--space-4)' }}>
                  Open your authenticator app and enter the 6-digit code it generates:
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    style={{ width: '150px', textAlign: 'center', fontSize: '18px', fontFamily: 'monospace' }}
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || verificationCode.length !== 6}
                  >
                    {loading ? 'Verifying...' : 'Verify & Enable MFA'}
                  </button>
                </div>
              </form>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={() => setSetupStep('generate')}
                  className="btn btn-link"
                >
                  ← Back to previous step
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Setup Complete */}
        {setupStep === 'complete' && (
          <div className="card">
            <div className="card-header">
              <h2 style={{ margin: 0 }}>🎉 MFA Setup Complete!</h2>
            </div>
            <div className="card-body">
              <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
                <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>✅</div>
                <h3 style={{ color: 'var(--secondary-green)' }}>Multi-Factor Authentication Enabled</h3>
                <p style={{ color: 'var(--gray-600)' }}>
                  Your account is now protected with an additional layer of security.
                </p>
              </div>

              {/* Backup Codes */}
              {backupCodes && backupCodes.length > 0 && (
                <div style={{
                  background: 'var(--bg-accent)',
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius)',
                  marginBottom: 'var(--space-6)'
                }}>
                  <h4 style={{ margin: '0 0 var(--space-3) 0', color: 'var(--secondary-red)' }}>
                    ⚠️ Important: Save Your Backup Codes
                  </h4>
                  <p style={{ fontSize: '14px', marginBottom: 'var(--space-4)' }}>
                    Keep these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.
                  </p>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: 'var(--space-2)',
                    marginBottom: 'var(--space-4)'
                  }}>
                    {backupCodes.map((code, index) => (
                      <div key={index} style={{
                        background: 'white',
                        padding: 'var(--space-2)',
                        borderRadius: 'var(--radius)',
                        textAlign: 'center',
                        fontFamily: 'monospace',
                        fontSize: '14px',
                        fontWeight: 'var(--font-medium)'
                      }}>
                        {code}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={downloadBackupCodes}
                    className="btn btn-secondary"
                  >
                    💾 Download Backup Codes
                  </button>
                </div>
              )}

              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={() => {
                    setSetupStep('status');
                    setSuccess('');
                  }}
                  className="btn btn-primary"
                >
                  Continue to Security Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}