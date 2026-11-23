import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { superAdmin } from '../api.js';

// ─── Shared card wrapper ──────────────────────────────────────────────────────
function Card({ children }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f6f6',
        padding: '24px',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          border: '1px solid #e0eaed',
          padding: '40px',
          maxWidth: '480px',
          width: '100%',
          textAlign: 'center',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function LoginLink() {
  return (
    <p style={{ marginTop: '24px', fontSize: '14px', color: '#688097' }}>
      <Link
        to="/login"
        style={{ color: '#4f46e5', fontWeight: '700', textDecoration: 'none' }}
      >
        ← Back to Login
      </Link>
    </p>
  );
}

// ─── Status screens ───────────────────────────────────────────────────────────
function InvalidScreen() {
  return (
    <Card>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔗</div>
      <h2 style={{ color: '#153e67', marginBottom: '8px' }}>Invalid Link</h2>
      <p style={{ color: '#688097', margin: '0 0 8px' }}>
        This invitation link is invalid or has already been used.
      </p>
      <LoginLink />
    </Card>
  );
}

function ExpiredScreen() {
  return (
    <Card>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏰</div>
      <h2 style={{ color: '#153e67', marginBottom: '8px' }}>Invitation Expired</h2>
      <p style={{ color: '#688097', margin: '0 0 8px' }}>
        This invitation has expired. Please ask your administrator for a new one.
      </p>
      <LoginLink />
    </Card>
  );
}

function RevokedScreen() {
  return (
    <Card>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚫</div>
      <h2 style={{ color: '#153e67', marginBottom: '8px' }}>Invitation Revoked</h2>
      <p style={{ color: '#688097', margin: '0 0 8px' }}>
        This invitation has been revoked. Please contact your administrator.
      </p>
      <LoginLink />
    </Card>
  );
}

function AlreadyAcceptedScreen() {
  return (
    <Card>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
      <h2 style={{ color: '#153e67', marginBottom: '8px' }}>Already Accepted</h2>
      <p style={{ color: '#688097', margin: '0 0 8px' }}>
        This invitation has already been used to create an account.
      </p>
      <LoginLink />
    </Card>
  );
}

function NetworkErrorScreen() {
  return (
    <Card>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
      <h2 style={{ color: '#153e67', marginBottom: '8px' }}>Network Error</h2>
      <p style={{ color: '#688097', margin: '0 0 8px' }}>
        Could not connect to the server. Please check your connection and try again.
      </p>
      <LoginLink />
    </Card>
  );
}

function SuccessScreen() {
  return (
    <Card>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
      <h2 style={{ color: '#153e67', marginBottom: '8px' }}>Account Activated!</h2>
      <p style={{ color: '#688097', margin: '0 0 8px' }}>
        Account activated! You can now log in.
      </p>
      <LoginLink />
    </Card>
  );
}

// ─── Activation form ─────────────────────────────────────────────────────────
function ActivationForm({ token, invitationName, invitationEmail }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (success) {
    return <SuccessScreen />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setApiError('');

    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await superAdmin.acceptInvitation(token, password);
      setSuccess(true);
    } catch (err) {
      setApiError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid #dce8ed',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const readOnlyStyle = {
    ...inputStyle,
    background: '#f9fbfc',
    color: '#688097',
    cursor: 'default',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: '700',
    color: '#688097',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px',
    textAlign: 'left',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f6f6',
        padding: '24px',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          border: '1px solid #e0eaed',
          padding: '40px',
          maxWidth: '480px',
          width: '100%',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎓</div>
          <h2 style={{ color: '#153e67', margin: '0 0 8px', fontSize: '24px', fontWeight: '900' }}>
            Activate Your Account
          </h2>
          <p style={{ color: '#688097', margin: 0, fontSize: '14px' }}>
            Set a password to complete your teacher account setup.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
          {/* Name (read-only) */}
          <div>
            <label style={labelStyle}>Full Name</label>
            <input
              type="text"
              value={invitationName}
              readOnly
              aria-label="Full name"
              style={readOnlyStyle}
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label style={labelStyle}>Email Address</label>
            <input
              type="email"
              value={invitationEmail}
              readOnly
              aria-label="Email address"
              style={readOnlyStyle}
            />
          </div>

          {/* Password */}
          <div>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setValidationError(''); }}
                placeholder="Create a password"
                aria-label="Password"
                style={{ ...inputStyle, paddingRight: '48px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  padding: '4px',
                  color: '#688097',
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#9ca3af' }}>
              Minimum 8 characters
            </p>
          </div>

          {/* Confirm password */}
          <div>
            <label style={labelStyle}>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setValidationError(''); }}
                placeholder="Confirm your password"
                aria-label="Confirm password"
                style={{ ...inputStyle, paddingRight: '48px' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  padding: '4px',
                  color: '#688097',
                }}
              >
                {showConfirm ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Validation / API errors */}
          {validationError && (
            <p
              role="alert"
              style={{
                margin: 0,
                padding: '12px 16px',
                background: '#fee2e2',
                color: '#991b1b',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
              }}
            >
              {validationError}
            </p>
          )}
          {apiError && (
            <p
              role="alert"
              style={{
                margin: 0,
                padding: '12px 16px',
                background: '#fee2e2',
                color: '#991b1b',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
              }}
            >
              {apiError}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '14px 24px',
              borderRadius: '10px',
              background: submitting ? '#a5b4fc' : '#4f46e5',
              color: 'white',
              border: 'none',
              fontWeight: '700',
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontSize: '15px',
              transition: '0.2s',
            }}
          >
            {submitting ? 'Activating…' : 'Activate Account'}
          </button>
        </form>

        <LoginLink />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [state, setState] = useState('loading'); // loading | form | expired | revoked | used | invalid | network_error
  const [invitationEmail, setInvitationEmail] = useState('');
  const [invitationName, setInvitationName] = useState('');

  useEffect(() => {
    if (!token) {
      setState('invalid');
      return;
    }

    superAdmin
      .verifyInvitation(token)
      .then((data) => {
        if (data.valid) {
          setInvitationEmail(data.email || '');
          setInvitationName(data.name || '');
          setState('form');
        } else if (data.reason === 'expired') {
          setState('expired');
        } else if (data.reason === 'revoked') {
          setState('revoked');
        } else if (data.reason === 'used') {
          setState('used');
        } else {
          setState('invalid');
        }
      })
      .catch(() => {
        setState('network_error');
      });
  }, [token]);

  if (!token || state === 'invalid') return <InvalidScreen />;
  if (state === 'loading') {
    return (
      <Card>
        <div style={{ fontSize: '32px', marginBottom: '16px' }}>⟳</div>
        <p style={{ color: '#688097' }}>Verifying invitation…</p>
      </Card>
    );
  }
  if (state === 'expired') return <ExpiredScreen />;
  if (state === 'revoked') return <RevokedScreen />;
  if (state === 'used') return <AlreadyAcceptedScreen />;
  if (state === 'network_error') return <NetworkErrorScreen />;

  return (
    <ActivationForm
      token={token}
      invitationName={invitationName}
      invitationEmail={invitationEmail}
    />
  );
}
