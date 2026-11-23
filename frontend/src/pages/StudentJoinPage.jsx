import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';

export default function StudentJoinPage() {
  const [code, setCode] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!code.trim() || code.length !== 6) {
      setError('Join code must be 6 characters');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await api.joinClassroom(code.toUpperCase());
      setSubmitted(true);
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to join classroom');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f2f9f8, #fffaf0)',
      display: 'grid',
      placeItems: 'center',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '700px', width: '100%' }}>
        {!submitted ? (
          <div style={{
            background: 'linear-gradient(130deg, #e7f9f5, #eaf8ff)',
            borderRadius: '22px',
            padding: '30px',
            textAlign: 'center',
            border: '1px solid #d4ebeb'
          }}>
            <div style={{ fontSize: '58px', marginBottom: '20px' }}>🔑</div>
            <h2 style={{ fontSize: '27px', color: '#153e67', margin: '5px 0', fontWeight: '900' }}>
              Join your classroom
            </h2>
            <p style={{ color: '#58778b', margin: '10px 0 30px', fontSize: '14px' }}>
              Enter your class join code to get started
            </p>

            {error && (
              <div style={{
                background: '#ffe9e7',
                color: '#c85a59',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '12px'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleJoin} style={{ display: 'grid', gap: '16px' }}>
              <div>
                <input
                  type="text"
                  placeholder="JOIN CODE (e.g. LEAF25)"
                  value={code.toUpperCase()}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  style={{
                    width: '100%',
                    textAlign: 'center',
                    letterSpacing: '3px',
                    textTransform: 'uppercase',
                    fontWeight: '900',
                    fontSize: '18px',
                    padding: '12px',
                    border: '1px solid #cddfe4',
                    borderRadius: '12px'
                  }}
                  maxLength="6"
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                style={{
                  background: loading || code.length !== 6 ? '#ccc' : 'linear-gradient(100deg, #19b7a7, #079c98)',
                  color: 'white',
                  padding: '14px 24px',
                  borderRadius: '999px',
                  fontWeight: '900',
                  border: 'none',
                  cursor: loading || code.length !== 6 ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  boxShadow: '0 5px 12px #14a99f25',
                  transition: '0.15s'
                }}
                onMouseEnter={(e) => !loading && e.target.style.transform === '' && (e.target.style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                {loading ? 'Joining...' : 'Enter your class'}
              </button>
            </form>

            <p style={{ fontSize: '11px', color: '#688097', marginTop: '20px' }}>
              Don't have a code? Ask your teacher to share it with you.
            </p>
          </div>
        ) : (
          <div style={{
            background: 'white',
            borderRadius: '22px',
            padding: '40px',
            textAlign: 'center',
            border: '1px solid #e0eaed',
            boxShadow: '0 8px 24px rgba(29, 73, 100, 0.07)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
            <h2 style={{ fontSize: '24px', color: '#153e67', margin: '0 0 10px', fontWeight: '900' }}>
              Welcome!
            </h2>
            <p style={{ color: '#688097', marginBottom: '20px' }}>
              You've successfully joined your classroom. Redirecting now...
            </p>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #e0eaed',
              borderTop: '4px solid #12a99f',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
      </div>
    </div>
  );
}
