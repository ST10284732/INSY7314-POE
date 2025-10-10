import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

// Auto logout hook that monitors user activity and logs out after inactivity
export const useAutoLogout = (isEnabled = true, timeoutMinutes = 15) => {
  const { logout, isAuthenticated } = useAuth();
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  // Timeout duration in milliseconds
  const timeoutDuration = timeoutMinutes * 60 * 1000; // 15 minutes
  const warningDuration = timeoutDuration - (2 * 60 * 1000); // 13 minutes (2 min warning)

  // Reset the timeout timer
  const resetTimeout = useCallback(() => {
    if (!isEnabled || !isAuthenticated) return;

    lastActivityRef.current = Date.now();

    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // Set warning timeout (2 minutes before logout)
    warningTimeoutRef.current = setTimeout(() => {
      if (!isEnabled || !isAuthenticated) return;

      const shouldContinue = window.confirm(
        '⚠ Session Timeout Warning\n\n' +
        'You will be automatically logged out in 2 minutes due to inactivity.\n' +
        'Click OK to continue your session, or Cancel to logout now.'
      );

      if (!shouldContinue) {
        handleLogout();
      }
    }, warningDuration);

    // Set main logout timeout
    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, timeoutDuration);
  }, [isEnabled, isAuthenticated, timeoutDuration, warningDuration]);

  // Handle automatic logout
  const handleLogout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // Show logout notification
    alert('⊞ Session Expired\n\nYou have been automatically logged out due to 15 minutes of inactivity.');
    
    logout();
  }, [logout]);

  // Activity event handler
  const handleActivity = useCallback(() => {
    if (isEnabled && isAuthenticated) {
      resetTimeout();
    }
  }, [resetTimeout, isEnabled, isAuthenticated]);

  // Setup activity listeners
  useEffect(() => {
    if (!isEnabled || !isAuthenticated) {
      // Clean up timeouts if disabled or not authenticated
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      return;
    }

    // Activity events to monitor
    const events = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
      'focus'
    ];

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Start the initial timeout
    resetTimeout();

    // Cleanup function
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [isEnabled, isAuthenticated, handleActivity, resetTimeout]);

  // Return utility functions for manual control
  return {
    resetTimeout,
    getTimeRemaining: () => {
      if (!isEnabled || !isAuthenticated) return null;
      const elapsed = Date.now() - lastActivityRef.current;
      const remaining = Math.max(0, timeoutDuration - elapsed);
      return Math.ceil(remaining / (60 * 1000)); // Return minutes remaining
    },
    isEnabled,
    timeoutMinutes
  };
};