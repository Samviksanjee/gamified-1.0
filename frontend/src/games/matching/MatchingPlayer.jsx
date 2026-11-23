import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../../api.js';
import MatchingBody from '../../components/MatchingBody.jsx';
import TimerReminder from '../../components/TimerReminder.jsx';
import ReadAloudButton, { matchingReadAloudText } from '../../components/ReadAloudButton.jsx';
import Mascot from '../../components/gamification/Mascot.jsx';
import StickerRewards from '../../components/stickers/StickerRewards.jsx';
import Celebration from '../../components/gamification/Celebration.jsx';
import ScoreBar from '../../components/gamification/ScoreBar.jsx';
import FeedbackBadge from '../../components/gamification/FeedbackBadge.jsx';
import { getTheme, getDifficultyColor } from '../../components/gamification/subjectTheme.js';
import { ArrowLeft, ChevronRight, Flag } from 'lucide-react';
import '../../styles/matching.css';

function formatTime(s) {
  s = Math.max(Number(s) || 0, 0);
  return s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;
}

function verdict(accuracy) {
  if (accuracy >= 90) return { title: 'Excellent Work!', emoji: '🏆' };
  if (accuracy >= 70) return { title: 'Great Job!', emoji: '🌟' };
  if (accuracy >= 50) return { title: 'Good Effort!', emoji: '👍' };
  return { title: 'Keep Practising!', emoji: '💪' };
}

/* ── Results ── */
function MatchingResults({ result, attempt, onRetry, restarting, retryError, navigate }) {
  const theme = getTheme(attempt?.subject);
  const accuracy = result.accuracy ?? result.score ?? 0;
  const v = verdict(accuracy);

  return (
    <main className="content" data-game-result="matching" style={{ maxWidth: 640, margin: '0 auto', paddingTop: 24 }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          background: theme.bgGradient, borderRadius: 24, padding: 'clamp(24px,4vw,40px)',
          textAlign: 'center', border: `2px solid ${theme.cardBorder}`,
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        }}
      >
        {accuracy >= 70 && <div className="mg-confetti" aria-hidden="true"><span>🎉</span><span>⭐</span><span>🎊</span></div>}
        <motion.div animate={{ scale: [1, 1.2, 0.95, 1.1, 1] }} transition={{ duration: 0.8, delay: 0.3 }}
          style={{ fontSize: 72, lineHeight: 1, marginBottom: 8 }} aria-hidden="true">{v.emoji}</motion.div>
        <h1 style={{ color: '#153e67', fontWeight: 900, fontSize: 'clamp(22px,5vw,30px)', margin: '0 0 6px' }}>{v.title}</h1>
        <p style={{ margin: 0, color: '#47677d', fontWeight: 700 }}>
          You matched {result.correct_matches ?? 0} out of {result.total_pairs ?? 0} pairs correctly on the first try.
        </p>
        <div style={{ fontSize: 60, fontWeight: 900, color: theme.accent, margin: '10px 0 6px' }}>{accuracy}%</div>
        <ScoreBar value={accuracy} color={theme.accent} />
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10, margin: '16px 0' }}>
        {[['Total Pairs', result.total_pairs ?? 0], ['Correct', result.correct_matches ?? 0, '#dcfce7'],
          ['Incorrect', result.incorrect_attempts ?? 0, '#fee2e2'], ['Accuracy', `${accuracy}%`],
          ['Marks', `${result.marks_obtained ?? 0} / ${result.max_marks ?? 0}`, '#fef9c3'],
          ['Time', formatTime(result.time_taken_seconds)]].map(([label, val, bg]) => (
          <div key={label} style={{ background: bg || '#f3f8f8', borderRadius: 14, padding: '14px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#153e67', lineHeight: 1.1 }}>{val}</div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#688097', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {result.newly_earned_badges?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          style={{ background: '#fffbeb', border: '2px solid #fcd34d', borderRadius: 16, padding: 18, marginBottom: 16 }}>
          <strong style={{ color: '#153e67' }}>🏅 New badge{result.newly_earned_badges.length > 1 ? 's' : ''} unlocked!</strong>
          {result.newly_earned_badges.map((b) => (
            <div key={b.key} style={{ marginTop: 6, fontWeight: 700, color: '#47677d' }}>{b.icon} {b.name} — {b.description}</div>
          ))}
        </motion.div>
      )}

      <p style={{ textAlign: 'center', color: '#688097', fontSize: 12, fontWeight: 700 }}>
        Attempt {result.attempt_number ?? 1}{result.max_attempts ? ` of ${result.max_attempts}` : ''}
      </p>
      {retryError && <p role="alert" style={{ textAlign: 'center', color: '#991b1b', fontWeight: 800 }}>{retryError}</p>}
      {!result.can_retry && result.max_attempts && (
        <p style={{ textAlign: 'center', color: '#a77818', fontWeight: 800 }}>
          You have used all {result.max_attempts} attempts for this game.
        </p>
      )}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 }}>
        {result.can_retry && onRetry && (
          <button type="button" className="btn btn-soft" onClick={onRetry} disabled={restarting}>
            {restarting ? 'Starting…' : '🔄 Try again'}
          </button>
        )}
        <button type="button" className="btn btn-primary" onClick={() => navigate('/resources')}>Back to Resources</button>
        <button type="button" className="btn btn-soft" onClick={() => navigate('/dashboard')}>My Dashboard</button>
      </div>
    </main>
  );
}

