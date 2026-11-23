import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { api, assetUrl } from '../../api.js';
import TimerReminder from '../../components/TimerReminder.jsx';
import ReadAloudButton, { quizReadAloudText } from '../../components/ReadAloudButton.jsx';
import Mascot from '../../components/gamification/Mascot.jsx';
import Celebration from '../../components/gamification/Celebration.jsx';
import ScoreBar from '../../components/gamification/ScoreBar.jsx';
import FeedbackBadge from '../../components/gamification/FeedbackBadge.jsx';
import QuestionVisual, { WordPicture } from '../../components/gamification/QuestionVisual.jsx';
import { deriveVisual } from '../../components/gamification/illustrations.jsx';
import StickerRewards from '../../components/stickers/StickerRewards.jsx';
import { getTheme, getDifficultyColor } from '../../components/gamification/subjectTheme.js';
import { CheckCircle, XCircle, Lightbulb, ChevronRight, Flag, ArrowLeft } from 'lucide-react';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

/**
 * Question lifecycle (per question):
 *   UNANSWERED -> SELECTED (sending) -> INCORRECT -> RETRY (other cards stay live) -> CORRECT -> CONTINUE
 *                                                        \-> OUT_OF_TRIES (server says finished) -> CONTINUE
 * The server owns correctness and the try limit; the screen only mirrors it.
 */
export function lifecycleOf({ pending, result }) {
  if (pending) return 'SELECTED';
  if (!result) return 'UNANSWERED';
  if (result.is_correct) return 'CORRECT';
  return result.finished ? 'OUT_OF_TRIES' : 'RETRY';
}

function OptionCard({ option, index, state, disabled, onClick }) {
  // state: null | 'sending' | 'correct' | 'wrong' (just tried) | 'tried' (wrong earlier)
  const isCorrect = state === 'correct';
  const isWrong = state === 'wrong' || state === 'tried';
  const bg = isCorrect ? '#dcfce7' : state === 'wrong' ? '#fee2e2' : state === 'tried' ? '#f8fafc' : state === 'sending' ? '#eff6ff' : '#fff';
  const border = isCorrect ? '#86efac' : state === 'wrong' ? '#fca5a5' : state === 'tried' ? '#e2e8f0' : state === 'sending' ? '#93c5fd' : '#e2e8f0';
  const textClr = isCorrect ? '#166534' : state === 'wrong' ? '#991b1b' : state === 'tried' ? '#94a3b8' : '#23425e';
  const badgeBg = isCorrect ? '#22c55e' : state === 'wrong' ? '#ef4444' : state === 'tried' ? '#cbd5e1' : state === 'sending' ? '#3b82f6' : '#dce8ed';
  const badgeClr = (isCorrect || isWrong || state === 'sending') ? '#fff' : '#688097';
  return (
    <motion.button type="button"
      animate={state === 'wrong' ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }} transition={{ duration: 0.45 }}
      whileHover={!disabled ? { scale: 1.015, y: -2 } : {}} whileTap={!disabled ? { scale: 0.97 } : {}}
      onClick={() => !disabled && onClick(option.id)} disabled={disabled} data-option={option.id} data-state={state || 'idle'}
      aria-label={`Option ${LETTERS[index]}: ${option.text}${isCorrect ? ', correct' : isWrong ? ', not this one' : ''}`}
      style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', minHeight: 64, background: bg, border: `2px solid ${border}`, borderRadius: 16,
        padding: '12px 18px', textAlign: 'left', cursor: disabled ? 'not-allowed' : 'pointer', color: textClr, fontWeight: 700, fontSize: 16, lineHeight: 1.4,
        fontFamily: 'inherit', boxShadow: isCorrect ? `0 0 0 3px ${border}66` : '0 2px 8px rgba(0,0,0,0.04)' }}>
      <span style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 10, background: badgeBg, color: badgeClr, display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 14 }}>
        {isCorrect ? <CheckCircle size={20} /> : isWrong ? <XCircle size={20} /> : LETTERS[index]}
      </span>
      {option.image_url
        ? <img src={assetUrl(option.image_url)} alt="" loading="lazy" style={{ width: 52, height: 52, objectFit: 'contain', borderRadius: 10, flexShrink: 0 }} />
        : <WordPicture text={option.text} size={46} />}
      <span style={{ flex: 1, minWidth: 0 }}>{option.text}</span>
    </motion.button>
  );
}

