import { useState } from 'react';
import { api } from '../api.js';

export default function JoinClassModal({ isOpen, onClose, onJoinSuccess }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [joinedClass, setJoinedClass] = useState(null);

  const handleJoin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.joinClassroom(code.toUpperCase());
      setSuccess(true);
      setJoinedClass(response.classroom);
      setCode('');
      
      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
        onJoinSuccess();
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to join classroom');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'grid',
      placeItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '18px',
        padding: '32px',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 8px 24px rgba(29,73,100,.15)'
      }}>
        <h2 style={{ color: '#153e67', margin: '0 0 8px', fontSize: '24px', fontWeight: '900' }}>
          Join a Classroom
        </h2>
        <p style={{ color: '#688097', margin: '0 0 24px', fontSize: '14px' }}>
          Ask your teacher for the 6-character class code
        </p>

        {success ? (
          <div style={{ textAlign: 'center', padding: '24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
            <h3 style={{ color: '#078b84', margin: '0 0 8px', fontWeight: '900' }}>
              Welcome to {joinedClass?.name}!
            </h3>
            <p style={{ color: '#688097', margin: '0', fontSize: '14px' }}>
              You can now play games with your classmates
            </p>
          </div>
        ) : (
          <form onSubmit={handleJoin}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#153e67', fontWeight: '900', fontSize: '12px' }}>
                CLASS CODE
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="E.g., ABC123"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1.5px solid #dce8ed',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '800',
                  letterSpacing: '2px',
                  textAlign: 'center',
                  fontFamily: 'monospace',
                  boxSizing: 'border-box'
                }}
                maxLength="6"
              />
              <p style={{ fontSize: '11px', color: '#688097', margin: '6px 0 0', textAlign: 'center' }}>
                {code.length}/6 characters
              </p>
            </div>

            {error && (
              <div style={{
                background: '#ffe0e0',
                color: '#c00',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  background: 'white',
                  border: '1px solid #dce8ed',
                  borderRadius: '999px',
                  color: '#153e67',
                  fontWeight: '900',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  background: code.length === 6 ? 'linear-gradient(100deg,#19b7a7,#079c98)' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '999px',
                  fontWeight: '900',
                  cursor: code.length === 6 ? 'pointer' : 'default',
                  transition: 'all 0.2s'
                }}
              >
                {loading ? 'Joining...' : 'Join Class'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
