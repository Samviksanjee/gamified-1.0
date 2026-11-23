/**
 * PuzzleCreateForm — Phase 3
 *
 * Teacher creation form for the AI-powered jigsaw puzzle game.
 * Separate from all other game creation flows; never imports quiz/sequencing code.
 *
 * Props (same interface as QuizCreateForm / SequencingCreateForm):
 *   selectedGameType  string   — must equal 'puzzle' for submission to proceed
 *   onStatus          fn       — call onStatus({ state, draftId, error })
 *   onError           fn       — call onError(message) for banner errors
 *   onNotice          fn       — optional informational notice
 */
import { useRef, useState } from 'react';
import { api } from '../../api.js';

const fieldStyle = {
  width: '100%', boxSizing: 'border-box',
  border: '1px solid #d8e5e9', borderRadius: 11,
  padding: '11px 12px', background: '#fff',
  color: '#23425e', fontSize: 14, fontFamily: 'inherit',
};
const labelStyle = {
  display: 'block', marginBottom: 7,
  fontSize: 12, fontWeight: 900, color: '#153e67',
};

const STYLES = [
  { value: '',                  label: 'Any style' },
  { value: 'cartoon',           label: 'Cartoon' },
  { value: 'realistic',         label: 'Realistic' },
  { value: 'flat_illustration', label: 'Flat illustration' },
];

const GRID_SIZES = [
  { value: 3, label: '3 × 3  (9 pieces, easier)' },
  { value: 6, label: '6 × 6  (36 pieces, harder)' },
];

const GRADES = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: `Grade ${i + 1}`,
}));

export default function PuzzleCreateForm({ selectedGameType, onStatus, onError, onNotice }) {
  const [form, setForm] = useState({
    topic: '',
    grid_size: 3,
    style: '',
    grade: '',       // '' means "not specified"
    refine_prompt: '',
  });
  const [loading, setLoading] = useState(false);
  const inFlight = useRef(false);

  const update = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();

    if (selectedGameType !== 'puzzle') {
      return onError('Puzzle requests can only be sent from the Puzzle form.');
    }
    if (!form.topic.trim()) {
      return onError('Enter an educational topic before generating.');
    }
    if (inFlight.current) return;

    inFlight.current = true;
    setLoading(true);
    onError('');
    onStatus({ state: 'loading' });

    try {
      const body = {
        game_type: 'puzzle',
        topic: form.topic.trim(),
        grid_size: form.grid_size,
        style: form.style || null,
        grade: form.grade ? Number(form.grade) : null,
        refine_prompt: form.refine_prompt.trim() || null,
      };

      const result = await api.puzzle.create(body);

      // result: { activity_id, puzzle_image_id, total_pieces, status, ... }
      onStatus({ state: 'ready', draftId: result.activity_id });
    } catch (error) {
      onError(error.message || 'Puzzle generation failed. Please try again.');
      onStatus({ state: 'error', error: error.message });
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      style={{ display: 'grid', gap: 18 }}
      data-game-form="puzzle"
    >
      {/* Topic */}
      <label>
        <span style={labelStyle}>1. Educational topic</span>
        <input
          style={fieldStyle}
          value={form.topic}
          onChange={(e) => update('topic', e.target.value)}
          placeholder="e.g. Solar System, Water Cycle, Ancient Egypt"
          required
          aria-required="true"
        />
        <span style={{ display: 'block', marginTop: 4, fontSize: 11, color: '#688097' }}>
          The AI will generate a colorful, child-friendly image of this topic.
        </span>
      </label>

      {/* Grid size + Style */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <label>
          <span style={labelStyle}>2. Grid size</span>
          <select
            style={fieldStyle}
            value={form.grid_size}
            onChange={(e) => update('grid_size', Number(e.target.value))}
          >
            {GRID_SIZES.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </label>

        <label>
          <span style={labelStyle}>3. Illustration style</span>
          <select
            style={fieldStyle}
            value={form.style}
            onChange={(e) => update('style', e.target.value)}
          >
            {STYLES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>

        <label>
          <span style={labelStyle}>4. Grade (optional)</span>
          <select
            style={fieldStyle}
            value={form.grade}
            onChange={(e) => update('grade', e.target.value)}
          >
            <option value="">Not specified</option>
            {GRADES.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Refine prompt */}
      <label>
        <span style={labelStyle}>5. Additional prompt (optional)</span>
        <input
          style={fieldStyle}
          value={form.refine_prompt}
          onChange={(e) => update('refine_prompt', e.target.value)}
          placeholder="e.g. include all eight planets, bright colors"
        />
        <span style={{ display: 'block', marginTop: 4, fontSize: 11, color: '#688097' }}>
          Extra guidance for the image. Leave blank to use defaults.
        </span>
      </label>

      {/* Info note */}
      <div
        role="note"
        style={{
          background: '#eef9ff', border: '1px solid #cde8f5',
          borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#356580',
        }}
      >
        🎨 <strong>How it works:</strong> The AI generates a single illustration,
        then slices it into {form.grid_size === 3 ? '9' : '36'} equal tiles.
        You review and approve the image before students can play.
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ color: '#688097', fontSize: 11 }}>
          Nothing is published until you approve the image.
        </span>
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
          aria-busy={loading}
        >
          {loading ? '🎨 Generating puzzle image…' : '🧩 Generate Puzzle'}
        </button>
      </div>
    </form>
  );
}