function MiniBurst() {
  return (
    <div aria-hidden="true" style={{ position: 'relative', height: 0, pointerEvents: 'none' }}>
      {Array.from({ length: 7 }, (_, i) => (
        <motion.span key={i} initial={{ opacity: 1, x: 0, y: 0, scale: 0.4 }} animate={{ opacity: 0, x: (i - 3) * 26, y: -46 - (i % 3) * 12, scale: 1 }} transition={{ duration: 0.9 }}
          style={{ position: 'absolute', left: '50%', top: 0, fontSize: 18 }}>{['⭐', '✨', '🌟'][i % 3]}</motion.span>
      ))}
    </div>
  );
}

function QuizResults({ result, attempt, navigate }) {
  const theme = getTheme(attempt?.subject);
  const score = result.score ?? 0;
  const emoji = score === 100 ? '🏆' : score >= 70 ? '🌟' : score >= 40 ? '💪' : '📚';
  const msg = score === 100 ? 'Perfect score!' : score >= 70 ? 'Great work!' : score >= 40 ? 'Good effort!' : 'Keep practising!';
  return (
    <main className="content" data-game-result="quiz" style={{ maxWidth: 680, margin: '0 auto', paddingTop: 28 }}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{ background: theme.bgGradient, borderRadius: 24, padding: 'clamp(24px,4vw,40px)', textAlign: 'center', border: `2px solid ${theme.cardBorder}`, boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
        <motion.div animate={{ scale: [1, 1.2, 0.9, 1.1, 1] }} transition={{ duration: 0.8, delay: 0.3 }} style={{ fontSize: 72, lineHeight: 1, marginBottom: 8 }} aria-hidden="true">{emoji}</motion.div>
        <h1 style={{ color: '#153e67', fontSize: 'clamp(22px,4vw,30px)', fontWeight: 900, margin: '0 0 4px' }}>{msg}</h1>
        <div style={{ fontSize: 64, fontWeight: 900, color: theme.accent, lineHeight: 1, margin: '8px 0 4px' }}>{score}%</div>
        <ScoreBar value={score} color={theme.accent} />
        <p style={{ color: '#688097', margin: '10px 0 0', fontWeight: 700, fontSize: 14 }}>{result.correct_first_try ?? 0} of {result.total_items ?? 0} correct on the first try</p>
      </motion.div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 24 }}>
        <button type="button" className="btn btn-primary" onClick={() => navigate('/resources')}>Back to Resources</button>
        <button type="button" className="btn btn-soft" onClick={() => navigate('/dashboard')}>My Dashboard</button>
      </div>
    </main>
  );
}

