import { useCallback, useRef, useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { WordPicture } from './gamification/QuestionVisual.jsx';
import '../styles/matching.css';

// Colours for the numbered "connection" badge shown on both halves of a matched pair.
const PAIR_COLORS = ['#12a99f', '#36a9db', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b', '#0ea5e9', '#84cc16'];
const WRONG_FLASH_MS = 900;

function LeftTile({ entry, state, onPick }) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: `left:${entry.id}`, disabled: state.locked || state.disabled });
  const cls = ['mg-tile', !state.locked && !state.disabled && 'mg-draggable', state.selected && 'mg-selected', state.locked && 'mg-correct', state.wrong && 'mg-wrong'].filter(Boolean).join(' ');
  return (
    <button ref={setNodeRef} {...attributes} {...listeners} type="button" className={cls} data-left-id={entry.id}
      aria-pressed={state.selected} disabled={state.locked} onClick={() => onPick(entry.id)}
      style={{ touchAction: 'manipulation' }}
      aria-label={`${entry.text}${state.locked ? ', matched correctly' : state.selected ? ', selected' : ''}`}>
      {state.number ? <span className="mg-badge" style={{ background: state.color }} aria-hidden="true">{state.number}</span> : <span className="mg-grip" aria-hidden="true">⋮⋮</span>}
      <WordPicture text={entry.text} size={40} /><span className="mg-text">{entry.text}</span>
      {state.locked && <span className="mg-tick" aria-hidden="true">✓</span>}
    </button>
  );
}

function RightTile({ entry, state, onPick }) {
  const { setNodeRef, isOver } = useDroppable({ id: `right:${entry.id}`, disabled: state.locked || state.disabled });
  const cls = ['mg-tile', state.selected && 'mg-selected', isOver && 'mg-over', state.locked && 'mg-correct', state.wrong && 'mg-wrong'].filter(Boolean).join(' ');
  return (
    <button ref={setNodeRef} type="button" className={cls} data-right-id={entry.id} aria-pressed={state.selected}
      disabled={state.locked} onClick={() => onPick(entry.id)}
      aria-label={`${entry.text}${state.locked ? ', matched correctly' : state.selected ? ', selected' : ''}`}>
      {state.number && <span className="mg-badge" style={{ background: state.color }} aria-hidden="true">{state.number}</span>}
      <WordPicture text={entry.text} size={40} /><span className="mg-text">{entry.text}</span>
      {state.locked && <span className="mg-tick" aria-hidden="true">✓</span>}
    </button>
  );
}

/**
 * Matching board for one pair set.
 *
 * Props:
 *  - item:      { lefts:[{id,text}], rights:[{id,text}], matched?:{leftId:rightId} }  (already shuffled by the server)
 *  - locked:    true once the whole set is finished
 *  - onCheck:   async (leftId, rightId) => ({ is_correct })  — the SERVER decides correctness
 *
 * Interaction: drag a left card onto a right card, OR tap one card then tap the other (either order).
 * Correct pairs lock; wrong pairs flash red and can simply be retried.
 */
