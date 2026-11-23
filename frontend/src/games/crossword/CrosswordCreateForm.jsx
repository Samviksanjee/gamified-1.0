/**
 * CrosswordCreateForm — Phase 7B
 *
 * Teacher creation form for the AI-powered crossword game.
 * Same prop contract as PuzzleCreateForm / QuizCreateForm.
 *
 * Props:
 *   selectedGameType  string   — must equal 'crossword' for submission
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

const GRADES = Array.from({ length: 12 }, (_, i) => i + 1);

export default function CrosswordCreateForm({ selectedGameType, onStatus, onError, onNotice }) {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [gradeLevel, setGradeLevel] = useState('');
  const [wordCount, setWordCount] = useState('');
  const [instructions, setInstructions] = useState('');
  const [assistMode, setAssistMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const inFlight = useRef(false);

  const submit = async (e) => {
    e.preventDefault();

    if (selectedGameType !== 'crossword') {
      return onError('Crossword requests can only be sent from the Crossword form.');
    }
    if (!topic.trim()) {
      return onError('Enter an educational topic before generating.');
    }
    if (inFlight.current) return;

    inFlight.current = true;
    setLoading(true);
    onError('');
    onStatus({ state: 'loading' });

    try {
      const result = await api.crossword.generate({
        game_type: 'crossword',
        topic: topic.trim(),
        difficulty,
        grade_level: gradeLevel ? Number(gradeLevel) : null,
        word_count: wordCount ? Number(wordCount) : null,
        instructions: instructions.trim() || null,
        assist_mode: assistMode,
      });

      onStatus({ state: 'ready', draftId: result.id });
    } catch (err) {
      onError(err.message || 'Crossword generation failed. Please try again.');
      onStatus({ state: 'error', error: err.message });
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} data-game-form="crossword" style={{ display: 'grid', gap: 18 }}>
      {/* Topic */}
      <label>
        <span style={labelStyle}>1. Educational topic</span>
        <input
          style={fieldStyle}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Human Digestive System, Solar System, Ancient Egypt"
          required
          aria-required="true"
          aria-label="Crossword topic"
        />
        <span style={{ display: 'block', marginTop: 4, fontSize: 11, color: '#688097' }}>
          The AI will generate educational words, clues, and hints for this topic.
        </span>
      </label>

      {/* Difficulty + Grade + Word Count */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
        <label>
          <span style={labelStyle}>2. Difficulty</span>
          <select
            style={fieldStyle}
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            aria-label="Difficulty"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>

        <label>
          <span style={labelStyle}>3. Grade level (optional)</span>
          <select
            style={fieldStyle}
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value)}
            aria-label="Grade level"
          >
            <option value="">Not specified</option>
            {GRADES.map((g) => (
              <option key={g} value={g}>Grade {g}</option>
            ))}
          </select>
        </label>

        <label>
          <span style={labelStyle}>4. Word count (optional)</span>
          <input
            type="number"
            min="5"
            max="25"
            style={fieldStyle}
            value={wordCount}
            onChange={(e) => setWordCount(e.target.value)}
            placeholder="Default: auto"
            aria-label="Word count"
          />
        </label>
      </div>

      {/* Instructions */}
      <label>
        <span style={labelStyle}>5. Instructions (optional)</span>
        <textarea
          style={{ ...fieldStyle, minHeight: 70, resize: 'vertical' }}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="e.g. Focus on vocabulary from Chapter 3"
          aria-label="Instructions"
        />
      </label>

      {/* Assist Mode */}
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={assistMode}
          onChange={(e) => setAssistMode(e.target.checked)}
          style={{ width: 16, height: 16, marginTop: 2, flexShrink: 0 }}
          aria-label="Assist mode"
        />
        <span>
          <span style={{ display: 'block', fontWeight: 900, fontSize: 13, color: '#153e67' }}>
            Assist mode
          </span>
          <span style={{ display: 'block', fontSize: 11, color: '#688097' }}>
            Students can check letters, check words, and reveal letters.
          </span>
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
        🔤 <strong>How it works:</strong> The AI generates educational words, clues, and hints
        based on your topic. A layout engine arranges them into a valid crossword grid.
        You review and edit before publishing.
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ color: '#688097', fontSize: 11 }}>
          Nothing is published until you approve and assign to a classroom.
        </span>
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
          aria-busy={loading}
        >
          {loading ? '🔤 Generating crossword…' : '🔤 Generate Crossword'}
        </button>
      </div>
    </form>
  );
}
