import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import API_CONFIG from '../config/apiConfig.js';
import '../styles/modern-banking.css';

export default function CreatePayment() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const beneficiaryFromState = location.state?.beneficiary;

  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD',
    recipientName: '',
    recipientBank: '',
    recipientAccount: '',
    swiftCode: '',
    provider: 'SWIFT',
    paymentReference: ''
  });

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  
  // Beneficiaries state
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [showBeneficiaryDropdown, setShowBeneficiaryDropdown] = useState(false);

  // Load beneficiaries on mount
  useEffect(() => {
    fetchBeneficiaries();
  }, []);

  // If beneficiary was passed from state, pre-fill the form
  useEffect(() => {
    if (beneficiaryFromState) {
      fillFormFromBeneficiary(beneficiaryFromState);
      setSelectedBeneficiary(beneficiaryFromState);
    }
  }, [beneficiaryFromState]);

  const fetchBeneficiaries = async () => {
    try {
      const res = await fetch(API_CONFIG.getURL('/beneficiaries?limit=100'), {
        headers: {
          ...API_CONFIG.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setBeneficiaries(data.data.beneficiaries);
      }
    } catch (err) {
      console.error('Failed to load beneficiaries');
    }
  };

  const fillFormFromBeneficiary = (ben) => {
    setFormData({
      amount: '',
      currency: ben.currency,
      recipientName: ben.name,
      recipientBank: ben.bankName,
      recipientAccount: ben.accountNumber,
      swiftCode: ben.swiftCode,
      provider: ben.provider,
      paymentReference: ben.defaultReference || ''
    });
  };

  const handleBeneficiarySelect = (ben) => {
    fillFormFromBeneficiary(ben);
    setSelectedBeneficiary(ben);
    setShowBeneficiaryDropdown(false);
    
    // Mark beneficiary as used
    fetch(API_CONFIG.getURL(`/beneficiaries/${ben._id}/favorite`), {
      method: 'PATCH',
      headers: {
        ...API_CONFIG.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    }).catch(() => {}); // Silent fail
  };

  const clearBeneficiary = () => {
    setSelectedBeneficiary(null);
    setFormData({
      amount: '',
      currency: 'USD',
      recipientName: '',
      recipientBank: '',
      recipientAccount: '',
      swiftCode: '',
      provider: 'SWIFT',
      paymentReference: ''
    });
  };

  // Currency options
  const currencies = [
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'ZAR', name: 'South African Rand' },
    { code: 'JPY', name: 'Japanese Yen' },
    { code: 'CAD', name: 'Canadian Dollar' },
    { code: 'AUD', name: 'Australian Dollar' },
    { code: 'CHF', name: 'Swiss Franc' }
  ];

  // Provider options
  const providers = [
    { code: 'SWIFT', name: 'SWIFT Network' },
    { code: 'SEPA', name: 'SEPA Transfer' },
    { code: 'WIRE', name: 'Wire Transfer' },
    { code: 'ACH', name: 'ACH Transfer' },
    { code: 'PAYPAL', name: 'PayPal' },
    { code: 'WISE', name: 'Wise (formerly TransferWise)' }
  ];

  // Real-time validation
  const validateField = (name, value) => {
    const errors = { ...validationErrors };

    switch (name) {
      case 'amount':
        if (!value || isNaN(value)) {
          errors[name] = 'Valid amount is required';
        } else if (parseFloat(value) <= 0) {
          errors[name] = 'Amount must be greater than 0';
        } else if (parseFloat(value) > 1000000) {
          errors[name] = 'Amount cannot exceed 1,000,000';
        } else {
          delete errors[name];
        }
        break;
      
      case 'recipientName':
        if (!value || value.trim().length < 2) {
          errors[name] = 'Recipient name must be at least 2 characters';
        } else if (value.length > 100) {
          errors[name] = 'Recipient name cannot exceed 100 characters';
        } else if (!/^[a-zA-Z\s.'-]+$/.test(value)) {
          errors[name] = 'Only letters, spaces, periods, apostrophes and hyphens allowed';
        } else {
          delete errors[name];
        }
        break;
      
      case 'recipientBank':
        if (!value || value.trim().length < 2) {
          errors[name] = 'Bank name is required';
        } else if (value.length > 100) {
          errors[name] = 'Bank name cannot exceed 100 characters';
        } else {
          delete errors[name];
        }
        break;
      
      case 'recipientAccount':
        if (!value || value.trim().length < 5) {
          errors[name] = 'Valid account number is required (minimum 5 characters)';
        } else if (value.length > 34) {
          errors[name] = 'Account number cannot exceed 34 characters';
        } else if (!/^[A-Z0-9]+$/i.test(value)) {
          errors[name] = 'Only letters and numbers allowed';
        } else {
          delete errors[name];
        }
        break;
      
      case 'swiftCode':
        const swiftRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
        if (!value) {
          errors[name] = 'SWIFT code is required';
        } else if (!swiftRegex.test(value.toUpperCase())) {
          errors[name] = 'Invalid SWIFT code format (8 or 11 characters)';
        } else {
          delete errors[name];
        }
        break;
      
      case 'paymentReference':
        if (!value || value.trim().length < 3) {
          errors[name] = 'Payment reference must be at least 3 characters';
        } else if (value.length > 140) {
          errors[name] = 'Payment reference cannot exceed 140 characters';
        } else {
          delete errors[name];
        }
        break;
      
      default:
        break;
    }

    setValidationErrors(errors);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    validateField(name, value);
    
    // Clear message when user starts typing
    if (message) {
      setMessage('');
      setMessageType('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    Object.keys(formData).forEach(key => {
      validateField(key, formData[key]);
    });

    // Check for validation errors
    if (Object.keys(validationErrors).length > 0) {
      setMessage('Please fix all validation errors before submitting');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('http://localhost:3000/v1/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Payment created successfully! Payment ID: ${data.payment.paymentId}`);
        setMessageType('success');
        
        // Save as beneficiary if checkbox was checked
        if (formData.saveAsBeneficiary && !selectedBeneficiary) {
          try {
            await fetch(API_CONFIG.getURL('/beneficiaries'), {
              method: 'POST',
              headers: {
                ...API_CONFIG.getHeaders(),
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                name: formData.recipientName,
                bankName: formData.recipientBank,
                accountNumber: formData.recipientAccount,
                swiftCode: formData.swiftCode,
                provider: formData.provider,
                currency: formData.currency,
                defaultReference: formData.paymentReference
              })
            });
          } catch (err) {
            console.error('Failed to save beneficiary');
          }
        }
        
        // Mark beneficiary as used if one was selected
        if (selectedBeneficiary) {
          try {
            await fetch(API_CONFIG.getURL(`/beneficiaries/${selectedBeneficiary._id}`), {
              method: 'PATCH',
              headers: {
                ...API_CONFIG.getHeaders(),
                'Authorization': `Bearer ${token}`
              }
            });
          } catch (err) {
            console.error('Failed to update beneficiary usage');
          }
        }
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else {
        setMessage(data.message || 'Failed to create payment');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Payment creation error:', error);
      setMessage('Unable to connect to server. Please check your connection.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="card" style={{ maxWidth: '600px', width: '100%' }}>
        <div className="card-header text-center">
          <h2 style={{ margin: 0, color: 'var(--primary-blue)' }}>
            Create International Payment
          </h2>
          <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: 'var(--gray-600)' }}>
            Send money securely across borders
          </p>
        </div>

        <div className="card-body">
          {message && (
            <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Beneficiary Selection */}
            <div className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                <label className="form-label">Quick Select from Beneficiaries</label>
                <Link to="/beneficiaries" style={{ fontSize: '12px', color: 'var(--primary-blue)' }}>
                  Manage Beneficiaries →
                </Link>
              </div>
              
              {selectedBeneficiary ? (
                <div style={{
                  padding: 'var(--space-4)',
                  background: 'var(--bg-accent)',
                  border: '2px solid var(--primary-blue)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 'var(--font-medium)', color: 'var(--primary-blue)' }}>
                      ✓ Using beneficiary: {selectedBeneficiary.nickname || selectedBeneficiary.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {selectedBeneficiary.bankName} • {selectedBeneficiary.accountNumber}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearBeneficiary}
                    className="btn btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    Clear
                  </button>
                </div>
              ) : beneficiaries.length > 0 ? (
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setShowBeneficiaryDropdown(!showBeneficiaryDropdown)}
                    className="form-input"
                    style={{ 
                      width: '100%', 
                      textAlign: 'left', 
                      cursor: 'pointer',
                      background: 'white',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span style={{ color: 'var(--text-secondary)' }}>Select a saved beneficiary...</span>
                    <span>{showBeneficiaryDropdown ? '▲' : '▼'}</span>
                  </button>
                  
                  {showBeneficiaryDropdown && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      maxHeight: '300px',
                      overflow: 'auto',
                      background: 'white',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-lg)',
                      zIndex: 10,
                      marginTop: '4px'
                    }}>
                      {beneficiaries.map((ben) => (
                        <button
                          key={ben._id}
                          type="button"
                          onClick={() => handleBeneficiarySelect(ben)}
                          style={{
                            width: '100%',
                            padding: 'var(--space-3)',
                            border: 'none',
                            borderBottom: '1px solid var(--border-light)',
                            background: 'white',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.background = 'var(--bg-accent)'}
                          onMouseLeave={(e) => e.target.style.background = 'white'}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {ben.isFavorite && <span style={{ color: '#ffc107' }}><i className="fas fa-star"></i></span>}
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 'var(--font-medium)' }}>
                                {ben.nickname || ben.name}
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                {ben.bankName} • {ben.accountNumber}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ 
                  padding: 'var(--space-4)', 
                  background: 'var(--bg-secondary)', 
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  fontSize: '14px'
                }}>
                  No saved beneficiaries. <Link to="/beneficiaries" style={{ color: 'var(--primary-blue)' }}>Add one now</Link>
                </div>
              )}
            </div>

            {/* Amount and Currency */}
            <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
              <div className="form-group" style={{ flex: 2, margin: 0 }}>
                <label className="form-label" htmlFor="amount">Amount *</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  className={`form-input ${validationErrors.amount ? 'error' : formData.amount && !validationErrors.amount ? 'success' : ''}`}
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={handleChange}
                  min="0.01"
                  max="1000000"
                  step="0.01"
                  required
                />
                {validationErrors.amount && (
                  <div style={{ color: 'var(--secondary-red)', fontSize: '12px', marginTop: '4px' }}>
                    {validationErrors.amount}
                  </div>
                )}
              </div>

              <div className="form-group" style={{ flex: 1, margin: 0 }}>
                <label className="form-label" htmlFor="currency">Currency *</label>
                <select
                  id="currency"
                  name="currency"
                  className="form-input"
                  value={formData.currency}
                  onChange={handleChange}
                  required
                >
                  {currencies.map(curr => (
                    <option key={curr.code} value={curr.code}>
                      {curr.code} - {curr.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Recipient Details */}
            <div className="form-group">
              <label className="form-label" htmlFor="recipientName">Recipient Name *</label>
              <input
                type="text"
                id="recipientName"
                name="recipientName"
                className={`form-input ${validationErrors.recipientName ? 'error' : formData.recipientName && !validationErrors.recipientName ? 'success' : ''}`}
                placeholder="Enter recipient's full name"
                value={formData.recipientName}
                onChange={handleChange}
                maxLength="100"
                required
              />
              {validationErrors.recipientName && (
                <div style={{ color: 'var(--secondary-red)', fontSize: '12px', marginTop: '4px' }}>
                  {validationErrors.recipientName}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="recipientBank">Recipient Bank *</label>
              <input
                type="text"
                id="recipientBank"
                name="recipientBank"
                className={`form-input ${validationErrors.recipientBank ? 'error' : formData.recipientBank && !validationErrors.recipientBank ? 'success' : ''}`}
                placeholder="Enter bank name"
                value={formData.recipientBank}
                onChange={handleChange}
                maxLength="100"
                required
              />
              {validationErrors.recipientBank && (
                <div style={{ color: 'var(--secondary-red)', fontSize: '12px', marginTop: '4px' }}>
                  {validationErrors.recipientBank}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
              <div className="form-group" style={{ flex: 2, margin: 0 }}>
                <label className="form-label" htmlFor="recipientAccount">Account Number *</label>
                <input
                  type="text"
                  id="recipientAccount"
                  name="recipientAccount"
                  className={`form-input ${validationErrors.recipientAccount ? 'error' : formData.recipientAccount && !validationErrors.recipientAccount ? 'success' : ''}`}
                  placeholder="Enter account number or IBAN"
                  value={formData.recipientAccount}
                  onChange={handleChange}
                  maxLength="34"
                  required
                />
                {validationErrors.recipientAccount && (
                  <div style={{ color: 'var(--secondary-red)', fontSize: '12px', marginTop: '4px' }}>
                    {validationErrors.recipientAccount}
                  </div>
                )}
              </div>

              <div className="form-group" style={{ flex: 1, margin: 0 }}>
                <label className="form-label" htmlFor="swiftCode">SWIFT Code *</label>
                <input
                  type="text"
                  id="swiftCode"
                  name="swiftCode"
                  className={`form-input ${validationErrors.swiftCode ? 'error' : formData.swiftCode && !validationErrors.swiftCode ? 'success' : ''}`}
                  placeholder="e.g., ABCDUS33"
                  value={formData.swiftCode}
                  onChange={handleChange}
                  maxLength="11"
                  style={{ textTransform: 'uppercase' }}
                  required
                />
                {validationErrors.swiftCode && (
                  <div style={{ color: 'var(--secondary-red)', fontSize: '12px', marginTop: '4px' }}>
                    {validationErrors.swiftCode}
                  </div>
                )}
              </div>
            </div>

            {/* Provider */}
            <div className="form-group">
              <label className="form-label" htmlFor="provider">Payment Provider *</label>
              <select
                id="provider"
                name="provider"
                className="form-input"
                value={formData.provider}
                onChange={handleChange}
                required
              >
                {providers.map(prov => (
                  <option key={prov.code} value={prov.code}>
                    {prov.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Reference */}
            <div className="form-group">
              <label className="form-label" htmlFor="paymentReference">Payment Reference *</label>
              <textarea
                id="paymentReference"
                name="paymentReference"
                className={`form-input ${validationErrors.paymentReference ? 'error' : formData.paymentReference && !validationErrors.paymentReference ? 'success' : ''}`}
                placeholder="Enter purpose of payment or reference"
                value={formData.paymentReference}
                onChange={handleChange}
                maxLength="140"
                rows="3"
                required
              />
              {validationErrors.paymentReference && (
                <div style={{ color: 'var(--secondary-red)', fontSize: '12px', marginTop: '4px' }}>
                  {validationErrors.paymentReference}
                </div>
              )}
              <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '4px' }}>
                {formData.paymentReference.length}/140 characters
              </div>
            </div>

            {/* Save as Beneficiary Option */}
            {!selectedBeneficiary && formData.recipientName && formData.recipientAccount && (
              <div className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.saveAsBeneficiary || false}
                    onChange={(e) => setFormData({ ...formData, saveAsBeneficiary: e.target.checked })}
                  />
                  <span><i className="fas fa-save"></i> Save this recipient as a beneficiary for future payments</span>
                </label>
              </div>
            )}

            {/* Security Notice */}
            <div style={{ 
              marginBottom: 'var(--space-5)', 
              padding: 'var(--space-4)', 
              background: 'var(--bg-accent)', 
              borderRadius: 'var(--radius-md)',
              fontSize: '12px',
              color: 'var(--gray-600)'
            }}>
              <strong>Security Notice:</strong> All payments are processed securely and monitored for fraud. 
              Large transactions may require additional verification.
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-full"
              disabled={isLoading || Object.keys(validationErrors).length > 0}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Processing Payment...
                </>
              ) : (
                'Create Payment'
              )}
            </button>
          </form>
        </div>

        <div className="card-footer text-center">
          <button 
            type="button" 
            className="btn-link" 
            onClick={() => navigate('/dashboard')}
            style={{ textDecoration: 'none' }}
          >
            <i className="fas fa-arrow-left"></i> Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
