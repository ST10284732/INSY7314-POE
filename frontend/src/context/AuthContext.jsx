import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // Check localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
      // Decode user info from token if needed
      try {
        const payload = JSON.parse(atob(savedToken.split('.')[1]));
        setUser({ userId: payload.userId, username: payload.username });
      } catch (err) {
        console.error('Invalid token format');
        logout();
      }
    }
  }, []);

  // Login method (save token & set auth state)
  const login = (newToken) => {
    if (!newToken || typeof newToken !== 'string') {
      console.error('Invalid token provided to login function:', newToken);
      return;
    }
    
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setIsAuthenticated(true);
    
    // Decode and set user info
    try {
      if (newToken.split('.').length !== 3) {
        throw new Error('JWT must have 3 parts');
      }
      const payload = JSON.parse(atob(newToken.split('.')[1]));
      setUser({ userId: payload.userId, username: payload.username });
    } catch (err) {
      console.error('Invalid token format:', err.message, 'Token:', newToken);
    }
  };

  // Logout method
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      token,
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for easy usage
export const useAuth = () => useContext(AuthContext);
