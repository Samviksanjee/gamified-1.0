import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api.js';

export default function CrosswordGame({ user, onSignOut }) {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const launchGame = async () => {
      try {
        // Call API to get authorization code
        const response = await api.launchGame(
          parseInt(activityId),
          'crossword'
        );

        // Determine crossword game URL from environment or default
        // The localhost fallback exists for local development only; production builds require VITE_CROSSWORD_GAME_URL.
        const crosswordGameUrl = import.meta.env.VITE_CROSSWORD_GAME_URL || (import.meta.env.DEV ? 'http://localhost:5174/crossword' : '');
        if (!crosswordGameUrl) throw new Error('The crossword game is not configured (VITE_CROSSWORD_GAME_URL is not set).');
        
        // Redirect to crossword game frontend with authorization code
        // The crossword game will exchange the code for a game_session_token
        window.location.href = `${crosswordGameUrl}?code=${encodeURIComponent(response.code)}&expiresAt=${encodeURIComponent(response.expiresAt)}`;
      } catch (err) {
        setError(err.message || 'Failed to launch game');
        setLoading(false);
      }
    };

    launchGame();
  }, [activityId]);

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
        <div>
          <p>Launching crossword game...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'red' }}>Error: {error}</p>
          <button 
            onClick={() => navigate('/learning')}
            style={{ padding: '8px 16px', cursor: 'pointer' }}
          >
            Back to Learning
          </button>
        </div>
      </div>
    );
  }

  return null;
}
