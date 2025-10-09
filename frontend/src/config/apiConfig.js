// API Configuration for secure communication
const API_CONFIG = {
  // Determine the appropriate API base URL
  getBaseURL: () => {
    const protocol = window.location.protocol;
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction) {
      return `${protocol}//localhost:3443/v1`;
    } else {
      return `${protocol}//localhost:3000/v1`;
    }
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