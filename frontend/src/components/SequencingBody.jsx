import { useEffect, useState } from 'react';

export default function SequencingBody({ item, result, locked, onAnswer }) {
  const [order, setOrder] = useState(item.steps);
  const [marks, setMarks] = useState(null);

  useEffect(() => { onAnswer({ order: order.map((s) => s.id) }); }, []); // eslint-disable-line

  useEffect(() => {
    if (!result) return;
    setMarks(result.detail?.correct_positions || null);
    if (result.finished) {
      const byId = Object.fromEntries(item.steps.map((s) => [s.id, s]));
      setOrder(result.correct_answer.map((id) => byId[id]));
      setMarks(result.correct_answer.map(() => true));
    }
  }, [result]); // eslint-disable-line

  const move = (i, d) => {
    const next = [...order];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    setOrder(next);
    setMarks(null);
    onAnswer({ order: next.map((s) => s.id) });
  };

  return (
    <div className="sequencing">
      <p className="question">{item.prompt}</p>
      <p className="hint-text">Use the arrows to move each step up or down until the order is right.</p>
      <ol className="plain steps">
        {order.map((s, i) => (
          <li key={s.id} className={`seq ${marks ? (marks[i] ? 'right' : 'wrong') : ''}`}>
            <span className="num">{i + 1}</span>
            <span className="text">{s.text}</span>
            {marks && <span className="mark">{marks[i] ? '✓ Right place' : '✗ Not here'}</span>}
            <span className="movers">
              <button type="button" className="btn small" disabled={locked || i === 0} onClick={() => move(i, -1)} aria-label={`Move up: ${s.text}`}>↑</button>
              <button type="button" className="btn small" disabled={locked || i === order.length - 1} onClick={() => move(i, 1)} aria-label={`Move down: ${s.text}`}>↓</button>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
