import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function SessionIndicator() {
  const { isAuthenticated } = useAuth();
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [isAutoLogoutEnabled, setIsAutoLogoutEnabled] = useState(false);

  // Update activity timestamp
  const updateActivity = () => {
    setLastActivity(Date.now());
  };

  // Check settings and monitor activity
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const checkSettings = () => {
      const savedSettings = localStorage.getItem('bankSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setIsAutoLogoutEnabled(settings.autoLogout !== false);
      }
    };

    checkSettings();

    // Activity events to monitor
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    
    // Add event listeners for activity
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    const interval = setInterval(checkSettings, 1000);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  // Calculate time remaining
  const getMinutesRemaining = () => {
    const elapsed = Date.now() - lastActivity;
    const remaining = Math.max(0, (15 * 60 * 1000) - elapsed);
    return Math.ceil(remaining / (60 * 1000));
  };

  // Don't render if not authenticated or auto-logout is disabled
  if (!isAuthenticated || !isAutoLogoutEnabled) {
    return null;
  }

  const minutesRemaining = getMinutesRemaining();
  const isWarning = minutesRemaining <= 3; // Show warning when 3 minutes or less

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: isWarning ? 'var(--secondary-red)' : 'var(--bg-primary)',
      border: isWarning ? '1px solid var(--secondary-red)' : '1px solid var(--border-light)',
      borderRadius: 'var(--radius-md)',
      padding: '12px 16px',
      fontSize: '12px',
      color: isWarning ? 'white' : 'var(--gray-600)',
      boxShadow: 'var(--shadow-sm)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      animation: isWarning ? 'urgentPulse 1s infinite' : 'none'
    }}>
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: isWarning ? 'white' : 'var(--secondary-green)',
        animation: isWarning ? 'none' : 'pulse 2s infinite'
      }}></div>
      <span>
        {isWarning ? `⚠️ ${minutesRemaining} min remaining` : 'Auto-logout: Active'}
      </span>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes urgentPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}