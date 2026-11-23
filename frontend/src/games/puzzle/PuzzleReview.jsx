/**
 * PuzzleReview — Phase 3
 *
 * Self-contained teacher review screen for a puzzle activity.
 * Handles:
 *   - Full image display with status badge
 *   - Piece-grid preview (correct order, teacher only)
 *   - Approve, Regenerate (with optional refine prompt), Delete
 *   - Publish modal (classrooms + scheduling)
 *   - Version history counter / regeneration limit indicator
 *
 * SECURITY: This is teacher-only. Piece correct_index/row_num/col_num
 * values are shown here so teachers can verify the image before approval.
 * They are stripped from all student-facing API calls (see api.puzzle.*).
 *
 * Props:
 *   activityId   string|number  — from useParams() / ReviewPage
 *   onRefresh    fn (optional)  — called after any mutation so ReviewPage
 *                                 can reload its own activity state
 */
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, assetUrl } from '../../api.js';

/* ── design tokens (match existing teal theme) ───────────────────────── */
const TEAL = '#12a99f';
const TEAL_LIGHT = '#e8f9f5';
const BORDER = '#e0eaed';
const TEXT = '#153e67';
const MUTED = '#688097';
const DANGER_BG = '#ffe9e7';
const DANGER_TEXT = '#a63c3c';
const SUCCESS_BG = '#eaf8f3';
const SUCCESS_TEXT = '#147d81';

const card = {
  background: '#fff', border: `1px solid ${BORDER}`,
  borderRadius: 16, padding: 'clamp(16px,2vw,26px)',
};
const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  border: `1px solid ${BORDER}`, borderRadius: 9,
  padding: '9px 10px', fontFamily: 'inherit',
};

/* ── status badge helpers ─────────────────────────────────────────────── */
const STATUS_META = {
  pending:   { label: 'Generating…', color: '#b07300', bg: '#fff8df', icon: '⏳' },
  ready:     { label: 'Ready to review', color: '#12864e', bg: '#dff6e8', icon: '✅' },
  approved:  { label: 'Approved',    color: '#127a6e', bg: TEAL_LIGHT,  icon: '✓' },
  superseded:{ label: 'Superseded',  color: MUTED,     bg: '#f4f6f8',   icon: '↩' },
  none:      { label: 'No image yet', color: MUTED,    bg: '#f4f6f8',   icon: '—' },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.none;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 11px', borderRadius: 20, fontSize: 12, fontWeight: 700,
      color: meta.color, background: meta.bg,
    }}>
      {meta.icon} {meta.label}
    </span>
  );
}

/* ── piece grid (teacher sees correct order) ─────────────────────────── */
function PieceGrid({ pieces, gridSize }) {
  if (!pieces || pieces.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 30, color: MUTED }}>
        Piece preview will appear once the image is ready.
      </div>
    );
  }

  const maxCellPx = Math.min(80, Math.floor(360 / gridSize));
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${gridSize}, ${maxCellPx}px)`,
    gridTemplateRows: `repeat(${gridSize}, ${maxCellPx}px)`,
    gap: 2,
  };
  // Sort by correct_index to reconstruct the image in teacher preview
  const sorted = [...pieces].sort((a, b) => a.correct_index - b.correct_index);

  return (
    <div style={gridStyle} aria-label="Puzzle piece grid preview (correct order)">
      {sorted.map((piece) => (
        <div
          key={piece.id}
          title={`Piece ${piece.correct_index} (row ${piece.row_num}, col ${piece.col_num})`}
          style={{
            width: maxCellPx, height: maxCellPx,
            backgroundImage: `url(${assetUrl(piece.piece_url)})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            border: `1px solid ${BORDER}`, borderRadius: 3,
          }}
          aria-label={`Piece ${piece.correct_index}`}
        />
      ))}
    </div>
  );
}

