import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Link, useNavigate } from 'react-router-dom';
import API_CONFIG from '../config/apiConfig.js';
import '../styles/modern-banking.css';

export default function Beneficiaries() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBeneficiary, setEditingBeneficiary] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    bankName: '',
    accountNumber: '',
    swiftCode: '',
    provider: 'SWIFT',
    currency: 'ZAR',
    defaultReference: '',
    isFavorite: false
  });

  useEffect(() => {
    fetchBeneficiaries();
  }, [searchTerm, showFavoritesOnly]);

  const fetchBeneficiaries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (showFavoritesOnly) params.append('favorites', 'true');

      const res = await fetch(API_CONFIG.getURL(`/beneficiaries?${params.toString()}`), {
        headers: {
          ...API_CONFIG.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setBeneficiaries(data.data.beneficiaries);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to load beneficiaries');
      }
    } catch (err) {
      setError('Failed to load beneficiaries');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const url = editingBeneficiary
        ? API_CONFIG.getURL(`/beneficiaries/${editingBeneficiary._id}`)
        : API_CONFIG.getURL('/beneficiaries');

      const res = await fetch(url, {
        method: editingBeneficiary ? 'PATCH' : 'POST',
        headers: {
          ...API_CONFIG.getHeaders(),
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setShowModal(false);
        resetForm();
        fetchBeneficiaries();
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to save beneficiary');
      }
    } catch (err) {
      setError('Failed to save beneficiary');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this beneficiary?')) {
      return;
    }

    try {
      const res = await fetch(API_CONFIG.getURL(`/beneficiaries/${id}`), {
        method: 'DELETE',
        headers: {
          ...API_CONFIG.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        fetchBeneficiaries();
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to delete beneficiary');
      }
    } catch (err) {
      setError('Failed to delete beneficiary');
    }
  };

  const handleToggleFavorite = async (id) => {
    try {
      const res = await fetch(API_CONFIG.getURL(`/beneficiaries/${id}/favorite`), {
        method: 'PATCH',
        headers: {
          ...API_CONFIG.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        fetchBeneficiaries();
      }
    } catch (err) {
      console.error('Failed to toggle favorite');
    }
  };

  const openEditModal = (beneficiary) => {
    setEditingBeneficiary(beneficiary);
    setFormData({
      name: beneficiary.name,
      nickname: beneficiary.nickname || '',
      bankName: beneficiary.bankName,
      accountNumber: beneficiary.accountNumber,
      swiftCode: beneficiary.swiftCode,
      provider: beneficiary.provider,
      currency: beneficiary.currency,
      defaultReference: beneficiary.defaultReference || '',
      isFavorite: beneficiary.isFavorite
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      nickname: '',
      bankName: '',
      accountNumber: '',
      swiftCode: '',
      provider: 'SWIFT',
      currency: 'ZAR',
      defaultReference: '',
      isFavorite: false
    });
    setEditingBeneficiary(null);
  };

  const handlePayBeneficiary = (beneficiary) => {
    // Navigate to payment form with beneficiary data
    navigate('/create-payment', { state: { beneficiary } });
  };

  return (
    <div style={{ background: 'var(--bg-secondary)', minHeight: '100vh', padding: 'var(--space-4)' }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <Link to="/dashboard" className="btn btn-link" style={{ marginBottom: 'var(--space-4)', display: 'inline-block' }}>
            <i className="fas fa-arrow-left"></i> Back to Dashboard
          </Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: 0, color: 'var(--text-primary)' }}>
                <i className="fas fa-address-book"></i> Beneficiaries
              </h1>
              <p style={{ margin: '8px 0 0 0', color: 'var(--text-secondary)' }}>
                Manage your saved payment recipients
              </p>
            </div>
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="btn btn-primary"
            >
              + Add Beneficiary
            </button>
          </div>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-6)' }}>{error}</div>}

        {/* Search and Filters */}
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="card-body">
            <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search by name, bank, or account..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
                style={{ flex: 1, minWidth: '250px' }}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showFavoritesOnly}
                  onChange={(e) => setShowFavoritesOnly(e.target.checked)}
                />
                <span>Favorites only</span>
              </label>
            </div>
          </div>
        </div>

        {/* Beneficiaries List */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0 }}>Saved Beneficiaries ({beneficiaries.length})</h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {loading ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Loading beneficiaries...
              </div>
            ) : beneficiaries.length === 0 ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                {searchTerm || showFavoritesOnly ? 'No beneficiaries found matching your criteria' : 'No beneficiaries yet. Add one to get started!'}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-light)', background: 'var(--bg-secondary)' }}>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontSize: '14px', fontWeight: 'var(--font-medium)' }}>Name</th>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontSize: '14px', fontWeight: 'var(--font-medium)' }}>Bank</th>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontSize: '14px', fontWeight: 'var(--font-medium)' }}>Account</th>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontSize: '14px', fontWeight: 'var(--font-medium)' }}>SWIFT</th>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'center', fontSize: '14px', fontWeight: 'var(--font-medium)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {beneficiaries.map((ben) => (
                      <tr key={ben._id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: 'var(--space-4)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              onClick={() => handleToggleFavorite(ben._id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: ben.isFavorite ? '#ffc107' : '#ccc' }}
                              title={ben.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                            >
                              <i className={ben.isFavorite ? 'fas fa-star' : 'far fa-star'}></i>
                            </button>
                            <div>
                              <div style={{ fontWeight: 'var(--font-medium)' }}>{ben.name}</div>
                              {ben.nickname && <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>"{ben.nickname}"</div>}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: 'var(--space-4)', color: 'var(--text-secondary)' }}>{ben.bankName}</td>
                        <td style={{ padding: 'var(--space-4)', fontFamily: 'monospace' }}>{ben.accountNumber}</td>
                        <td style={{ padding: 'var(--space-4)', fontFamily: 'monospace', fontSize: '12px' }}>{ben.swiftCode}</td>
                        <td style={{ padding: 'var(--space-4)' }}>
                          <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button onClick={() => handlePayBeneficiary(ben)} className="btn btn-primary" style={{ fontSize: '12px', padding: '6px 12px' }}>
                              Pay
                            </button>
                            <button onClick={() => openEditModal(ben)} className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}>
                              Edit
                            </button>
                            <button onClick={() => handleDelete(ben._id)} className="btn btn-danger" style={{ fontSize: '12px', padding: '6px 12px' }}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 'var(--space-4)'
          }}>
            <div className="card" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
              <div className="card-header">
                <h3 style={{ margin: 0 }}>{editingBeneficiary ? 'Edit Beneficiary' : 'Add New Beneficiary'}</h3>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                    <div>
                      <label className="form-label">Full Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="form-input"
                        required
                        maxLength="100"
                      />
                    </div>

                    <div>
                      <label className="form-label">Nickname (optional)</label>
                      <input
                        type="text"
                        value={formData.nickname}
                        onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                        className="form-input"
                        placeholder="e.g., Mom, Best Friend"
                        maxLength="50"
                      />
                    </div>

                    <div>
                      <label className="form-label">Bank Name *</label>
                      <input
                        type="text"
                        value={formData.bankName}
                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                        className="form-input"
                        required
                        maxLength="100"
                      />
                    </div>

                    <div>
                      <label className="form-label">Account Number *</label>
                      <input
                        type="text"
                        value={formData.accountNumber}
                        onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                        className="form-input"
                        required
                        maxLength="34"
                      />
                    </div>

                    <div>
                      <label className="form-label">SWIFT Code *</label>
                      <input
                        type="text"
                        value={formData.swiftCode}
                        onChange={(e) => setFormData({ ...formData, swiftCode: e.target.value.toUpperCase() })}
                        className="form-input"
                        required
                        placeholder="e.g., ABNANL2A"
                        pattern="[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?"
                      />
                    </div>

                    <div>
                      <label className="form-label">Payment Provider *</label>
                      <select
                        value={formData.provider}
                        onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                        className="form-input"
                        required
                      >
                        <option value="SWIFT">SWIFT</option>
                        <option value="SEPA">SEPA</option>
                        <option value="ACH">ACH</option>
                        <option value="WIRE">WIRE</option>
                        <option value="PAYPAL">PayPal</option>
                        <option value="WISE">Wise</option>
                      </select>
                    </div>

                    <div>
                      <label className="form-label">Currency *</label>
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        className="form-input"
                        required
                      >
                        <option value="ZAR">ZAR - South African Rand</option>
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="JPY">JPY - Japanese Yen</option>
                        <option value="CAD">CAD - Canadian Dollar</option>
                        <option value="AUD">AUD - Australian Dollar</option>
                        <option value="CHF">CHF - Swiss Franc</option>
                      </select>
                    </div>

                    <div>
                      <label className="form-label">Default Reference (optional)</label>
                      <input
                        type="text"
                        value={formData.defaultReference}
                        onChange={(e) => setFormData({ ...formData, defaultReference: e.target.value })}
                        className="form-input"
                        placeholder="e.g., Monthly rent"
                        maxLength="140"
                      />
                    </div>

                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formData.isFavorite}
                          onChange={(e) => setFormData({ ...formData, isFavorite: e.target.checked })}
                        />
                        <span>Mark as favorite</span>
                      </label>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => { setShowModal(false); resetForm(); }}
                        className="btn btn-secondary"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary">
                        {editingBeneficiary ? 'Update' : 'Add'} Beneficiary
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
