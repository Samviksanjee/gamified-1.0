import { useState } from 'react';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import { Phone } from 'lucide-react';
import { api } from '../api';
import '../styles/login.css';

export default function Login({ onAuth }) {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'student', // Always register as student
    phone_number: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  function validatePhone(value) {
    const trimmed = (value || '').trim();
    if (!trimmed) return 'Phone number is required.';
    try {
      if (!isValidPhoneNumber(trimmed, 'IN')) return 'Enter a valid phone number.';
      return null;
    } catch {
      return 'Enter a valid phone number.';
    }
  }

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isRegister ? api.register : api.login;
      let payload;
      if (isRegister) {
        const phoneValidationError = validatePhone(formData.phone_number);
        if (phoneValidationError) {
          setPhoneError(phoneValidationError);
          setLoading(false);
          return;
        }
        setPhoneError('');
        const normalized = parsePhoneNumber(formData.phone_number.trim(), 'IN').format('E.164');
        payload = {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: formData.role,
          phone_number: normalized,
        };
      } else {
        payload = {
          email: formData.email,
          password: formData.password,
        };
      }

      const response = await endpoint(payload);
      onAuth(response);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <div className="login-card">
        <h1 className="login-title">Gamifi<span>ED</span></h1>
        <p className="lede">Learn through play, grow every day</p>

        {error && <div style={{ color: '#c85a59', fontWeight: 900, marginBottom: '15px' }}>
          {error}
        </div>}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <label>
              Name
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your name"
                required
              />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
          </label>

          {isRegister && (
            <label>
              Phone Number
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0.7rem', top: '50%',
                               transform: 'translateY(-50%)', color: 'var(--muted)',
                               pointerEvents: 'none', display: 'flex' }}>
                  <Phone size={16} />
                </span>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  required
                  aria-describedby="phone-error"
                  style={{ paddingLeft: '2.2rem' }}
                />
              </div>
              {phoneError && (
                <span id="phone-error" role="alert"
                      style={{ color: '#c85a59', fontWeight: 700, fontSize: '12px', marginTop: '2px' }}>
                  {phoneError}
                </span>
              )}
            </label>
          )}

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
            className="btn btn-primary"
            type="submit"
            disabled={loading}
            style={{ width: '100%', marginTop: '15px' }}
          >
            {loading ? 'Loading...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '14px' }}>
          {isRegister ? 'Already have an account? ' : "Don't have an account? "}
          <button
            className="text-btn"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
              setPhoneError('');
            }}
          >
            {isRegister ? 'Sign In' : 'Create one'}
          </button>
        </p>

        {/* Demo Credentials */}
        <div
          style={{
            marginTop: '20px',
            padding: '15px',
            background: '#eef8ff',
            borderRadius: '12px',
            fontSize: '12px',
            color: 'var(--muted)',
          }}
        >
          <strong style={{ color: 'var(--navy)' }}>Demo Credentials:</strong>
          <div style={{ marginTop: '8px' }}>
            Student: student@gamified.local / DemoPass123!
          </div>
          <div>Teacher: teacher@gamified.local / DemoPass123!</div>
        </div>
      </div>
    </div>
  );
}
