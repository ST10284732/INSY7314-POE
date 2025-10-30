// API Configuration for secure communication
const API_CONFIG = {
  // Determine the appropriate API base URL
  getBaseURL: () => {
    // Use environment variable if available, otherwise use window location host
    const apiHost = import.meta.env.VITE_API_HOST || window.location.hostname;
    const protocol = window.location.protocol;
    const isProduction = import.meta.env.MODE === 'production';
    
    // Use HTTPS port 3443 for secure connections
    if (protocol === 'https:') {
      return `https://${apiHost}:3443/v1`;
    }
    
    // Fallback to HTTP port 3000
    return `http://${apiHost}:3000/v1`;
  },
  
  // Get full API URL for a specific endpoint
  getURL: (endpoint) => {
    return `${API_CONFIG.getBaseURL()}${endpoint}`;
  },
  
  // Common headers for API requests
  getHeaders: (token = null) => {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    return headers;
  }
};

export default API_CONFIG;