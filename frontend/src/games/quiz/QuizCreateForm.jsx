import { useRef, useState } from 'react';
import { api } from '../../api.js';

const fieldStyle = { width: '100%', boxSizing: 'border-box', border: '1px solid #d8e5e9', borderRadius: 11, padding: '11px 12px', background: '#fff', color: '#23425e', fontSize: 14, fontFamily: 'inherit' };
const labelStyle = { display: 'block', marginBottom: 7, fontSize: 12, fontWeight: 900, color: '#153e67' };

export default function QuizCreateForm({ selectedGameType, onStatus, onError }) {
  const [form, setForm] = useState({ subject: 'Science', grade: 5, topic: '', count: 8, difficulty: 'medium', reference_material: '' });
  const [loading, setLoading] = useState(false);
  const inFlight = useRef(false);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event) => {
    event.preventDefault();
    if (selectedGameType !== 'quiz') return onError('Quiz requests can only be sent from the Quiz form.');
    if (!form.topic.trim()) return onError('Enter a topic before generating.');
    if (inFlight.current) return;
    inFlight.current = true; setLoading(true); onError(''); onStatus({ state: 'loading' });
    try {
      const topic = await api.quiz.createTopic({ grade: form.grade, subject: form.subject, title: form.topic.trim(), learning_objectives: [form.topic.trim()], reference_material: form.reference_material || null });
      const draft = await api.quiz.generate(topic.id, { game_type: 'quiz', difficulty: form.difficulty, questions_per_activity: form.count });
      if (Number.isInteger(draft.requested_count) && draft.generated_count !== draft.requested_count) {
        const rejected = draft.rejected_count ?? 'unknown';
        throw new Error(`Generation shortfall: requested=${draft.requested_count}, valid=${draft.generated_count ?? 0}, rejected=${rejected}, missing=${draft.requested_count - (draft.generated_count ?? 0)}. This draft is not ready for review.`);
      }
      onStatus({ state: 'ready', draftId: draft.id });
    } catch (error) { onError(error.message); onStatus({ state: 'error', error: error.message }); }
    finally { inFlight.current = false; setLoading(false); }
  };
  return <form onSubmit={submit} style={{ display: 'grid', gap: 17 }} data-game-form="quiz">
    <label><span style={labelStyle}>1. Choose class (optional)</span><select disabled style={fieldStyle}><option>Auto-created from topic</option></select></label>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14 }}>
      <label><span style={labelStyle}>2. Grade</span><select style={fieldStyle} value={form.grade} onChange={(event) => update('grade', Number(event.target.value))}>{Array.from({ length: 12 }, (_, index) => index + 1).map((grade) => <option key={grade} value={grade}>Grade {grade}</option>)}</select></label>
      <label><span style={labelStyle}>3. Subject</span><select style={fieldStyle} value={form.subject} onChange={(event) => update('subject', event.target.value)}><option>Science</option><option>Maths</option><option>English</option></select></label>
      <label><span style={labelStyle}>4. Difficulty</span><select style={fieldStyle} value={form.difficulty} onChange={(event) => update('difficulty', event.target.value)}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>
      <label><span style={labelStyle}>5. Number of questions</span><select style={fieldStyle} value={form.count} onChange={(event) => update('count', Number(event.target.value))}>{[5, 8, 10, 15, 20].map((count) => <option key={count} value={count}>{count}</option>)}</select></label>
    </div>
    <label><span style={labelStyle}>2. Topic / learning objective</span><input style={fieldStyle} value={form.topic} onChange={(event) => update('topic', event.target.value)} placeholder="e.g. Water cycle, fractions, nouns" /></label>
    <label><span style={labelStyle}>8. Add teaching material (optional)</span><input type="file" onChange={(event) => update('reference_material', event.target.files?.[0]?.name || '')} style={fieldStyle} /></label>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14 }}>
      <label><span style={labelStyle}>Subject</span><input style={fieldStyle} value={form.subject} onChange={(event) => update('subject', event.target.value)} required /></label>
      <label><span style={labelStyle}>Grade / class</span><select style={fieldStyle} value={form.grade} onChange={(event) => update('grade', Number(event.target.value))}>{Array.from({ length: 12 }, (_, index) => index + 1).map((grade) => <option key={grade} value={grade}>Grade {grade}</option>)}</select></label>
      <label><span style={labelStyle}>Difficulty</span><select style={fieldStyle} value={form.difficulty} onChange={(event) => update('difficulty', event.target.value)}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>
      <label><span style={labelStyle}>Questions</span><input type="number" min="1" max="50" style={fieldStyle} value={form.count} onChange={(event) => update('count', Number(event.target.value))} /></label>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}><span style={{ color: '#688097', fontSize: 11 }}>Nothing is published until you approve the draft.</span><button type="submit" disabled={loading} className="btn btn-primary">{loading ? 'Generating…' : '✨ Generate Quiz draft'}</button></div>
  </form>;
}
