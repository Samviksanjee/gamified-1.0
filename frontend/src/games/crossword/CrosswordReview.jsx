/**
 * CrosswordReview — Phase 7C
 *
 * Teacher review screen for a crossword activity.
 * Handles grid preview, word editing, add/delete words,
 * regenerate, relayout, approve, publish, and results/play links.
 *
 * Props:
 *   gameType     string         — should be 'crossword'
 *   activityId   string|number  — from ReviewPage
 *   items        array          — ignored (crossword manages own state)
 *   editable     bool           — ignored (crossword manages own lifecycle)
 *   onChange     fn             — ignored
 *   onRefresh    fn             — called after any mutation
 */
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';

/* ── design tokens ────────────────────────────────────────────────────── */
const TEAL = '#12a99f';
const TEAL_LIGHT = '#e8f9f5';
const BORDER = '#e0eaed';
const TEXT = '#153e67';
const MUTED = '#688097';
const DANGER_BG = '#ffe9e7';
const DANGER_TEXT = '#a63c3c';
const SUCCESS_BG = '#eaf8f3';
const SUCCESS_TEXT = '#147d81';
const WARN_BG = '#fff8df';
const WARN_TEXT = '#7a5c00';

const card = {
  background: '#fff', border: `1px solid ${BORDER}`,
  borderRadius: 16, padding: 'clamp(14px,2vw,22px)', marginBottom: 16,
};
const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  border: `1px solid ${BORDER}`, borderRadius: 9,
  padding: '8px 10px', fontFamily: 'inherit', fontSize: 13,
};
const thStyle = {
  padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 900,
  color: MUTED, textTransform: 'uppercase', letterSpacing: '.6px',
  borderBottom: `2px solid ${BORDER}`, background: '#f8fdfd',
};
const tdStyle = { padding: '10px 12px', borderBottom: `1px solid ${BORDER}`, fontSize: 13, verticalAlign: 'middle' };

/* ── Grid preview ─────────────────────────────────────────────────────── */
function buildGrid(words, gridRows, gridCols) {
  const grid = Array.from({ length: gridRows }, () =>
    Array.from({ length: gridCols }, () => ({ blocked: true, number: null }))
  );
  for (const word of words) {
    const len = word.answer ? word.answer.length : 0;
    for (let i = 0; i < len; i++) {
      const r = word.direction === 'down' ? word.row + i : word.row;
      const c = word.direction === 'across' ? word.col + i : word.col;
      if (r >= 0 && r < gridRows && c >= 0 && c < gridCols) {
        grid[r][c].blocked = false;
        if (i === 0) grid[r][c].number = word.number;
      }
    }
  }
  return grid;
}

