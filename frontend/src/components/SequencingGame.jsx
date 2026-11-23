import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { DndContext, DragOverlay, PointerSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { api, assetUrl } from '../api.js';
import TimerReminder from './TimerReminder.jsx';
import ReadAloudButton, { sequencingReadAloudText } from './ReadAloudButton.jsx';
import Mascot from './gamification/Mascot.jsx';
import StickerRewards from './stickers/StickerRewards.jsx';
import { Icon, iconKeyFor } from './gamification/illustrations.jsx';
import Celebration from './gamification/Celebration.jsx';
import FeedbackBadge from './gamification/FeedbackBadge.jsx';
import ScoreBar from './gamification/ScoreBar.jsx';
import GameShell from './gamification/GameShell.jsx';
import { getTheme, getDifficultyColor } from './gamification/subjectTheme.js';
import { ArrowUp, ArrowDown, RotateCcw, Lightbulb, ChevronRight } from 'lucide-react';

/* ─────────────────────────────────────────────────── helpers */
function formatTime(seconds) {
  const s = Math.max(Number(seconds) || 0, 0);
  return s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;
}

/* ─────────────────────────────────────────────────── StepCard */
function StepCard({ step, index, total, locked, dragEnabled, numberMode, selected, onSelect, onMove }) {
  const drag = useDraggable({ id: `step:${step.id}`, disabled: locked || !dragEnabled });
  const drop = useDroppable({ id: `slot:${index}`, disabled: locked });

  // Merge drag and drop refs onto the same DOM node
  const setRefs = (node) => { drag.setNodeRef(node); drop.setNodeRef(node); };
  const isDropOver = drop.isOver && !drag.isDragging;

  return (
    <motion.div
      ref={setRefs}
      data-step-id={step.id}
      onClick={() => numberMode && !locked && onSelect(step.id)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: drag.isDragging ? 0.4 : 1, y: 0 }}
      transition={{ layout: { duration: 0.22, ease: 'easeInOut' } }}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: selected ? '#eff6ff' : '#fff',
        border: `2px solid ${isDropOver ? '#3b82f6' : selected ? '#93c5fd' : locked ? '#86efac' : '#e2e8f0'}`,
        borderRadius: 16, padding: '12px 14px',
        boxShadow: selected ? '0 0 0 3px #bfdbfe' : '0 2px 8px rgba(0,0,0,0.04)',
        cursor: locked ? 'default' : numberMode ? 'pointer' : 'default',
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      {/* Position badge */}
      <span style={{
        flexShrink: 0, width: 32, height: 32, borderRadius: 10,
        background: locked ? '#dcfce7' : selected ? '#dbeafe' : '#f1f5f9',
        color: locked ? '#166534' : selected ? '#1d4ed8' : '#64748b',
        display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 14,
      }}>
        {index + 1}
      </span>

      {/* Drag handle */}
      {dragEnabled && !locked && (
        <button
          type="button"
          {...drag.attributes}
          {...drag.listeners}
          aria-label={`Drag ${step.content}`}
          style={{
            flexShrink: 0, width: 32, height: 32, borderRadius: 9,
            border: '1px solid #e2e8f0', background: '#f8fafc',
            color: '#94a3b8', cursor: 'grab', touchAction: 'none',
            display: 'grid', placeItems: 'center', fontSize: 18, letterSpacing: -2,
          }}
        >⋮⋮</button>
      )}

      {/* Image if present */}
      {step.image_url ? (
        <img src={assetUrl(step.image_url)} alt="" loading="lazy" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 12, flexShrink: 0 }} />
      ) : iconKeyFor(step.content) ? (
        <span data-step-icon={iconKeyFor(step.content)} style={{ flexShrink: 0, width: 56, height: 56, borderRadius: 12, background: '#f8fafc', display: 'grid', placeItems: 'center' }}>
          <Icon name={iconKeyFor(step.content)} size={46} />
        </span>
      ) : null}

      {/* Text */}
      <span style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere', fontWeight: 600, color: locked ? '#166534' : '#23425e', fontSize: 14, lineHeight: 1.4 }}>
        {step.content}
      </span>

      {/* Up/Down arrows */}
      {!locked && (
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button
            type="button"
            aria-label={`Move ${step.content} up`}
            disabled={index === 0}
            onClick={(e) => { e.stopPropagation(); onMove(index, index - 1); }}
            style={{
              width: 32, height: 32, borderRadius: 8, border: '1px solid #e2e8f0',
              background: '#f8fafc', color: index === 0 ? '#cbd5e1' : '#64748b',
              display: 'grid', placeItems: 'center', cursor: index === 0 ? 'not-allowed' : 'pointer',
            }}
          ><ArrowUp size={14} /></button>
          <button
            type="button"
            aria-label={`Move ${step.content} down`}
            disabled={index === total - 1}
            onClick={(e) => { e.stopPropagation(); onMove(index, index + 1); }}
            style={{
              width: 32, height: 32, borderRadius: 8, border: '1px solid #e2e8f0',
              background: '#f8fafc', color: index === total - 1 ? '#cbd5e1' : '#64748b',
              display: 'grid', placeItems: 'center', cursor: index === total - 1 ? 'not-allowed' : 'pointer',
            }}
          ><ArrowDown size={14} /></button>
        </div>
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────── Results */
function SequencingResults({ result, attempt, onRetry, restarting, retryError, navigate }) {
  const theme = getTheme(attempt?.subject);
  const score = result.score ?? 0;
  const emoji = score === 100 ? '🏆' : score >= 60 ? '🌟' : '💪';

  return (
    <main className="content" data-game-result="sequencing" style={{ maxWidth: 680, margin: '0 auto', paddingTop: 28 }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ background: theme.bgGradient, borderRadius: 24, padding: 32, textAlign: 'center', border: `2px solid ${theme.cardBorder}` }}
      >
        <motion.div animate={{ scale: [1, 1.2, 0.95, 1.1, 1] }} transition={{ duration: 0.8, delay: 0.3 }}
          style={{ fontSize: 72, lineHeight: 1, marginBottom: 8 }} aria-hidden="true">{emoji}</motion.div>
        <h1 style={{ color: '#153e67', fontWeight: 900, margin: '0 0 4px', fontSize: 'clamp(22px,4vw,30px)' }}>Sequencing complete!</h1>
        <div style={{ fontSize: 60, fontWeight: 900, color: theme.accent, margin: '6px 0 4px' }}>{score}%</div>
        <ScoreBar value={score} color={theme.accent} />
        <p style={{ color: '#688097', margin: '8px 0 0', fontWeight: 700 }}>{result.points_earned || 0} points earned</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px,1fr))', gap: 10, marginTop: 20 }}>
          {[['Questions', result.total_questions], ['Correct', result.correct_questions], ['Incorrect', result.incorrect_questions], ['Accuracy', `${result.accuracy ?? score}%`], ['Time', formatTime(result.time_taken_seconds)]].map(([lbl, val]) => (
            <div key={lbl} style={{ background: '#fff', borderRadius: 14, padding: '12px 8px' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#153e67' }}>{val}</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#688097' }}>{lbl}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {result.newly_earned_badges?.map((b) => (
        <motion.div key={b.key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          style={{ background: '#fffbeb', border: '2px solid #fcd34d', borderRadius: 16, padding: 16, marginTop: 12 }}>
          <span aria-hidden="true">{b.icon} </span><strong style={{ color: '#153e67' }}>{b.name}</strong>
          <p style={{ margin: '4px 0 0', color: '#688097', fontSize: 12 }}>{b.description}</p>
        </motion.div>
      ))}

      {result.question_results?.length > 0 && (
        <section aria-label="Question results" style={{ marginTop: 16, display: 'grid', gap: 10 }}>
          {result.question_results.map((row, i) => (
            <article key={row.item_id} style={{
              background: '#fff', borderRadius: 16, padding: '14px 18px',
              border: `1.5px solid ${row.is_correct ? '#86efac' : '#fca5a5'}`,
            }}>
              <strong style={{ color: '#153e67', fontSize: 14 }}>
                {row.is_correct ? '✅' : '❌'} Q{i + 1}: {row.prompt}
              </strong>
              <div style={{ fontSize: 12, color: '#688097', marginTop: 3 }}>
                {row.first_try ? 'Correct on the first try' : row.is_correct ? `Correct after ${row.tries} tries` : `Not solved after ${row.tries} tries`}
              </div>
              {row.correct_sequence?.length > 0 && (
                <ol style={{ margin: '8px 0 0', paddingLeft: 20 }}>
                  {row.correct_sequence.map((txt, j) => <li key={j} style={{ fontSize: 13 }}>{txt}</li>)}
                </ol>
              )}
              {row.explanation && <p style={{ margin: '6px 0 0', fontSize: 13, color: '#47677d' }}>{row.explanation}</p>}
            </article>
          ))}
        </section>
      )}

      {result.attempt_number != null && (
        <p style={{ textAlign: 'center', color: '#688097', fontSize: 12, fontWeight: 700, marginTop: 14 }}>
          Attempt {result.attempt_number}{result.max_attempts ? ` of ${result.max_attempts}` : ''}
        </p>
      )}
      {retryError && <p role="alert" style={{ textAlign: 'center', color: '#991b1b', fontWeight: 800, marginTop: 12 }}>{retryError}</p>}
      {result.can_retry === false && result.max_attempts && (
        <p style={{ textAlign: 'center', color: '#a77818', fontWeight: 800, marginTop: 8 }}>
          You have used all {result.max_attempts} attempts for this game.
        </p>
      )}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 20 }}>
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

/* ─────────────────────────────────────────────────── Main */
export default function SequencingGame({ attempt, user, onSignOut, onRestart }) {
  const navigate = useNavigate();
  const items    = attempt?.items || [];
  const theme    = getTheme(attempt?.subject);
  const diff     = getDifficultyColor(attempt?.difficulty);

  const firstOpen = Math.max(items.findIndex((c) => !c.finished), 0);
  const [current, setCurrent]     = useState(firstOpen);
  const [orders, setOrders]       = useState(() => Object.fromEntries(items.map((item) => [item.id, [...item.steps]])));
  const [removed, setRemoved]     = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [feedback, setFeedback]   = useState(() => Object.fromEntries(items.filter((i) => i.finished).map((i) => [i.id, { tries: i.tries, finished: true, resumed: true }])));
  const [hints, setHints]         = useState({});
  const [attempts, setAttempts]   = useState({});
  const [submitting, setSub]      = useState(false);
  const [submissionIds, setSubIds] = useState({});
  const [complete, setComplete]   = useState(null);
  const [error, setError]         = useState('');
  const [dragging, setDragging]   = useState(null);
  const [restarting, setRestarting] = useState(false);
  const [retryError, setRetryError] = useState('');
  const [celebrate, setCelebrate] = useState(false);
  const [mascotState, setMascotState] = useState('idle');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
  );

  const item    = items[current];
  const order   = (item && orders[item.id]) || [];
  const mode    = item?.interaction_mode || attempt?.interaction_mode || 'both';
  const dragMode   = mode === 'drag_drop' || mode === 'both';
  const numberMode = mode === 'number' || mode === 'number_based' || mode === 'both';
  const activeFeedback = item ? feedback[item.id] : undefined;
  const locked  = Boolean(activeFeedback?.finished);
  const answeredCount = Object.values(feedback).filter((f) => f.finished).length;
  const selectedIndex = useMemo(() => order.findIndex((s) => s.id === selectedId), [order, selectedId]);

  useEffect(() => { setSelectedId(null); setError(''); setMascotState('idle'); }, [current]);

  if (!item && !complete) {
    return (
      <main className="content" role="alert" style={{ textAlign: 'center', padding: 60 }}>
        This sequencing activity has no questions yet.
      </main>
    );
  }

  /* ── order manipulation ── */
  const setOrder = (next) => setOrders((all) => ({ ...all, [item.id]: next }));
  const move = (from, to) => {
    if (locked || to < 0 || to >= order.length || from === to || from < 0) return;
    const next = [...order];
    const [taken] = next.splice(from, 1);
    next.splice(to, 0, taken);
    setOrder(next);
  };
  const adjacentMove = (from, to) => {
    if (locked || to < 0 || to >= order.length) return;
    const next = [...order];
    [next[from], next[to]] = [next[to], next[from]];
    setOrder(next);
  };
  const chooseSlot = (slot) => { if (selectedIndex < 0) return; move(selectedIndex, slot); setSelectedId(null); };
  const reset = () => {
    if (locked) return;
    setOrder([...item.steps]);
    setRemoved((all) => ({ ...all, [item.id]: [] }));
    setSelectedId(null); setError('');
  };
  const removeLast = () => {
    if (locked || !order.length) return;
    const step = order[order.length - 1];
    setOrder(order.slice(0, -1));
    setRemoved((all) => ({ ...all, [item.id]: [...(all[item.id] || []), step] }));
  };
  const addCard = (step) => {
    setOrder([...order, step]);
    setRemoved((all) => ({ ...all, [item.id]: (all[item.id] || []).filter((c) => c.id !== step.id) }));
  };
  const onDragEnd = ({ active, over }) => {
    setDragging(null);
    if (!over || !String(over.id).startsWith('slot:')) return;
    move(order.findIndex((s) => `step:${s.id}` === active.id), Number(String(over.id).slice(5)));
  };

  /* ── submit ── */
  const submit = async () => {
    if (submitting || locked) return;
    setSub(true); setError(''); setMascotState('thinking');
    try {
      const subId = submissionIds[item.id] || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);
      if (!submissionIds[item.id]) setSubIds((all) => ({ ...all, [item.id]: subId }));
      const result = await api.submit(attempt.attempt_id, item.id, { order: order.map((s) => s.id) }, subId);
      setSubIds((all) => { const next = { ...all }; delete next[item.id]; return next; });
      setFeedback((all) => ({ ...all, [item.id]: result }));
      setAttempts((all) => ({ ...all, [item.id]: result.tries }));
      if (result.hint) setHints((all) => ({ ...all, [item.id]: result.hint }));
      if (result.is_correct) { setMascotState('correct'); if (result.finished) setCelebrate(true); }
      else { setMascotState('wrong'); }
    } catch (err) {
      setError(err.message || 'Please place every item before submitting.');
      setMascotState('idle');
    } finally { setSub(false); }
  };

  const getHint = async () => {
    try {
      const result = await api.hint(attempt.attempt_id, item.id);
      setHints((all) => ({ ...all, [item.id]: result.hint }));
      setMascotState('thinking');
    } catch (err) { setError(err.message || 'No more hints available.'); }
  };

  const next = async () => {
    if (current < items.length - 1) { setCurrent((v) => v + 1); return; }
    if (submitting) return;
    setSub(true); setError('');
    try {
      const res = await api.complete(attempt.attempt_id);
      setMascotState('finished');
      if ((res.score ?? 0) >= 60) setCelebrate(true);
      setComplete(res);
    } catch (err) {
      setError(err.message || 'Could not save your progress. Please try again.');
    } finally { setSub(false); }
  };

  const retry = async () => {
    setRestarting(true); setRetryError('');
    try { await onRestart?.(); } catch (err) { setRetryError(err.message); } finally { setRestarting(false); }
  };

  /* ── complete screen ── */
  if (complete) {
    return (
      <div className="app" style={{ background: theme.bgGradient, minHeight: '100vh' }}>
        <header className="topbar">
          <span className="brand">Gamifi<span>ED</span></span>
          <button className="btn btn-soft" onClick={onSignOut}>Sign out</button>
        </header>
        <Celebration active={celebrate} colors={theme.confetti} onDone={() => setCelebrate(false)} />
        <StickerRewards stickers={complete.newly_earned_stickers} />
        <SequencingResults result={complete} attempt={attempt} onRetry={onRestart ? retry : null} restarting={restarting} retryError={retryError} navigate={navigate} />
      </div>
    );
  }

  const correctSteps = (activeFeedback?.correct_order || []).map((id) => item.steps.find((s) => s.id === id)).filter(Boolean);
  const solved = Boolean(activeFeedback?.is_correct);

  return (
    <div style={{ background: theme.bgGradient, minHeight: '100vh' }}>
      <header className="topbar">
        <span className="brand">Gamifi<span>ED</span></span>
        <span style={{ marginLeft: 10, color: '#688097', fontSize: 13 }}>{user?.name}</span>
        <button className="btn btn-soft" style={{ marginLeft: 'auto' }} onClick={onSignOut}>Sign out</button>
      </header>

      <Celebration active={celebrate} colors={theme.confetti} onDone={() => setCelebrate(false)} />

      <main className="content" data-game-player="sequencing" style={{ maxWidth: 860, margin: '0 auto', paddingTop: 16 }}>
        {/* Header */}
        <div style={{
          background: '#fff', borderRadius: 20,
          border: `1px solid ${theme.cardBorder}`,
          padding: '14px 20px', marginBottom: 20,
          boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
            <button type="button" className="btn btn-soft" onClick={() => navigate('/resources')}>← Exit</button>
            <div style={{ flex: 1, minWidth: 160 }}>
              <ScoreBar value={items.length ? (answeredCount / items.length) * 100 : 0}
                label={`${attempt?.title || 'Activity'} · Question ${current + 1} of ${items.length}`}
                color={theme.accent} />
            </div>
            <TimerReminder config={attempt?.timer_reminder} gameType="sequencing" active={!locked} timerKey={`${current}-${activeFeedback?.tries || 0}`} />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {attempt?.subject && <span style={{ padding: '3px 10px', borderRadius: 999, background: theme.accentSoft, color: theme.accentText, fontSize: 11, fontWeight: 900 }}><span aria-hidden="true">{theme.hero} </span>{attempt.subject}</span>}
            {attempt?.topic && <span style={{ padding: '3px 10px', borderRadius: 999, background: '#f1f5f9', color: '#334155', fontSize: 11, fontWeight: 900 }}>{attempt.topic}</span>}
            {attempt?.grade != null && <span style={{ padding: '3px 10px', borderRadius: 999, background: '#f0f9ff', color: '#0369a1', fontSize: 11, fontWeight: 900 }}>Class {attempt.grade}</span>}
            {attempt?.difficulty && <span style={{ padding: '3px 10px', borderRadius: 999, background: diff.bg, color: diff.text, fontSize: 11, fontWeight: 900, textTransform: 'capitalize' }}>{attempt.difficulty}</span>}
            {attempt?.attempt_number != null && <span style={{ padding: '3px 10px', borderRadius: 999, background: '#ede9fe', color: '#4c1d95', fontSize: 11, fontWeight: 900 }}>Attempt {attempt.attempt_number}{attempt.max_attempts ? ` of ${attempt.max_attempts}` : ''}</span>}
          </div>
        </div>

        {/* Mascot + Question row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 20, alignItems: 'start', marginTop: 4 }}>
          <div style={{ width: 110, paddingTop: 8 }}>
            <Mascot subject={attempt?.subject} state={mascotState} size={72}
              speech={
                mascotState === 'correct' ? 'Great order! 🌟'
                : mascotState === 'wrong' ? 'Think again!'
                : mascotState === 'thinking' ? 'Hmm…'
                : mascotState === 'finished' ? 'Amazing! 🎉'
                : 'Arrange the cards!'
              }
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.section
              key={item.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              style={{
                background: '#fff', borderRadius: 20,
                border: `1.5px solid ${theme.cardBorder}`,
                padding: 'clamp(16px,4vw,26px)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              }}
            >
              <div style={{ color: theme.accent, fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                {theme.emoji} Arrange the steps · Question {current + 1}
              </div>
              <h1 style={{ color: '#153e67', fontSize: 'clamp(17px,3vw,22px)', lineHeight: 1.4, margin: '0 0 6px', fontWeight: 900 }}>
                {item.prompt}
              </h1>
              <div style={{ marginBottom: 10 }}>
                <ReadAloudButton text={sequencingReadAloudText(item, order, activeFeedback)} />
              </div>
              {attempt?.instructions && !locked && (
                <p style={{ background: '#f8fafc', borderRadius: 10, padding: '8px 12px', color: '#47677d', fontSize: 13, margin: '0 0 12px' }}>
                  📋 {attempt.instructions}
                </p>
              )}
              <p style={{ color: '#688097', fontSize: 13, margin: '0 0 14px' }}>
                {locked ? 'This question is finished.' : 'Drag the ⋮⋮ handle or use ↑ ↓ buttons to arrange the cards.'}
              </p>

              {numberMode && !locked && selectedId && (
                <div style={{ background: '#eff6ff', borderRadius: 10, padding: '8px 12px', color: '#1e40af', fontSize: 12, marginBottom: 10 }}>
                  <strong>Number mode:</strong> selected — tap a position number below to move.
                </div>
              )}

              {/* Cards */}
              <DndContext
                sensors={sensors}
                onDragStart={({ active }) => setDragging(order.find((s) => `step:${s.id}` === active.id) || null)}
                onDragEnd={onDragEnd}
                onDragCancel={() => setDragging(null)}
              >
                <div aria-label="Sequence answer" style={{ display: 'grid', gap: 8 }}>
                  {order.map((step, i) => (
                    <StepCard
                      key={step.id}
                      step={step} index={i} total={order.length}
                      locked={locked} dragEnabled={dragMode}
                      numberMode={numberMode}
                      selected={selectedId === step.id}
                      onSelect={setSelectedId}
                      onMove={adjacentMove}
                    />
                  ))}
                </div>
                <DragOverlay dropAnimation={null}>
                  {dragging ? (
                    <div className="seq-ghost" style={{ background: '#fff', border: '2px solid #3b82f6', borderRadius: 16, padding: '12px 14px', boxShadow: '0 10px 26px rgba(0,0,0,0.2)', fontSize: 14, fontWeight: 700, color: '#23425e' }}>
                      {dragging.content}
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>

              {/* Number-mode slot selector */}
              {numberMode && selectedId && !locked && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                  <span style={{ color: '#688097', fontSize: 12 }}>Move to position:</span>
                  {order.map((_, i) => (
                    <button key={i} type="button" className="btn btn-soft" onClick={() => chooseSlot(i)}
                      style={{ padding: '6px 10px', fontSize: 12, minWidth: 36 }}>{i + 1}</button>
                  ))}
                </div>
              )}

              {/* Removed cards tray */}
              {(removed[item.id] || []).length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ color: '#688097', fontSize: 12 }}>Cards to place:</span>
                  {removed[item.id].map((step) => (
                    <button type="button" key={step.id} className="btn btn-soft"
                      onClick={() => addCard(step)} style={{ padding: '7px 10px', fontSize: 12 }}>
                      {step.content}
                    </button>
                  ))}
                </div>
              )}

              {/* Bottom action row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn-soft" onClick={reset} disabled={locked}
                    style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <RotateCcw size={13} /> ↺ Reset order
                  </button>
                  <button type="button" className="btn btn-soft" onClick={removeLast} disabled={locked || !order.length}>Clear last card</button>
                </div>
                <button type="button" className="btn btn-soft" onClick={getHint} disabled={locked}
                  style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Lightbulb size={13} /> {hints[item.id] ? 'Another hint' : 'Get a hint'}
                </button>
              </div>

              {/* Hint display */}
              {hints[item.id] && !locked && (
                <FeedbackBadge tone="hint" visible={true}><strong>Hint:</strong> {hints[item.id]}</FeedbackBadge>
              )}

              {/* Error */}
              {error && (
                <div role="alert" style={{ background: '#fee2e2', color: '#991b1b', padding: 12, borderRadius: 10, marginTop: 12, fontWeight: 700, fontSize: 13 }}>
                  {error}
                </div>
              )}

              {/* Feedback */}
              {activeFeedback && (
                <div style={{ marginTop: 14 }}>
                  <FeedbackBadge tone={solved ? 'correct' : locked ? 'info' : 'wrong'} visible={true}>
                    <strong>
                      {activeFeedback.resumed ? '✔ Already answered.'
                        : solved ? '✅ Correct! Well done!'
                        : locked ? '🌱 Here is the correct order:'
                        : '❌ Not quite. Try another order.'}
                    </strong>
                    {correctSteps.length > 0 && (
                      <ol aria-label="Correct order" style={{ margin: '8px 0 0', paddingLeft: 22 }}>
                        {correctSteps.map((s) => <li key={s.id} style={{ fontSize: 13 }}>{s.content}</li>)}
                      </ol>
                    )}
                    {locked && activeFeedback.explanation && (
                      <p style={{ margin: '6px 0 0', fontSize: 13 }}>{activeFeedback.explanation}</p>
                    )}
                  </FeedbackBadge>
                </div>
              )}

              {/* Submit / Next */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
                {!locked ? (
                  <button type="button" className="btn btn-primary" disabled={submitting} onClick={submit}>
                    {submitting ? 'Checking…' : 'Submit answer'}
                  </button>
                ) : (
                  <button type="button" className="btn btn-primary" disabled={submitting} onClick={next}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {submitting ? 'Saving…' : current === items.length - 1 ? '🏁 Finish game' : 'Next question →'}
                    {!submitting && current < items.length - 1 && <ChevronRight size={16} />}
                  </button>
                )}
              </div>
            </motion.section>
          </AnimatePresence>
        </div>

        <p style={{ textAlign: 'center', color: '#688097', fontSize: 12, fontWeight: 700, marginTop: 14 }}>
          ⭐ {answeredCount} of {items.length} questions completed
        </p>
      </main>
    </div>
  );
}