export default function MatchingBody({ item, locked = false, onCheck }) {
  const [matched, setMatched] = useState(() => ({ ...(item.matched || {}) })); // leftId -> rightId
  const [selected, setSelected] = useState(null);   // { side: 'left'|'right', id }
  const [flash, setFlash] = useState(null);         // { left, right } while showing a wrong answer
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ text: '', tone: '' });
  const [dragging, setDragging] = useState(null);   // left id being dragged
  const order = useRef(Object.keys(item.matched || {}));  // order in which pairs were locked → badge numbers
  const busyRef = useRef(false);

  // Distance/delay constraints keep taps working and let touch users still scroll the page.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
  );

  const lefts = item.lefts || [];
  const rights = item.rights || [];
  const rightTaken = (rid) => Object.values(matched).includes(rid);
  const leftText = (id) => lefts.find((l) => l.id === id)?.text || '';

  const connect = useCallback(async (leftId, rightId) => {
    if (busyRef.current || locked || matched[leftId] || Object.values(matched).includes(rightId)) return;
    busyRef.current = true; setBusy(true); setSelected(null);
    try {
      const res = await onCheck(leftId, rightId);
      if (res?.is_correct) {
        order.current = [...order.current, leftId];
        setMatched((m) => ({ ...m, [leftId]: rightId }));
        setMessage({ text: res.finished ? '🎉 All pairs matched!' : '✅ Correct! Nice match.', tone: 'ok' });
      } else {
        setFlash({ left: leftId, right: rightId });
        setMessage({ text: 'Not quite — try another answer.', tone: 'bad' });
        setTimeout(() => setFlash(null), WRONG_FLASH_MS);
      }
    } catch (err) {
      setMessage({ text: err.message || 'Could not check that match. Please try again.', tone: 'bad' });
    } finally { busyRef.current = false; setBusy(false); }
  }, [locked, matched, onCheck]);

  const pickLeft = (id) => {
    if (busy || locked || matched[id]) return;
    if (selected?.side === 'right') return connect(id, selected.id);
    setSelected(selected?.side === 'left' && selected.id === id ? null : { side: 'left', id });
  };
  const pickRight = (id) => {
    if (busy || locked || rightTaken(id)) return;
    if (selected?.side === 'left') return connect(selected.id, id);
    setSelected(selected?.side === 'right' && selected.id === id ? null : { side: 'right', id });
  };

  const onDragStart = ({ active }) => { setDragging(String(active.id).slice(5)); setSelected(null); };
  const onDragEnd = ({ active, over }) => {
    setDragging(null);
    if (over && String(over.id).startsWith('right:')) connect(String(active.id).slice(5), String(over.id).slice(6));
  };

  const pairNumber = (leftId) => { const n = order.current.indexOf(leftId); return n === -1 ? 0 : n + 1; };
  const rightOwner = (rid) => Object.keys(matched).find((l) => matched[l] === rid);
  const total = lefts.length;
  const done = Object.keys(matched).length;

  return (
    <div className="mg" data-matching-board>
      <div className="mg-progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label="Pairs matched">
        <span style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
      </div>
      <p style={{ margin: '6px 0 14px', fontSize: 12, fontWeight: 800, color: '#688097' }}>{done} of {total} pairs matched</p>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
        <div className="mg-board">
          <div className="mg-col" role="group" aria-label="Match the following">
            <h3 className="mg-col-head">Match the following</h3>
            {lefts.map((entry) => {
              const n = pairNumber(entry.id);
              return <LeftTile key={entry.id} entry={entry} onPick={pickLeft} state={{
                locked: Boolean(matched[entry.id]), disabled: busy || locked, number: n, color: PAIR_COLORS[(n - 1) % PAIR_COLORS.length],
                selected: selected?.side === 'left' && selected.id === entry.id, wrong: flash?.left === entry.id }} />;
            })}
          </div>
          <div className="mg-col" role="group" aria-label="Correct answers">
            <h3 className="mg-col-head">Correct answers</h3>
            {rights.map((entry) => {
              const owner = rightOwner(entry.id);
              const n = owner ? pairNumber(owner) : 0;
              return <RightTile key={entry.id} entry={entry} onPick={pickRight} state={{
                locked: Boolean(owner), disabled: busy || locked, number: n, color: PAIR_COLORS[(n - 1) % PAIR_COLORS.length],
                selected: selected?.side === 'right' && selected.id === entry.id, wrong: flash?.right === entry.id }} />;
            })}
          </div>
        </div>
        <DragOverlay dropAnimation={null}>{dragging ? <div className="mg-ghost">{leftText(dragging)}</div> : null}</DragOverlay>
      </DndContext>

      <p className={`mg-status ${message.tone}`} role="status" aria-live="polite">{message.text}</p>
    </div>
  );
}
