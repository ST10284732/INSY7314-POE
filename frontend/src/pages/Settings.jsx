import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/modern-banking.css';

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Settings state with localStorage persistence
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem('bankSettings');
    return savedSettings ? JSON.parse(savedSettings) : {
      darkMode: false,
      notifications: true,
      emailAlerts: true,
      smsAlerts: false,
      biometricLogin: false,
      autoLogout: true,
      currency: 'ZAR',
      language: 'English'
    };
  });

  // Apply dark mode to body
  useEffect(() => {
    if (settings.darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [settings.darkMode]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('bankSettings', JSON.stringify(settings));
  }, [settings]);

  const toggleSetting = (settingKey) => {
    setSettings(prev => ({
      ...prev,
      [settingKey]: !prev[settingKey]
    }));
  };

  const updateSetting = (settingKey, value) => {
    setSettings(prev => ({
      ...prev,
      [settingKey]: value
    }));
  };

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
              ⚙️ Account Settings
            </h1>
            <p style={{ margin: '4px 0 0 0', color: 'var(--gray-600)' }}>
              Manage your banking preferences and security options
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-secondary"
          >
            ← Back to Dashboard
          </button>
        </div>

        <div style={{ display: 'grid', gap: 'var(--space-6)', maxWidth: '800px' }}>
          
          {/* Display & Theme Settings */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>
                🎨 Display & Theme
              </h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                
                {/* Dark Mode Toggle */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--space-4)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-secondary)'
                }}>
                  <div>
                    <div style={{ fontWeight: 'var(--font-medium)', marginBottom: '4px' }}>
                      🌙 Dark Mode
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--gray-600)' }}>
                      {settings.darkMode ? 'Dark theme enabled for low-light viewing' : 'Light theme for standard viewing'}
                    </div>
                  </div>
                  <label style={{ 
                    position: 'relative', 
                    display: 'inline-block', 
                    width: '60px', 
                    height: '32px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={settings.darkMode}
                      onChange={() => toggleSetting('darkMode')}
                      style={{ display: 'none' }}
                    />
                    <span style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: settings.darkMode ? 'var(--primary-blue)' : '#ccc',
                      borderRadius: '16px',
                      transition: 'all 0.3s'
                    }}>
                      <span style={{
                        position: 'absolute',
                        content: '',
                        height: '24px',
                        width: '24px',
                        left: settings.darkMode ? '32px' : '4px',
                        bottom: '4px',
                        background: 'white',
                        borderRadius: '50%',
                        transition: 'all 0.3s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}></span>
                    </span>
                  </label>
                </div>

                {/* Language Setting */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--space-4)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-secondary)'
                }}>
                  <div>
                    <div style={{ fontWeight: 'var(--font-medium)', marginBottom: '4px' }}>
                      🌍 Language
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--gray-600)' }}>
                      Select your preferred language
                    </div>
                  </div>
                  <select
                    value={settings.language}
                    onChange={(e) => updateSetting('language', e.target.value)}
                    className="form-input"
                    style={{ width: '150px' }}
                  >
                    <option value="English">English</option>
                    <option value="Afrikaans">Afrikaans</option>
                    <option value="Zulu">Zulu</option>
                    <option value="Xhosa">Xhosa</option>
                  </select>
                </div>

                {/* Currency Setting */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--space-4)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-secondary)'
                }}>
                  <div>
                    <div style={{ fontWeight: 'var(--font-medium)', marginBottom: '4px' }}>
                      💰 Default Currency
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--gray-600)' }}>
                      Primary currency for display
                    </div>
                  </div>
                  <select
                    value={settings.currency}
                    onChange={(e) => updateSetting('currency', e.target.value)}
                    className="form-input"
                    style={{ width: '150px' }}
                  >
                    <option value="ZAR">ZAR - South African Rand</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>
                🔐 Security & Privacy
              </h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                
                {/* Biometric Login */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--space-4)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-secondary)'
                }}>
                  <div>
                    <div style={{ fontWeight: 'var(--font-medium)', marginBottom: '4px' }}>
                      👆 Biometric Login
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--gray-600)' }}>
                      {settings.biometricLogin ? 'Fingerprint/Face ID enabled' : 'Use password authentication only'}
                    </div>
                  </div>
                  <label style={{ 
                    position: 'relative', 
                    display: 'inline-block', 
                    width: '60px', 
                    height: '32px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={settings.biometricLogin}
                      onChange={() => toggleSetting('biometricLogin')}
                      style={{ display: 'none' }}
                    />
                    <span style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: settings.biometricLogin ? 'var(--secondary-green)' : '#ccc',
                      borderRadius: '16px',
                      transition: 'all 0.3s'
                    }}>
                      <span style={{
                        position: 'absolute',
                        content: '',
                        height: '24px',
                        width: '24px',
                        left: settings.biometricLogin ? '32px' : '4px',
                        bottom: '4px',
                        background: 'white',
                        borderRadius: '50%',
                        transition: 'all 0.3s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}></span>
                    </span>
                  </label>
                </div>

                {/* Auto Logout */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--space-4)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-secondary)'
                }}>
                  <div>
                    <div style={{ fontWeight: 'var(--font-medium)', marginBottom: '4px' }}>
                      ⏰ Auto Logout
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--gray-600)' }}>
                      {settings.autoLogout ? 'Automatic logout after 15 minutes of inactivity' : 'Stay logged in until manual logout'}
                    </div>
                  </div>
                  <label style={{ 
                    position: 'relative', 
                    display: 'inline-block', 
                    width: '60px', 
                    height: '32px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={settings.autoLogout}
                      onChange={() => toggleSetting('autoLogout')}
                      style={{ display: 'none' }}
                    />
                    <span style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: settings.autoLogout ? 'var(--secondary-orange)' : '#ccc',
                      borderRadius: '16px',
                      transition: 'all 0.3s'
                    }}>
                      <span style={{
                        position: 'absolute',
                        content: '',
                        height: '24px',
                        width: '24px',
                        left: settings.autoLogout ? '32px' : '4px',
                        bottom: '4px',
                        background: 'white',
                        borderRadius: '50%',
                        transition: 'all 0.3s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}></span>
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>
                🔔 Notifications
              </h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                
                {/* Push Notifications */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--space-4)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-secondary)'
                }}>
                  <div>
                    <div style={{ fontWeight: 'var(--font-medium)', marginBottom: '4px' }}>
                      📱 Push Notifications
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--gray-600)' }}>
                      Receive real-time alerts for account activity
                    </div>
                  </div>
                  <label style={{ 
                    position: 'relative', 
                    display: 'inline-block', 
                    width: '60px', 
                    height: '32px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={settings.notifications}
                      onChange={() => toggleSetting('notifications')}
                      style={{ display: 'none' }}
                    />
                    <span style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: settings.notifications ? 'var(--primary-blue)' : '#ccc',
                      borderRadius: '16px',
                      transition: 'all 0.3s'
                    }}>
                      <span style={{
                        position: 'absolute',
                        content: '',
                        height: '24px',
                        width: '24px',
                        left: settings.notifications ? '32px' : '4px',
                        bottom: '4px',
                        background: 'white',
                        borderRadius: '50%',
                        transition: 'all 0.3s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}></span>
                    </span>
                  </label>
                </div>

                {/* Email Alerts */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--space-4)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-secondary)'
                }}>
                  <div>
                    <div style={{ fontWeight: 'var(--font-medium)', marginBottom: '4px' }}>
                      📧 Email Alerts
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--gray-600)' }}>
                      Receive transaction summaries via email
                    </div>
                  </div>
                  <label style={{ 
                    position: 'relative', 
                    display: 'inline-block', 
                    width: '60px', 
                    height: '32px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={settings.emailAlerts}
                      onChange={() => toggleSetting('emailAlerts')}
                      style={{ display: 'none' }}
                    />
                    <span style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: settings.emailAlerts ? 'var(--accent-purple)' : '#ccc',
                      borderRadius: '16px',
                      transition: 'all 0.3s'
                    }}>
                      <span style={{
                        position: 'absolute',
                        content: '',
                        height: '24px',
                        width: '24px',
                        left: settings.emailAlerts ? '32px' : '4px',
                        bottom: '4px',
                        background: 'white',
                        borderRadius: '50%',
                        transition: 'all 0.3s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}></span>
                    </span>
                  </label>
                </div>

                {/* SMS Alerts */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--space-4)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-secondary)'
                }}>
                  <div>
                    <div style={{ fontWeight: 'var(--font-medium)', marginBottom: '4px' }}>
                      💬 SMS Alerts
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--gray-600)' }}>
                      Receive text messages for large transactions
                    </div>
                  </div>
                  <label style={{ 
                    position: 'relative', 
                    display: 'inline-block', 
                    width: '60px', 
                    height: '32px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={settings.smsAlerts}
                      onChange={() => toggleSetting('smsAlerts')}
                      style={{ display: 'none' }}
                    />
                    <span style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: settings.smsAlerts ? 'var(--secondary-green)' : '#ccc',
                      borderRadius: '16px',
                      transition: 'all 0.3s'
                    }}>
                      <span style={{
                        position: 'absolute',
                        content: '',
                        height: '24px',
                        width: '24px',
                        left: settings.smsAlerts ? '32px' : '4px',
                        bottom: '4px',
                        background: 'white',
                        borderRadius: '50%',
                        transition: 'all 0.3s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}></span>
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Account Summary */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>
                📊 Settings Summary
              </h3>
            </div>
            <div className="card-body">
              <div style={{
                padding: 'var(--space-4)',
                background: 'linear-gradient(135deg, var(--bg-accent) 0%, #e3f2fd 100%)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)', fontSize: '14px' }}>
                  <div><strong>Theme:</strong> {settings.darkMode ? 'Dark Mode' : 'Light Mode'}</div>
                  <div><strong>Language:</strong> {settings.language}</div>
                  <div><strong>Currency:</strong> {settings.currency}</div>
                  <div><strong>Biometrics:</strong> {settings.biometricLogin ? 'Enabled' : 'Disabled'}</div>
                  <div><strong>Auto Logout:</strong> {settings.autoLogout ? 'Enabled' : 'Disabled'}</div>
                  <div><strong>Notifications:</strong> {settings.notifications ? 'Enabled' : 'Disabled'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}