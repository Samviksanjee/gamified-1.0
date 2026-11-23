import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import QuizPlayer from '../games/quiz/QuizPlayer.jsx';
import MatchingPlayer from '../games/matching/MatchingPlayer.jsx';
import SequencingPlayer from '../games/sequencing/SequencingPlayer.jsx';
import PuzzlePlayer from '../games/puzzle/PuzzlePlayer.jsx';
import CrosswordPlayer from '../games/crossword/CrosswordPlayer.jsx';
import '../styles/pages.css';

const players = { quiz: QuizPlayer, matching: MatchingPlayer, sequencing: SequencingPlayer, puzzle: PuzzlePlayer, crossword: CrosswordPlayer };
export default function PlayPage({ user, onSignOut }) {
  const { activityId, topicId, objectiveId } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null); const [error, setError] = useState(''); const [loading, setLoading] = useState(true); const [resolvedActivityId, setResolvedActivityId] = useState(null);
  // Captures game_type from a successful startAttempt response for type-safe
  // routing. Set to null at the start of each attempt so a stale value from a
  // previous run never influences the catch block.
  const resolvedGameTypeRef = useRef(null);
  const start = useCallback(async (id) => {
    resolvedGameTypeRef.current = null;
    const parsed = Number(id);
    if (!Number.isInteger(parsed) || parsed <= 0) throw new Error('No valid activity ID. Please open an activity from your assignments or resources.');
    const value = await api.startAttempt({ activity_id: parsed });
    resolvedGameTypeRef.current = value?.game_type ?? null;
    // Puzzle uses its own dedicated player — redirect rather than crashing
    if (value?.game_type === 'puzzle') {
      navigate(`/play/puzzle/${parsed}`, { replace: true });
      return;
    }
    // Crossword uses its own dedicated player — redirect rather than crashing
    if (value?.game_type === 'crossword') {
      navigate(`/play/crossword/${parsed}`, { replace: true });
      return;
    }
    if (!value?.items?.length && !['crossword'].includes(value?.game_type)) throw new Error('This activity has no questions yet. Please ask your teacher to add questions.');
    setResolvedActivityId(parsed);
    setAttempt(value);
  }, [navigate]);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(''); setAttempt(null);
    (async () => {
      try {
        if (topicId) { const activity = await api.topicActivity(Number(topicId)); await start(activity.activity_id); }
        else await start(activityId || objectiveId);
      } catch (err) {
        // If the backend rejected because it's a puzzle, redirect to the puzzle player
        const msg = err.message || '';
        const id = activityId || objectiveId;
        if (msg.toLowerCase().includes('puzzle') && id) {
          navigate(`/play/puzzle/${id}`, { replace: true });
          return;
        }
        // Use the game_type captured from a successful startAttempt response.
        // The general /student/attempts endpoint throws 501 for crossword before
        // returning a body (so the ref stays null). Keep the string-match as a
        // fallback so students arriving via /play/a/{id} are still redirected.
        if ((resolvedGameTypeRef.current === 'crossword' || msg.toLowerCase().includes('crossword')) && id) {
          navigate(`/play/crossword/${id}`, { replace: true });
          return;
        }
        if (active) setError(msg || 'Failed to start activity. Please try again.');
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [activityId, topicId, objectiveId, start, navigate]);
  if (loading) return <main className="content" role="status" style={{ textAlign: 'center', padding: 60 }}>Loading activity…</main>;
  if (error) return <main className="content" role="alert" style={{ textAlign: 'center', padding: 60 }}><p>{error}</p><button className="btn btn-soft" onClick={() => start(resolvedActivityId || activityId || objectiveId)}>Try again</button><button className="btn btn-primary" onClick={() => navigate('/resources')}>Back to resources</button></main>;
  const Player = players[attempt?.game_type];
  if (!Player) return <main className="content" role="alert" style={{ textAlign: 'center', padding: 60 }}>This activity has an unsupported game type.</main>;
  // Retry starts a brand-new attempt (fresh shuffle); key forces a clean player. Errors such as
  // "maximum number of attempts" bubble back to the player's own message area.
  return <Player key={attempt.attempt_id} attempt={attempt} user={user} onSignOut={onSignOut} onRestart={() => start(resolvedActivityId)} />;
}
