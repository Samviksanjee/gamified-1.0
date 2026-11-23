import { useState } from 'react';
import { api } from '../../api.js';

const field = { width: '100%', boxSizing: 'border-box', border: '1px solid #d8e5e9', borderRadius: 9, padding: '8px 10px', fontFamily: 'inherit', fontSize: 14 };
const label = { display: 'block', fontSize: 11, fontWeight: 900, color: '#153e67', margin: '10px 0 4px' };

/** Mirrors the backend rules so the teacher sees problems before saving/approving. */
export function sequenceProblems(item) {
  const problems = [];
  if (!(item.prompt || '').trim()) problems.push('The question text is empty.');
  if (!(item.topic || '').trim()) problems.push('The topic is empty.');
  if (!(item.explanation || '').trim()) problems.push('The explanation is empty.');
  const steps = item.steps || [];
  if (steps.length < 2) problems.push('A sequence needs at least two steps.');
  if (steps.some((step) => !(step.content || '').trim())) problems.push('Every step needs text.');
  const texts = steps.map((step) => (step.content || '').trim().toLowerCase()).filter(Boolean);
  if (new Set(texts).size !== texts.length) problems.push('Two steps are identical.');
  if (new Set(steps.map((step) => step.id)).size !== steps.length) problems.push('Step IDs must be unique.');
  return problems;
}

export default function SequencingReview({ items, editable, onChange, activityId, onRefresh }) {
  const [busy, setBusy] = useState(null);
  const [message, setMessage] = useState('');
  const invalid = items.map(sequenceProblems).filter((list) => list.length).length;

  const update = (index, patch) => onChange(index, { ...items[index], ...patch });
  const move = (index, from, to) => {
    const steps = [...items[index].steps];
    if (to < 0 || to >= steps.length) return;
    [steps[from], steps[to]] = [steps[to], steps[from]];
    const renumbered = steps.map((step, position) => ({ ...step, correct_position: position + 1 }));
    update(index, { steps: renumbered, correct_order: renumbered.map((step) => step.id) });
  };
  const regenerate = async (index) => {
    const item = items[index];
    if (!item.question_id) return;
    if (!window.confirm('Replace this question with a newly generated one? Unsaved edits on the page are lost.')) return;
    setBusy(index); setMessage('');
    try { await api.sequencing.regenerateQuestion(activityId, item.question_id); await onRefresh?.(); setMessage(`Question ${index + 1} was regenerated.`); }
    catch (err) { setMessage(err.message || 'Could not regenerate this question. Please try again.'); }
    finally { setBusy(null); }
  };

  return <div data-game-review="sequencing" style={{ display: 'grid', gap: 14 }}>
    {invalid > 0 && <div role="alert" style={{ background: '#fff4d5', color: '#7a5a14', borderRadius: 10, padding: 12, fontWeight: 800 }}>
      ⚠ {invalid} of {items.length} question{items.length === 1 ? '' : 's'} need attention before this draft can be approved.
    </div>}
    {message && <div role="status" style={{ background: '#eaf8f3', color: '#147d81', borderRadius: 10, padding: 10 }}>{message}</div>}
    {items.map((item, index) => {
      const problems = sequenceProblems(item);
      return <article key={item.id || index} style={{ background: '#fff', border: `1px solid ${problems.length ? '#f0c36d' : '#e1eaed'}`, borderRadius: 13, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <strong style={{ color: '#12a99f' }}>Sequence {index + 1}</strong>
          <span style={{ fontSize: 11, fontWeight: 900, borderRadius: 999, padding: '2px 9px', background: problems.length ? '#fff4d5' : '#e5f8eb', color: problems.length ? '#7a5a14' : '#238650' }}>{problems.length ? 'Needs attention' : 'Looks valid'}</span>
          {editable && <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            {item.question_id && <button type="button" className="btn btn-soft" disabled={busy === index} onClick={() => regenerate(index)}>{busy === index ? 'Regenerating…' : '↻ Regenerate'}</button>}
            {items.length > 1 && <button type="button" className="btn btn-soft" aria-label={`Remove question ${index + 1}`} onClick={() => onChange(index, null)}>🗑 Remove</button>}
          </span>}
        </div>
        {problems.length > 0 && <ul style={{ color: '#7a5a14', fontSize: 12, margin: '8px 0 0', paddingLeft: 18 }}>{problems.map((problem) => <li key={problem}>{problem}</li>)}</ul>}
        {editable ? <>
          <label style={label} htmlFor={`seq-q-${index}`}>Question</label>
          <textarea id={`seq-q-${index}`} style={{ ...field, minHeight: 56 }} value={item.prompt || ''} onChange={(event) => update(index, { prompt: event.target.value })} />
          <label style={label} htmlFor={`seq-t-${index}`}>Topic</label>
          <input id={`seq-t-${index}`} style={field} value={item.topic || ''} onChange={(event) => update(index, { topic: event.target.value })} />
          <label style={label} htmlFor={`seq-e-${index}`}>Explanation shown to students after answering</label>
          <textarea id={`seq-e-${index}`} style={{ ...field, minHeight: 56 }} value={item.explanation || ''} onChange={(event) => update(index, { explanation: event.target.value })} />
        </> : <>
          <h3 style={{ color: '#153e67' }}>{item.prompt}</h3>
          <p style={{ color: '#688097', fontSize: 13 }}><strong>Topic:</strong> {item.topic}</p>
          <p style={{ color: '#688097', fontSize: 13 }}><strong>Explanation:</strong> {item.explanation}</p>
        </>}
        <div style={{ ...label, marginTop: 14 }}>Correct order (students see these shuffled)</div>
        {(item.steps || []).map((step, stepIndex) => <div key={step.id} style={{ display: 'flex', gap: 8, padding: '4px 0', alignItems: 'center' }}>
          <strong style={{ width: 22 }}>{stepIndex + 1}</strong>
          {editable
            ? <input aria-label={`Sequence item ${stepIndex + 1}`} style={field} value={step.content} onChange={(event) => update(index, { steps: item.steps.map((value, valueIndex) => valueIndex === stepIndex ? { ...value, content: event.target.value } : value) })} />
            : <span style={{ flex: 1 }}>{step.content}</span>}
          {editable && <>
            <button type="button" aria-label="Move item up" onClick={() => move(index, stepIndex, stepIndex - 1)} disabled={stepIndex === 0}>↑</button>
            <button type="button" aria-label="Move item down" onClick={() => move(index, stepIndex, stepIndex + 1)} disabled={stepIndex === item.steps.length - 1}>↓</button>
          </>}
        </div>)}
      </article>;
    })}
  </div>;
}