/* ── publish modal (puzzle-specific, simplified) ─────────────────────── */
function PuzzlePublishModal({ activityId, onDone, onCancel }) {
  const [classrooms, setClassrooms] = useState([]);
  const [form, setForm] = useState({
    classroom_ids: [], title: '', instructions: '', max_attempts: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.classrooms()
      .then((data) => setClassrooms(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const toggle = (id) =>
    setForm((prev) => ({
      ...prev,
      classroom_ids: prev.classroom_ids.includes(id)
        ? prev.classroom_ids.filter((c) => c !== id)
        : [...prev.classroom_ids, id],
    }));

  const submit = async () => {
    if (!form.classroom_ids.length) {
      setError('Select at least one classroom.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.puzzle.publish(activityId, {
        classroom_ids: form.classroom_ids,
        title: form.title || undefined,
        instructions: form.instructions || undefined,
        max_attempts: form.max_attempts ? Number(form.max_attempts) : undefined,
      });
      onDone();
    } catch (err) {
      setError(err.message || 'Publish failed.');
      setSaving(false);
    }
  };

  return (
    <div
      role="presentation"
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(10,30,50,.45)',
        display: 'grid', placeItems: 'center', padding: 16,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="puzzle-publish-title"
        style={{
          width: 'min(100%, 520px)', maxHeight: '90vh',
          overflowY: 'auto', background: '#fff',
          borderRadius: 20, padding: 24,
        }}
      >
        <h2 id="puzzle-publish-title" style={{ color: TEXT }}>Publish puzzle</h2>

        <div style={{ display: 'grid', gap: 12 }}>
          <label>
            Title (optional)
            <input
              style={inputStyle}
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Puzzle title shown to students"
            />
          </label>

          <label>
            Instructions (optional)
            <textarea
              style={{ ...inputStyle, minHeight: 70 }}
              value={form.instructions}
              onChange={(e) => setForm((p) => ({ ...p, instructions: e.target.value }))}
              placeholder="Instructions for students"
            />
          </label>

          <fieldset style={{ border: `1px solid ${BORDER}`, borderRadius: 9, padding: 12 }}>
            <legend style={{ color: TEXT, fontWeight: 700, fontSize: 13 }}>
              Assign to classrooms *
            </legend>
            {classrooms.length === 0 && (
              <p style={{ color: MUTED, fontSize: 13 }}>No classrooms available.</p>
            )}
            {classrooms.map((room) => (
              <label
                key={room.id}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}
              >
                <input
                  type="checkbox"
                  checked={form.classroom_ids.includes(room.id)}
                  onChange={() => toggle(room.id)}
                />
                <span>{room.name}</span>
              </label>
            ))}
          </fieldset>

          <label>
            Maximum attempts (optional)
            <input
              type="number"
              min="1"
              max="100"
              style={inputStyle}
              value={form.max_attempts}
              onChange={(e) => setForm((p) => ({ ...p, max_attempts: e.target.value }))}
              placeholder="Unlimited if blank"
            />
          </label>

          {error && (
            <div role="alert" style={{ color: DANGER_TEXT, background: DANGER_BG, padding: 10, borderRadius: 8 }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button className="btn btn-soft" onClick={onCancel} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? 'Publishing…' : '🚀 Publish'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── main component ───────────────────────────────────────────────────── */
export default function PuzzleReview({ activityId, onRefresh }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showRegen, setShowRegen] = useState(false);
  const [refinePrompt, setRefinePrompt] = useState('');
  const [showPublish, setShowPublish] = useState(false);

  const load = useCallback(async () => {
    if (!activityId) return;
    setLoading(true);
    setError('');
    try {
      const result = await api.puzzle.getReview(activityId);
      setData(result);
    } catch (err) {
      setError(err.message || 'Could not load puzzle review.');
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  useEffect(() => { load(); }, [load]);

  const withSave = async (fn) => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await fn();
      await load();
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err.message || 'Operation failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = () =>
    withSave(async () => {
      await api.puzzle.approve(activityId, data.image.id);
      setSuccess('Image approved. You can now publish this puzzle.');
    });

  const handleRegenerate = () =>
    withSave(async () => {
      setShowRegen(false);
      await api.puzzle.regenerate(activityId, refinePrompt);
      setRefinePrompt('');
      setSuccess('New image generated. Review and approve it before publishing.');
    });

  const handleDelete = async () => {
    if (!window.confirm('Delete this puzzle and all its images? This cannot be undone.')) return;
    setSaving(true);
    try {
      await api.puzzle.delete(activityId);
      navigate('/drafts');
    } catch (err) {
      setError(err.message || 'Delete failed.');
      setSaving(false);
    }
  };

  /* ── render helpers ───────────────────────────────────────────────── */
  if (loading) {
    return (
      <div style={{ ...card, textAlign: 'center', padding: 40 }}>
        <p role="status" style={{ color: MUTED }}>Loading puzzle review…</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div role="alert" style={{ ...card, color: DANGER_TEXT, background: DANGER_BG }}>
        {error}
      </div>
    );
  }

  if (!data) return null;

  const img = data.image;
  const imageStatus = img?.status || 'none';
  const canApprove = imageStatus === 'ready' && img?.pieces_ready === img?.total_pieces;
  const canPublish = imageStatus === 'approved';
  const regenUsed = data.version_history_count;
  const regenRemaining = data.max_regenerations - regenUsed;

  return (
    <section data-game-review="puzzle" aria-label="Puzzle review">
      {/* ── feedback banners ── */}
      {error && (
        <div role="alert" style={{ background: DANGER_BG, color: DANGER_TEXT, padding: 12, borderRadius: 10, marginBottom: 14 }}>
          ⚠ {error}
        </div>
      )}
      {success && (
        <div role="status" style={{ background: SUCCESS_BG, color: SUCCESS_TEXT, padding: 12, borderRadius: 10, marginBottom: 14 }}>
          ✓ {success}
        </div>
      )}

      {/* ── image panel ── */}
      <div style={{ ...card, marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
          <div>
            <h2 style={{ color: TEXT, margin: 0 }}>{data.title}</h2>
            <p style={{ color: MUTED, margin: '4px 0 0', fontSize: 13 }}>
              {data.topic && `Topic: ${data.topic} · `}
              {img && `${img.grid_size}×${img.grid_size} grid · ${img.total_pieces} pieces`}
            </p>
          </div>
          <StatusBadge status={imageStatus} />
        </div>

        {/* Full image */}
        {img?.full_image_url ? (
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: 12, color: MUTED, marginBottom: 6 }}>Full image</p>
              <img
                src={assetUrl(img.full_image_url)}
                alt={`Puzzle: ${data.title}`}
                style={{ maxWidth: 280, maxHeight: 280, borderRadius: 10, border: `1px solid ${BORDER}` }}
              />
            </div>
            <div>
              <p style={{ fontSize: 12, color: MUTED, marginBottom: 6 }}>
                Piece grid preview (correct order — teacher only)
              </p>
              <PieceGrid pieces={data.pieces} gridSize={img.grid_size} />
              {img.pieces_ready < img.total_pieces && (
                <p style={{ fontSize: 11, color: MUTED, marginTop: 6 }}>
                  {img.pieces_ready}/{img.total_pieces} pieces ready
                </p>
              )}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: MUTED, background: '#f8fafd', borderRadius: 10 }}>
            🧩 No image yet. Create the puzzle to generate one.
          </div>
        )}

        {/* Prompt used */}
        {img?.openai_prompt && (
          <details style={{ marginTop: 14 }}>
            <summary style={{ color: MUTED, fontSize: 12, cursor: 'pointer' }}>View AI prompt used</summary>
            <pre style={{ fontSize: 11, color: MUTED, whiteSpace: 'pre-wrap', marginTop: 6 }}>
              {img.openai_prompt}
            </pre>
          </details>
        )}
      </div>

      {/* ── regenerate panel ── */}
      {showRegen && (
        <div style={{ ...card, marginBottom: 18 }}>
          <h3 style={{ color: TEXT, marginTop: 0 }}>Regenerate image</h3>
          <p style={{ color: MUTED, fontSize: 13 }}>
            The current image will remain active until the new one is fully ready.
          </p>
          <label style={{ display: 'block', marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: TEXT }}>
              Refine prompt (optional)
            </span>
            <input
              style={inputStyle}
              value={refinePrompt}
              onChange={(e) => setRefinePrompt(e.target.value)}
              placeholder="e.g. make the planets larger and more colourful"
            />
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-primary"
              disabled={saving}
              onClick={handleRegenerate}
              aria-busy={saving}
            >
              {saving ? '🎨 Generating…' : '🔄 Generate new image'}
            </button>
            <button
              className="btn btn-soft"
              disabled={saving}
              onClick={() => { setShowRegen(false); setRefinePrompt(''); }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── action bar ── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {canApprove && (
          <button className="btn btn-primary" disabled={saving} onClick={handleApprove}>
            ✓ Approve image
          </button>
        )}
        {canPublish && (
          <button className="btn btn-primary" disabled={saving} onClick={() => setShowPublish(true)}>
            🚀 Publish to classes
          </button>
        )}
        {/* Unpublish option for already-published puzzles */}
        {imageStatus === 'approved' && !canPublish && data.image?.approved_at && (
          <button
            className="btn btn-soft"
            disabled={saving}
            onClick={() => withSave(async () => {
              await api.puzzle.unpublish(activityId);
              setSuccess('Puzzle unpublished. Students can no longer see it.');
            })}
          >
            ⏸ Unpublish
          </button>
        )}
        {img && !showRegen && (
          <button
            className="btn btn-soft"
            disabled={saving || regenRemaining <= 0}
            onClick={() => setShowRegen(true)}
            title={regenRemaining <= 0 ? 'Maximum regenerations reached' : undefined}
          >
            ↺ Regenerate image
            {regenRemaining > 0 && (
              <span style={{ marginLeft: 6, fontSize: 11, color: MUTED }}>
                ({regenRemaining} left)
              </span>
            )}
          </button>
        )}
        <button
          className="btn"
          disabled={saving}
          onClick={handleDelete}
          style={{ marginLeft: 'auto', color: DANGER_TEXT }}
        >
          🗑 Delete puzzle
        </button>
        <button className="btn btn-soft" onClick={() => navigate('/drafts')}>
          ← Back to drafts
        </button>
        <button className="btn btn-soft" onClick={() => navigate(`/puzzle-results/${activityId}`)}>
          📊 View results
        </button>
      </div>

      {/* ── version history info ── */}
      {data.version_history_count > 0 && (
        <p style={{ fontSize: 12, color: MUTED, marginTop: 12 }}>
          Version history: {data.version_history_count} image(s) generated ·
          {regenRemaining > 0
            ? ` ${regenRemaining} regeneration(s) remaining`
            : ' Maximum regenerations reached'}
        </p>
      )}

      {/* ── publish modal ── */}
      {showPublish && (
        <PuzzlePublishModal
          activityId={activityId}
          onDone={() => {
            setShowPublish(false);
            load();
            if (onRefresh) onRefresh();
            setSuccess('Puzzle published successfully! Students can now play.');
          }}
          onCancel={() => setShowPublish(false)}
        />
      )}
    </section>
  );
}