/* ── Main player ── */
export default function MatchingPlayer({ attempt, user, onSignOut, onRestart }) {
  const navigate = useNavigate();
  const items    = attempt?.items || [];
  const theme    = getTheme(attempt?.subject);
  const diff     = getDifficultyColor(attempt?.difficulty);

  const firstOpen = Math.max(items.findIndex((i) => !i.finished), 0);
  const [index,      setIndex]    = useState(firstOpen);
  const [finished,   setFinished] = useState(() => Object.fromEntries(items.map((i) => [i.id, Boolean(i.finished)])));
  const [counts,     setCounts]   = useState(() => Object.fromEntries(items.map((i) => [i.id, Object.keys(i.matched || {}).length])));
  const [result,     setResult]   = useState(null);
  const [submitting, setSub]      = useState(false);
  const [error,      setError]    = useState('');
  const [restarting, setRestarting] = useState(false);
  const [retryError, setRetryError] = useState('');
  const [celebrate,  setCelebrate] = useState(false);
  const [mascotState, setMascotState] = useState('idle');
  const submitLock = useRef(false);

  const item   = items[index];
  const isLast = index === items.length - 1;
  const itemDone = Boolean(finished[item?.id]);

  const totalPairs   = items.reduce((n, i) => n + (i.lefts?.length || 0), 0);
  const matchedPairs = Object.values(counts).reduce((n, c) => n + c, 0);
  const progress     = totalPairs ? (matchedPairs / totalPairs) * 100 : 0;

  const check = async (leftId, rightId) => {
    const res = await api.checkMatch(attempt.attempt_id, item.id, leftId, rightId);
    if (res.is_correct) {
      setCounts((c) => ({ ...c, [item.id]: res.matched_count }));
      setMascotState('correct');
      if (res.finished) {
        setFinished((f) => ({ ...f, [item.id]: true }));
        setCelebrate(true);
      }
    } else {
      setMascotState('wrong');
    }
    return res;
  };

  const finish = async () => {
    if (submitLock.current) return;
    submitLock.current = true; setSub(true); setError('');
    try {
      const res = await api.complete(attempt.attempt_id);
      setMascotState('finished');
      if ((res.accuracy ?? res.score ?? 0) >= 70) setCelebrate(true);
      setResult(res);
    } catch (err) {
      setError(err.message || 'Could not submit the game. Please try again.');
      submitLock.current = false;
    } finally { setSub(false); }
  };

  const retry = async () => {
    setRestarting(true); setRetryError('');
    try { await onRestart?.(); } catch (err) { setRetryError(err.message); } finally { setRestarting(false); }
  };

  if (!item) return (
    <main className="content" role="alert" style={{ textAlign: 'center', padding: 60 }}>
      This matching game has no pairs yet.
    </main>
  );

  if (result) return (
    <div className="app" style={{ background: theme.bgGradient, minHeight: '100vh' }}>
      <header className="topbar">
        <span className="brand">Gamifi<span>ED</span></span>
        <button className="btn btn-soft" onClick={onSignOut}>Sign out</button>
      </header>
      <Celebration active={celebrate} colors={theme.confetti} onDone={() => setCelebrate(false)} />
      <StickerRewards stickers={result.newly_earned_stickers} />
      <MatchingResults result={result} attempt={attempt} onRetry={onRestart ? retry : null}
        restarting={restarting} retryError={retryError} navigate={navigate} />
    </div>
  );

  return (
    <div style={{ background: theme.bgGradient, minHeight: '100vh' }}>
      <header className="topbar">
        <span className="brand">Gamifi<span>ED</span></span>
        <span style={{ marginLeft: 10, color: '#688097', fontSize: 13 }}>{user?.name}</span>
        <button className="btn btn-soft" style={{ marginLeft: 'auto' }} onClick={onSignOut}>Sign out</button>
      </header>

      <Celebration active={celebrate} colors={theme.confetti} onDone={() => setCelebrate(false)} />

      <main className="content" data-game-player="matching" style={{ maxWidth: 820, margin: '0 auto', paddingTop: 16 }}>
        {/* Header card */}
        <div style={{
          background: '#fff', borderRadius: 20, border: `1px solid ${theme.cardBorder}`,
          padding: '14px 20px', marginBottom: 16,
          boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
            <button type="button" className="btn btn-soft" style={{ padding: '8px 14px', fontSize: 12 }}
              onClick={() => navigate('/resources')}>
              <ArrowLeft size={14} style={{ display: 'inline', marginRight: 4 }} />Exit
            </button>
            <div style={{ flex: 1, minWidth: 160 }}>
              <ScoreBar
                value={progress}
                label={`Pair set ${index + 1} of ${items.length} · ${matchedPairs}/${totalPairs} matched`}
                color={theme.accent}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 900, color: theme.accentText, fontSize: 13 }}>
              <Flag size={14} />{matchedPairs}/{totalPairs}
            </div>
            <TimerReminder config={attempt?.timer_reminder} gameType="matching" active={!itemDone} timerKey={`${attempt?.attempt_id}-${index}`} />
          </div>
          <h1 style={{ margin: '0 0 8px', fontSize: 'clamp(18px,4.5vw,24px)', color: '#153e67', fontWeight: 900, overflowWrap: 'anywhere' }}>
            {attempt?.title || 'Match the following'}
          </h1>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {attempt?.subject && (
              <span style={{ padding: '3px 10px', borderRadius: 999, background: theme.accentSoft, color: theme.accentText, fontSize: 11, fontWeight: 900 }}>
                <span aria-hidden="true">{theme.hero} </span>{attempt.subject}
              </span>
            )}
            {attempt?.grade != null && (
              <span style={{ padding: '3px 10px', borderRadius: 999, background: '#f0f9ff', color: '#0369a1', fontSize: 11, fontWeight: 900 }}>
                Class {attempt.grade}
              </span>
            )}
            {attempt?.difficulty && (
              <span style={{ padding: '3px 10px', borderRadius: 999, background: diff.bg, color: diff.text, fontSize: 11, fontWeight: 900, textTransform: 'capitalize' }}>
                {attempt.difficulty}
              </span>
            )}
            {attempt?.attempt_number != null && (
              <span style={{ padding: '3px 10px', borderRadius: 999, background: '#ede9fe', color: '#4c1d95', fontSize: 11, fontWeight: 900 }}>
                Attempt {attempt.attempt_number}{attempt.max_attempts ? ` of ${attempt.max_attempts}` : ''}
              </span>
            )}
          </div>
        </div>

        {/* Mascot row */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ flexShrink: 0, width: 100 }}>
            <Mascot subject={attempt?.subject} state={mascotState} size={68}
              speech={
                mascotState === 'correct' ? 'Great match! 🎯'
                : mascotState === 'wrong' ? 'Try another!'
                : mascotState === 'finished' ? 'All done! 🎉'
                : 'Match the pairs!'
              }
            />
          </div>

          {/* Question card */}
          <AnimatePresence mode="wait">
            <motion.article
              key={item.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.28 }}
              style={{
                flex: 1, background: '#fff', borderRadius: 20,
                border: `1.5px solid ${theme.cardBorder}`,
                padding: 'clamp(16px,4vw,24px)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              }}
            >
              <div style={{ color: theme.accent, fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                {theme.emoji} Match the pairs · Set {index + 1}
              </div>
              <h2 style={{ margin: '0 0 6px', fontSize: 'clamp(16px,4vw,20px)', color: '#153e67', fontWeight: 900 }}>
                {item.prompt}
              </h2>
              <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#47677d', fontSize: 14 }}>Match each item on the left with its correct answer on the right.</p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <ReadAloudButton text={matchingReadAloudText(item, null)} />
              </div>
              <div className="mg-how" aria-label="How to play">
                <span>🖱️ <b>Drag</b> an item onto its answer</span>
                <span>👆 or <b>tap</b> one, then tap its match</span>
                <span>✅ Correct pairs lock · ❌ wrong ones retry</span>
              </div>

              <MatchingBody
                key={`${attempt.attempt_id}-${item.id}`}
                item={item}
                locked={itemDone}
                onCheck={check}
              />

              {error && (
                <p role="alert" style={{ color: '#991b1b', fontWeight: 800, textAlign: 'center' }}>{error}</p>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                {!itemDone ? (
                  <button type="button" className="btn btn-primary" disabled style={{ opacity: 0.55 }}>
                    Match all pairs to continue
                  </button>
                ) : isLast ? (
                  <button type="button" className="btn btn-primary" onClick={finish} disabled={submitting}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {submitting ? 'Submitting…' : '🏁 Finish game'}
                  </button>
                ) : (
                  <button type="button" className="btn btn-primary"
                    onClick={() => { setIndex(index + 1); setMascotState('idle'); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    Next set <ChevronRight size={16} />
                  </button>
                )}
              </div>
            </motion.article>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