export default function QuizPlayer({ attempt, user, onSignOut }) {
  const navigate = useNavigate();
  const items = attempt?.items || [];
  const theme = getTheme(attempt?.subject);
  const diff = getDifficultyColor(attempt?.difficulty);
  const maxTries = attempt?.policy?.max_tries || 2;

  const [index, setIndex] = useState(0);
  const [results, setResults] = useState({});     // itemId -> last server response
  const [tried, setTried] = useState({});         // itemId -> option ids already answered wrongly
  const [justWrong, setJustWrong] = useState({}); // itemId -> option id highlighted "right now"
  const [correctId, setCorrectId] = useState({}); // itemId -> the option the server accepted
  const [hints, setHints] = useState({});
  const [pending, setPending] = useState(null);   // option id currently being checked
  const [final, setFinal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [celebrate, setCelebrate] = useState(false);
  const [mascotState, setMascotState] = useState('idle');
  const [burstKey, setBurstKey] = useState(0);
  const lock = useRef(false);                      // one answer in flight at a time (no duplicate submissions)
  const flashTimer = useRef(null);

  const item = items[index];
  const result = item ? results[item.id] : null;
  const phase = lifecycleOf({ pending, result });
  const over = phase === 'CORRECT' || phase === 'OUT_OF_TRIES';
  const triesLeft = Math.max(maxTries - (result?.tries || 0), 0);
  const visual = item ? (item.visual || deriveVisual(item, attempt?.subject)) : null;
  useEffect(() => () => clearTimeout(flashTimer.current), []);

  const answer = async (optionId) => {
    if (!item || lock.current || over) return;
    if ((tried[item.id] || []).includes(optionId)) return;          // already tried and wrong: never resend
    lock.current = true;
    setPending(optionId); setError(''); setMascotState('thinking');
    try {
      const submissionId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
      const value = await api.submit(attempt.attempt_id, item.id, { option_id: optionId }, submissionId);
      setResults((old) => ({ ...old, [item.id]: value }));
      if (value.is_correct) {
        setCorrectId((old) => ({ ...old, [item.id]: optionId }));
        setMascotState('correct'); setBurstKey((k) => k + 1);
      } else {
        setTried((old) => ({ ...old, [item.id]: [...(old[item.id] || []), optionId] }));
        setJustWrong((old) => ({ ...old, [item.id]: optionId }));
        clearTimeout(flashTimer.current);
        flashTimer.current = setTimeout(() => setJustWrong((old) => ({ ...old, [item.id]: null })), 1400);   // the red flash is temporary
        setMascotState('wrong');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setMascotState('idle');
    } finally { lock.current = false; setPending(null); }
  };

  const next = async () => {
    if (index < items.length - 1) { setIndex(index + 1); setMascotState('idle'); return; }
    setSaving(true); setError('');
    try {
      const res = await api.complete(attempt.attempt_id);
      setMascotState('finished');
      if ((res.score ?? 0) >= 70) setCelebrate(true);
      setFinal(res);
    } catch (err) { setError(err.message || 'Could not save results. Please try again.'); }
    finally { setSaving(false); }
  };

  const getHint = async () => {
    try { const value = await api.hint(attempt.attempt_id, item.id); setHints((old) => ({ ...old, [item.id]: value.hint })); setMascotState('thinking'); }
    catch (err) { setError(err.message || 'No hint available.'); }
  };

  const optionState = (optionId) => {
    if (!item) return null;
    if (correctId[item.id] === optionId) return 'correct';
    if (pending === optionId) return 'sending';
    if (justWrong[item.id] === optionId) return 'wrong';
    if ((tried[item.id] || []).includes(optionId)) return 'tried';
    return null;
  };

  if (!item) return <main className="content" role="alert" style={{ textAlign: 'center', padding: 60 }}>This quiz activity has no questions yet.</main>;

  if (final) return (
    <div className="app" style={{ background: theme.bgGradient, minHeight: '100vh' }}>
      <header className="topbar"><span className="brand">Gamifi<span>ED</span></span><button className="btn btn-soft" onClick={onSignOut}>Sign out</button></header>
      <Celebration active={celebrate} colors={theme.confetti} onDone={() => setCelebrate(false)} />
      <StickerRewards stickers={final.newly_earned_stickers} />
      <QuizResults result={final} attempt={attempt} navigate={navigate} />
    </div>
  );

  const answeredCount = items.filter((i) => results[i.id]?.finished).length;
  const correctCount = items.filter((i) => results[i.id]?.is_correct).length;
  const speech = { correct: 'Brilliant! Well done!', wrong: 'Almost there! Try again!', thinking: 'Think carefully…', finished: 'You finished! Amazing! 🎉' }[mascotState] || "Let's answer this one!";

  return (
    <div className="app" style={{ background: theme.bgGradient, minHeight: '100vh' }}>
      <header className="topbar">
        <span className="brand">Gamifi<span>ED</span></span>
        <span style={{ marginLeft: 10, color: '#688097', fontSize: 13 }}>{user?.name}</span>
        <button className="btn btn-soft" style={{ marginLeft: 'auto' }} onClick={onSignOut}>Sign out</button>
      </header>

      <main className="content" data-game-player="quiz" data-phase={phase} style={{ maxWidth: 820, margin: '0 auto', paddingTop: 16 }}>
        <div style={{ background: '#fff', borderRadius: 20, border: `1px solid ${theme.cardBorder}`, padding: '14px 20px', marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
            <button type="button" className="btn btn-soft" style={{ padding: '8px 14px', fontSize: 12 }} onClick={() => navigate('/resources')}>
              <ArrowLeft size={14} style={{ display: 'inline', marginRight: 4 }} />Exit
            </button>
            <div style={{ flex: 1, minWidth: 160 }}>
              <ScoreBar value={(answeredCount / items.length) * 100} label={`Question ${index + 1} of ${items.length}`} color={theme.accent} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 900, color: theme.accentText, fontSize: 13 }}><Flag size={14} />{correctCount} correct</div>
            <TimerReminder config={attempt.timer_reminder} gameType="quiz" active={!over} timerKey={`${index}-${result?.tries || 0}`} />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {attempt.subject && <span style={{ padding: '3px 10px', borderRadius: 999, background: theme.accentSoft, color: theme.accentText, fontSize: 11, fontWeight: 900 }}><span aria-hidden="true">{theme.hero} </span>{attempt.subject}</span>}
            {attempt.grade != null && <span style={{ padding: '3px 10px', borderRadius: 999, background: '#f0f9ff', color: '#0369a1', fontSize: 11, fontWeight: 900 }}>Class {attempt.grade}</span>}
            {attempt.difficulty && <span style={{ padding: '3px 10px', borderRadius: 999, background: diff.bg, color: diff.text, fontSize: 11, fontWeight: 900, textTransform: 'capitalize' }}>{attempt.difficulty}</span>}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 20, alignItems: 'start' }}>
          <div style={{ paddingTop: 12, width: 120 }}><Mascot subject={attempt.subject} state={mascotState} size={80} speech={speech} /></div>

          <AnimatePresence mode="wait">
            <motion.div key={item.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3, ease: 'easeOut' }}>
              <section style={{ background: '#fff', borderRadius: 20, border: `1px solid ${theme.cardBorder}`, padding: 'clamp(18px,4vw,28px)', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                <div style={{ color: theme.accent, fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Question {index + 1}</div>
                <h1 style={{ color: '#153e67', fontSize: 'clamp(18px,3vw,23px)', lineHeight: 1.4, margin: '0 0 6px', fontWeight: 900 }}>{item.prompt}</h1>
                <ReadAloudButton text={quizReadAloudText(item, result)} />
                <QuestionVisual visual={visual} />

                <div style={{ display: 'grid', gap: 10, marginTop: 14 }} role="group" aria-label="Answer options">
                  {item.options.map((option, i) => (
                    <OptionCard key={option.id} option={option} index={i} state={optionState(option.id)}
                      disabled={over || Boolean(pending) || (tried[item.id] || []).includes(option.id)} onClick={answer} />
                  ))}
                </div>

                {error && <div role="alert" style={{ marginTop: 12, padding: 12, background: '#fee2e2', borderRadius: 10, color: '#991b1b', fontWeight: 700, fontSize: 13 }}>{error}</div>}

                <div style={{ marginTop: 14 }} aria-live="polite">
                  {phase === 'RETRY' && (
                    <FeedbackBadge tone="wrong" visible>
                      <strong>Oops! Not quite right. Try again!</strong>
                      <p style={{ margin: '4px 0 0', fontWeight: 600 }}>Pick another answer. You have {triesLeft} {triesLeft === 1 ? 'try' : 'tries'} left.</p>
                    </FeedbackBadge>
                  )}
                  {phase === 'CORRECT' && (
                    <>
                      <MiniBurst key={burstKey} />
                      <FeedbackBadge tone="correct" visible>
                        <strong>Fantastic! You got it!</strong>
                        {result.explanation && <p style={{ margin: '6px 0 0', fontWeight: 600 }}>{result.explanation}</p>}
                      </FeedbackBadge>
                    </>
                  )}
                  {phase === 'OUT_OF_TRIES' && (
                    <FeedbackBadge tone="info" visible>
                      <strong>Good try! Let&apos;s learn together.</strong>
                      {result.explanation && <p style={{ margin: '6px 0 0', fontWeight: 600 }}>{result.explanation}</p>}
                    </FeedbackBadge>
                  )}
                  {hints[item.id] && !over && <div style={{ marginTop: 8 }}><FeedbackBadge tone="hint" visible><strong>Hint:</strong> {hints[item.id]}</FeedbackBadge></div>}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
                  {!over && (
                    <button type="button" className="btn btn-soft" onClick={getHint} disabled={Boolean(pending)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Lightbulb size={14} /> Hint
                    </button>
                  )}
                  <button type="button" className="btn btn-primary" onClick={next} disabled={!over || saving}
                    style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, opacity: over ? 1 : 0.5 }}>
                    {saving ? 'Saving…' : index === items.length - 1 ? '🏁 Finish game' : 'Continue'}
                    {!saving && index < items.length - 1 && <ChevronRight size={16} />}
                  </button>
                </div>
              </section>
            </motion.div>
          </AnimatePresence>
        </div>

        <p style={{ textAlign: 'center', color: '#688097', fontSize: 12, fontWeight: 700, marginTop: 14 }}>⭐ {correctCount} of {items.length} answered correctly</p>
      </main>
    </div>
  );
}
