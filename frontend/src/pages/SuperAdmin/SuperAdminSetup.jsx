import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, superAdmin } from '../../api.js';
import '../../styles/login.css';

export default function SuperAdminSetup() {
  const navigate = useNavigate();
  const [setupRequired, setSetupRequired] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });

  // Check setup status on mount
  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      setCheckingStatus(true);
      const response = await superAdmin.checkSetupStatus();
      // If we get here, setup is complete
      setSetupRequired(false);
    } catch (err) {
      // Setup not complete or error getting status
      setSetupRequired(true);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Validate email format
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate password strength (at least 8 chars, 1 uppercase, 1 number, 1 special char)
  const isValidPassword = (password) => {
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  // Validate setup form
  const validateSetupForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!isValidEmail(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!isValidPassword(formData.password)) {
      setError('Password must be at least 8 characters with uppercase letter, number, and special character');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  // Validate login form
  const validateLoginForm = () => {
    if (!isValidEmail(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    return true;
  };

  const handleSetup = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateSetupForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await superAdmin.setup(formData.email, formData.password, formData.name);
      
      // Store token using standard auth storage so App.jsx can find it
      if (response.access_token) {
        // Use standard auth storage so App.jsx recognizes the user
        localStorage.setItem('gamified_token', response.access_token);
      }

      // Force page reload to let App.jsx pick up the new token and load user
      window.location.href = '/admin';
    } catch (err) {
      setError(err.message || 'Setup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateLoginForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await superAdmin.login(formData.email, formData.password);

      // Store token using standard auth storage
      if (response.access_token) {
        localStorage.setItem('gamified_token', response.access_token);
      }

      // Force page reload to let App.jsx pick up the new token and load user
      window.location.href = '/admin';
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="login">
        <div className="login-card">
          <p style={{ textAlign: 'center', color: 'var(--ink-soft)' }}>Checking system status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login">
      <div className="login-card">
        <h1 className="login-title">Gamifi<span>ED</span></h1>
        <p className="lede">Administrator Portal</p>

        {error && (
          <div
            style={{
              color: 'var(--bloom)',
              fontWeight: 700,
              marginBottom: '15px',
              padding: '0.75rem',
              backgroundColor: '#f8dfe3',
              borderRadius: '6px',
              fontSize: '0.95rem',
            }}
          >
            {error}
          </div>
        )}

        {setupRequired ? (
          <form onSubmit={handleSetup}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Initial Setup</h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--ink-soft)', marginBottom: '1rem' }}>
              Create your Super Admin account to initialize the platform
            </p>

            <label>
              Name
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your full name"
                required
              />
            </label>

            <label>
              Email
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@example.com"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
              <span
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--ink-soft)',
                  marginTop: '0.3rem',
                }}
              >
                Must contain uppercase, number, and special character (@$!%*?&)
              </span>
            </label>

            <label>
              Confirm Password
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </label>

            <button
              className="btn primary"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Setting up...' : 'Complete Setup'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Super Admin Login</h2>

            <label>
              Email
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@example.com"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </label>

            <button
              className="btn primary"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
