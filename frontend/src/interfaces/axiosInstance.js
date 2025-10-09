// call in axios to handle our api requests we want to make
import axios from 'axios';

// Determine protocol and port based on environment
const isProduction = process.env.NODE_ENV === 'production';
const protocol = window.location.protocol; // Use same protocol as frontend
const baseURL = isProduction 
  ? `${protocol}//localhost:3443/v1` // HTTPS in production
  : `${protocol}//localhost:3000/v1`; // HTTP in development

const axiosInstance = axios.create({
    // Dynamic BASE URL for HTTP/HTTPS support
    baseURL,
    // we also tell it that we want to ask the server to respond with JSON, rather than cleartext
    headers: {
        'Content-Type': 'application/json'
    },
});

// Add a request interceptor to include JWT token in all requests
axiosInstance.interceptors.request.use(
    (config) => {
        // Get token from localStorage
        const token = localStorage.getItem('token');
        
        // If token exists, add it to the Authorization header
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle token expiration
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // If we get a 401, the token might be expired
        if (error.response?.status === 401) {
            // Remove invalid token
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // Redirect to login if not already on login/register page
            if (!window.location.pathname.includes('/login') && 
                !window.location.pathname.includes('/register') &&
                window.location.pathname !== '/') {
                window.location.href = '/login';
            }
        }
        
        return Promise.reject(error);
    }
);

export default axiosInstance;