function GridPreview({ words, gridRows, gridCols }) {
  if (!words || words.length === 0 || !gridRows || !gridCols) {
    return <p style={{ color: MUTED, fontSize: 13 }}>Grid will appear once words are generated.</p>;
  }

  const grid = buildGrid(words, gridRows, gridCols);
  const cellPx = Math.min(28, Math.floor(Math.min(500, window.innerWidth - 80) / gridCols));

  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}
        aria-label="Crossword grid preview"
      >
        <tbody>
          {grid.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => (
                <td
                  key={c}
                  style={{
                    width: cellPx, height: cellPx, border: '1px solid #ccc',
                    background: cell.blocked ? '#333' : '#fff',
                    position: 'relative', padding: 0,
                  }}
                  aria-label={cell.blocked ? 'blocked' : `cell ${r},${c}`}
                >
                  {!cell.blocked && cell.number != null && (
                    <span style={{
                      position: 'absolute', top: 1, left: 2,
                      fontSize: Math.max(7, cellPx / 4), color: '#555', lineHeight: 1,
                    }}>
                      {cell.number}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Inline word editor ───────────────────────────────────────────────── */
function WordRow({ word, activityId, isPublished, onRefresh, onError }) {
  const [editField, setEditField] = useState(null); // 'clue' | 'hint' | null
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  const startEdit = (field) => {
    setEditField(field);
    setEditValue(word[field] || '');
  };

  const saveEdit = async () => {
    if (!editField) return;
    setSaving(true);
    try {
      await api.crossword.editWord(activityId, word.id, { [editField]: editValue });
      setEditField(null);
      onRefresh();
    } catch (err) {
      onError(err.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => { setEditField(null); setEditValue(''); };

  const handleDelete = async () => {
    if (!window.confirm(`Delete word "${word.answer}"? This cannot be undone.`)) return;
    setSaving(true);
    try {
      await api.crossword.deleteWord(activityId, word.id);
      onRefresh();
    } catch (err) {
      onError(err.message || 'Delete failed.');
      setSaving(false);
    }
  };

  return (
    <tr>
      <td style={tdStyle}><strong>{word.number}</strong></td>
      <td style={{ ...tdStyle, fontFamily: 'monospace', color: TEAL }}>{word.answer}</td>
      <td style={tdStyle}>
        {editField === 'clue' ? (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              style={{ ...inputStyle, flex: 1 }}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              aria-label="Edit clue"
              autoFocus
            />
            <button className="btn btn-primary" disabled={saving} onClick={saveEdit} style={{ padding: '5px 10px', fontSize: 12 }}>Save</button>
            <button className="btn btn-soft" onClick={cancelEdit} style={{ padding: '5px 10px', fontSize: 12 }}>Cancel</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ flex: 1 }}>{word.clue}</span>
            {!isPublished && (
              <button
                className="btn btn-soft"
                onClick={() => startEdit('clue')}
                style={{ padding: '3px 8px', fontSize: 11 }}
                aria-label="Edit clue"
                disabled={isPublished}
              >
                Edit clue
              </button>
            )}
          </div>
        )}
      </td>
      <td style={tdStyle}>
        {editField === 'hint' ? (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              style={{ ...inputStyle, flex: 1 }}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              aria-label="Edit hint"
              autoFocus
            />
            <button className="btn btn-primary" disabled={saving} onClick={saveEdit} style={{ padding: '5px 10px', fontSize: 12 }}>Save</button>
            <button className="btn btn-soft" onClick={cancelEdit} style={{ padding: '5px 10px', fontSize: 12 }}>Cancel</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ flex: 1, fontSize: 12, color: MUTED }}>{word.hint || '—'}</span>
            {!isPublished && (
              <button
                className="btn btn-soft"
                onClick={() => startEdit('hint')}
                style={{ padding: '3px 8px', fontSize: 11 }}
                aria-label="Edit hint"
                disabled={isPublished}
              >
                Edit hint
              </button>
            )}
          </div>
        )}
      </td>
      <td style={tdStyle}>
        {!isPublished && (
          <button
            className="btn"
            style={{ color: DANGER_TEXT, padding: '3px 8px', fontSize: 11 }}
            onClick={handleDelete}
            disabled={saving || isPublished}
            aria-label={`Delete word ${word.answer}`}
          >
            Delete
          </button>
        )}
      </td>
    </tr>
  );
}

/* ── Add word form ────────────────────────────────────────────────────── */
function AddWordForm({ activityId, isPublished, onRefresh, onError }) {
  const [answer, setAnswer] = useState('');
  const [clue, setClue] = useState('');
  const [hint, setHint] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!answer.trim() || !clue.trim()) return;
    setSaving(true);
    try {
      await api.crossword.addWord(activityId, {
        answer: answer.trim().toUpperCase(),
        clue: clue.trim(),
        hint: hint.trim() || null,
      });
      setAnswer(''); setClue(''); setHint('');
      onRefresh();
    } catch (err) {
      onError(err.message || 'Add word failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr auto', gap: 8, alignItems: 'end' }}>
      <label>
        <span style={{ fontSize: 11, fontWeight: 700, color: TEXT, display: 'block', marginBottom: 4 }}>Answer *</span>
        <input
          style={inputStyle}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="WORD"
          required
          disabled={isPublished}
          aria-label="New word answer"
        />
      </label>
      <label>
        <span style={{ fontSize: 11, fontWeight: 700, color: TEXT, display: 'block', marginBottom: 4 }}>Clue *</span>
        <input
          style={inputStyle}
          value={clue}
          onChange={(e) => setClue(e.target.value)}
          placeholder="What is this word?"
          required
          disabled={isPublished}
          aria-label="New word clue"
        />
      </label>
      <label>
        <span style={{ fontSize: 11, fontWeight: 700, color: TEXT, display: 'block', marginBottom: 4 }}>Hint</span>
        <input
          style={inputStyle}
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          placeholder="Optional hint"
          disabled={isPublished}
          aria-label="New word hint"
        />
      </label>
      <button
        type="submit"
        className="btn btn-primary"
        disabled={saving || isPublished}
        style={{ padding: '8px 14px', fontSize: 12 }}
      >
        {saving ? 'Adding…' : '+ Add'}
      </button>
    </form>
  );
}

/* ── Publish modal ────────────────────────────────────────────────────── */
function CrosswordPublishModal({ activityId, onDone, onCancel }) {
  const [classrooms, setClassrooms] = useState([]);
  const [classroomIds, setClassroomIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.classrooms().then((d) => setClassrooms(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const toggle = (id) =>
    setClassroomIds((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);

  const submit = async () => {
    if (!classroomIds.length) { setError('Select at least one classroom.'); return; }
    setSaving(true); setError('');
    try {
      await api.crossword.publish(activityId, { classroom_ids: classroomIds });
      onDone();
    } catch (err) {
      setError(err.message || 'Publish failed.');
      setSaving(false);
    }
  };

  return (
    <div role="presentation" style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(10,30,50,.45)', display: 'grid', placeItems: 'center', padding: 16 }}>
      <div role="dialog" aria-modal="true" aria-labelledby="cw-publish-title" style={{ width: 'min(100%, 420px)', background: '#fff', borderRadius: 20, padding: 24 }}>
        <h2 id="cw-publish-title" style={{ color: TEXT }}>Publish crossword</h2>
        <fieldset style={{ border: `1px solid ${BORDER}`, borderRadius: 9, padding: 12, marginBottom: 14 }}>
          <legend style={{ color: TEXT, fontWeight: 700, fontSize: 13 }}>Assign to classrooms *</legend>
          {classrooms.length === 0 && <p style={{ color: MUTED, fontSize: 13 }}>No classrooms available.</p>}
          {classrooms.map((room) => (
            <label key={room.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
              <input type="checkbox" checked={classroomIds.includes(room.id)} onChange={() => toggle(room.id)} />
              <span>{room.name}</span>
            </label>
          ))}
        </fieldset>
        {error && <div role="alert" style={{ color: DANGER_TEXT, background: DANGER_BG, padding: 8, borderRadius: 8, marginBottom: 10 }}>{error}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="btn btn-soft" onClick={onCancel} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>{saving ? 'Publishing…' : '🚀 Publish'}</button>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────────── */
export default function CrosswordReview({ activityId, onRefresh }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPublish, setShowPublish] = useState(false);

  const load = useCallback(async () => {
    if (!activityId) return;
    setLoading(true); setError('');
    try {
      const result = await api.crossword.get(activityId);
      setData(result);
    } catch (err) {
      setError(err.message || 'Could not load crossword.');
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = useCallback(() => {
    load();
    if (onRefresh) onRefresh();
  }, [load, onRefresh]);

  const withSave = async (fn, msg) => {
    setSaving(true); setError(''); setSuccess('');
    try {
      await fn();
      await load();
      if (onRefresh) onRefresh();
      if (msg) setSuccess(msg);
    } catch (err) {
      setError(err.message || 'Operation failed.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={card}><p role="status" style={{ color: MUTED }}>Loading crossword review…</p></div>;
  if (error && !data) return <div role="alert" style={{ ...card, color: DANGER_TEXT, background: DANGER_BG }}>{error}</div>;
  if (!data) return null;

  const words = data.words || [];
  const status = data.status;
  const isPublished = status === 'published';
  const acrossWords = words.filter((w) => w.direction === 'across');
  const downWords = words.filter((w) => w.direction === 'down');

  return (
    <section data-game-review="crossword" aria-label="Crossword review">
      {/* Feedback banners */}
      {error && <div role="alert" style={{ background: DANGER_BG, color: DANGER_TEXT, padding: 12, borderRadius: 10, marginBottom: 12 }}>⚠ {error}</div>}
      {success && <div role="status" style={{ background: SUCCESS_BG, color: SUCCESS_TEXT, padding: 12, borderRadius: 10, marginBottom: 12 }}>✓ {success}</div>}

      {/* Published notice */}
      {isPublished && (
        <div role="status" style={{ background: WARN_BG, color: WARN_TEXT, border: `1px solid #e8d98a`, padding: '12px 16px', borderRadius: 12, marginBottom: 16, fontWeight: 600 }}>
          ⚠ This crossword is published. Unpublish it to make edits.
        </div>
      )}

      {/* Header info */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
          <div>
            <h2 style={{ color: TEXT, margin: 0 }}>{data.title || data.topic}</h2>
            <p style={{ color: MUTED, margin: '4px 0 0', fontSize: 13 }}>
              Difficulty: {data.difficulty}
              {data.grade_level ? ` · Grade ${data.grade_level}` : ''}
              {` · ${data.grid_rows}×${data.grid_cols} grid`}
              {` · ${words.length} words`}
            </p>
            <p style={{ color: MUTED, fontSize: 12, margin: '4px 0 0' }}>
              Regenerations: {data.regen_count ?? 0}/{data.regen_limit ?? 5} ·{' '}
              Status: <strong style={{ color: isPublished ? '#0d7a72' : '#a77818' }}>{status}</strong>
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link to={`/play/crossword/${activityId}`} style={{ fontSize: 12, color: TEAL, fontWeight: 700 }}>
              ▶ Test Play
            </Link>
            <Link to={`/crossword-results/${activityId}`} style={{ fontSize: 12, color: TEAL, fontWeight: 700 }}>
              📊 View Results
            </Link>
          </div>
        </div>

        {/* Grid preview */}
        <GridPreview words={words} gridRows={data.grid_rows} gridCols={data.grid_cols} />
      </div>

      {/* Across words */}
      {acrossWords.length > 0 && (
        <div style={card}>
          <h3 style={{ color: TEXT, marginTop: 0 }}>Across ({acrossWords.length})</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Answer</th>
                  <th style={thStyle}>Clue</th>
                  <th style={thStyle}>Hint</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {acrossWords.map((word) => (
                  <WordRow
                    key={word.id}
                    word={word}
                    activityId={activityId}
                    isPublished={isPublished}
                    onRefresh={handleRefresh}
                    onError={setError}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Down words */}
      {downWords.length > 0 && (
        <div style={card}>
          <h3 style={{ color: TEXT, marginTop: 0 }}>Down ({downWords.length})</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Answer</th>
                  <th style={thStyle}>Clue</th>
                  <th style={thStyle}>Hint</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {downWords.map((word) => (
                  <WordRow
                    key={word.id}
                    word={word}
                    activityId={activityId}
                    isPublished={isPublished}
                    onRefresh={handleRefresh}
                    onError={setError}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add word form */}
      {!isPublished && (
        <div style={card}>
          <h3 style={{ color: TEXT, marginTop: 0 }}>Add a word</h3>
          <AddWordForm activityId={activityId} isPublished={isPublished} onRefresh={handleRefresh} onError={setError} />
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
        {!isPublished && (
          <>
            <button
              className="btn btn-soft"
              disabled={saving}
              onClick={() => withSave(() => api.crossword.regenerate(activityId, {}), 'Crossword regenerated.')}
            >
              ↺ Regenerate All
            </button>
            <button
              className="btn btn-soft"
              disabled={saving}
              onClick={() => withSave(() => api.crossword.relayout(activityId), 'Grid re-laid out.')}
            >
              ⊞ Re-layout
            </button>
          </>
        )}

        {status === 'draft' && !isPublished && (
          <button
            className="btn btn-primary"
            disabled={saving}
            onClick={() => withSave(() => api.crossword.approve(activityId), 'Crossword approved. Ready to publish.')}
          >
            ✓ Approve
          </button>
        )}

        {status === 'approved' && !isPublished && (
          <button
            className="btn btn-primary"
            disabled={saving}
            onClick={() => setShowPublish(true)}
          >
            🚀 Publish
          </button>
        )}

        {isPublished && (
          <button
            className="btn btn-soft"
            disabled={saving}
            onClick={() => withSave(() => api.crossword.unpublish(activityId), 'Crossword unpublished.')}
          >
            ⏸ Unpublish
          </button>
        )}

        <button
          className="btn"
          style={{ color: DANGER_TEXT, marginLeft: 'auto' }}
          disabled={saving}
          onClick={async () => {
            if (!window.confirm('Delete this crossword? This cannot be undone.')) return;
            setSaving(true);
            try {
              await api.crossword.delete(activityId);
              if (onRefresh) onRefresh();
            } catch (err) {
              setError(err.message || 'Delete failed.');
              setSaving(false);
            }
          }}
        >
          🗑 Delete
        </button>
      </div>

      {/* Publish modal */}
      {showPublish && (
        <CrosswordPublishModal
          activityId={activityId}
          onDone={() => {
            setShowPublish(false);
            load();
            if (onRefresh) onRefresh();
            setSuccess('Crossword published successfully!');
          }}
          onCancel={() => setShowPublish(false)}
        />
      )}
    </section>
  );
}
