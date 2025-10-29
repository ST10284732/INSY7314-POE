import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Link } from 'react-router-dom';
import API_CONFIG from '../config/apiConfig.js';
import '../styles/modern-banking.css';

export default function ManageEmployees() {
  const { token } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_CONFIG.getURL('/admin/employees'), {
        headers: {
          ...API_CONFIG.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setEmployees(data.data.employees);
      } else {
        setError('Failed to load employees');
      }
    } catch (err) {
      setError('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (employeeId, username) => {
    if (!confirm(`Are you sure you want to delete employee: ${username}?`)) {
      return;
    }

    try {
      const res = await fetch(API_CONFIG.getURL(`/admin/employees/${employeeId}`), {
        method: 'DELETE',
        headers: {
          ...API_CONFIG.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        setSuccess('Employee deleted successfully');
        fetchEmployees();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to delete employee');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      setError('Failed to delete employee');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div style={{ background: 'var(--bg-secondary)', minHeight: '100vh', padding: 'var(--space-4)' }}>
      <div className="container">
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <Link to="/admin/dashboard" className="btn btn-link" style={{ marginBottom: 'var(--space-4)', display: 'inline-block' }}>
            ← Back to Dashboard
          </Link>
          <h1 style={{ margin: 0, color: 'var(--text-primary)' }}>Manage Employees</h1>
          <p style={{ margin: '8px 0 0 0', color: 'var(--text-secondary)' }}>
            View and manage all employees and administrators
          </p>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-6)' }}>{error}</div>}
        {success && <div className="alert alert-success" style={{ marginBottom: 'var(--space-6)' }}>{success}</div>}

        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>All Staff ({employees.length})</h3>
              <Link to="/admin/create-staff">
                <button className="btn btn-primary">+ Create New Staff</button>
              </Link>
            </div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {loading ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Loading...</div>
            ) : employees.length === 0 ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No employees found
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-light)' }}>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'left' }}>Name</th>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'left' }}>Username</th>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'left' }}>Role</th>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'left' }}>Account Number</th>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((employee) => (
                      <tr key={employee._id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: 'var(--space-4)' }}>
                          {employee.firstname} {employee.lastname}
                        </td>
                        <td style={{ padding: 'var(--space-4)' }}>{employee.username}</td>
                        <td style={{ padding: 'var(--space-4)' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '12px',
                            fontWeight: 'var(--font-medium)',
                            background: employee.role === 'Admin' ? 'var(--secondary-red)' : 'var(--secondary-orange)',
                            color: 'white'
                          }}>
                            {employee.role}
                          </span>
                        </td>
                        <td style={{ padding: 'var(--space-4)', fontFamily: 'monospace' }}>
                          {employee.accountNumber}
                        </td>
                        <td style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
                          <button
                            onClick={() => handleDelete(employee._id, employee.username)}
                            className="btn"
                            style={{ 
                              fontSize: '12px',
                              padding: '6px 12px',
                              background: 'var(--secondary-red)',
                              color: 'white',
                              border: 'none'
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
