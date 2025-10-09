// import our singleton for axios
import axios from '../interfaces/axiosInstance.js'

// Authentication APIs
export const registerUser = (userData) => axios.post('/user/register', userData);
export const loginUser = (credentials) => axios.post('/user/login', credentials);
export const logoutUser = () => axios.post('/user/logout');

// Payment APIs
export const createPayment = (paymentData) => axios.post('/payments', paymentData);
export const getUserPayments = (page = 1, limit = 10) => axios.get(`/payments?page=${page}&limit=${limit}`);
export const getPaymentStats = () => axios.get('/payments/stats');

// MFA APIs
export const getMFAStatus = () => axios.get('/mfa/status');
export const generateMFASetup = () => axios.post('/mfa/setup/generate');
export const verifyMFASetup = (token) => axios.post('/mfa/setup/verify', { token });
export const disableMFA = (password) => axios.post('/mfa/disable', { password });
export const loginWithMFA = (credentials) => axios.post('/mfa/login', credentials);

// Legacy book APIs (if still needed)
export const getAllBooks = () => axios.get('/books');
export const getBookById = (id) => axios.get(`/books/${id}`);
export const createBook = (bookData) => axios.post('/books', bookData);
export const updateBook = (id, bookData) => axios.put(`/books/${id}`, bookData);
export const deleteBook = (id) => axios.delete(`/books/${id}`);

// Default export with all functions
const apiService = {
  // Auth
  registerUser,
  loginUser,
  logoutUser,
  
  // Payments
  createPayment,
  getUserPayments,
  getPaymentStats,
  
  // MFA
  getMFAStatus,
  generateMFASetup,
  verifyMFASetup,
  disableMFA,
  loginWithMFA,
  
  // Legacy
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook
};

export default apiService;
