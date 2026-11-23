/**
 * ResourcesPage — Published REPLAYs
 *
 * Shows all of the teacher's published activities (quiz, matching, sequencing)
 * AND published puzzle games.
 *
 * Each card has:
 *   • Unpublish — removes classroom assignments; activity becomes a draft again
 *   • Delete    — permanently deletes (asks for confirmation first)
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import TeacherLayout from '../components/TeacherLayout';
import PageHeader from '../components/PageHeader';
import { api, assetUrl } from '../api.js';

/* ── helpers ─────────────────────────────────────────────────────────────── */
function gameIcon(type) {
  return { quiz: '🎯', matching: '🔗', sequencing: '🔀', puzzle: '🧩', crossword: '🔤' }[type] || '📋';
}

function Toast({ msg, type = 'success', onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  const ok = type === 'success';
  return (
    <div role="alert" aria-live="polite" style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: ok ? '#e5f9eb' : '#ffe9e7',
      color: ok ? '#1d7a45' : '#c85a59',
      border: `1px solid ${ok ? '#8ddcac' : '#f5b8b5'}`,
      borderRadius: 12, padding: '14px 20px',
      fontWeight: 700, fontSize: 13,
      boxShadow: '0 4px 18px rgba(0,0,0,.10)',
    }}>
      {msg}
    </div>
  );
}

/* ── Activity card with unpublish + delete ───────────────────────────────── */
function ActivityReplayCard({ activity, onUnpublish, onDelete, onView, saving }) {
  return (
    <article style={{
      background: 'white', border: '1px solid #e0eaed',
      borderRadius: 16, padding: '18px', display: 'flex',
      flexDirection: 'column', gap: 12,
      boxShadow: '0 2px 8px rgba(24,63,93,0.05)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12, flexShrink: 0,
          background: '#eef8ff', display: 'grid', placeItems: 'center', fontSize: 20,
        }}>
          {gameIcon(activity.type)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 900, fontSize: 14, color: '#153e67',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {activity.title}
          </div>
          <div style={{ fontSize: 11, color: '#688097', marginTop: 2 }}>
            {activity.subject} · Grade {activity.grade} · {activity.type}
            {activity.questions > 0 ? ` · ${activity.questions} questions` : ''}
          </div>
        </div>
        <span style={{
          flexShrink: 0, padding: '3px 9px', borderRadius: 20,
          fontSize: 10, fontWeight: 900, background: '#e5f8eb', color: '#238650',
        }}>
          Published
        </span>
      </div>

      {/* Action row */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          onClick={onView}
          style={{
            flex: 1, minWidth: 80, padding: '8px 10px', borderRadius: 10,
            border: '1px solid #d8e5e9', background: '#f4f8f9',
            color: '#153e67', fontWeight: 800, cursor: 'pointer', fontSize: 12,
          }}
        >
          📊 Results
        </button>
        <button
          onClick={onUnpublish}
          disabled={saving}
          style={{
            flex: 1, minWidth: 80, padding: '8px 10px', borderRadius: 10,
            border: '1px solid #e0eaed', background: '#fff8df',
            color: '#a77818', fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 12,
            opacity: saving ? 0.6 : 1,
          }}
        >
          ⏸ Unpublish
        </button>
        <button
          onClick={onDelete}
          disabled={saving}
          style={{
            padding: '8px 12px', borderRadius: 10,
            border: '1px solid #f5c1be', background: '#fff0ef',
            color: '#c85a59', fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 12,
            opacity: saving ? 0.6 : 1,
          }}
        >
          🗑
        </button>
      </div>
    </article>
  );
}

/* ── Puzzle card with unpublish + delete ─────────────────────────────────── */
function PuzzleReplayCard({ puzzle, onUnpublish, onDelete, onView, onResults, saving }) {
  return (
    <article style={{
      background: 'white', border: '1px solid #e0eaed',
      borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(24,63,93,0.05)',
    }}>
      {puzzle.thumbnail_url ? (
        <div style={{ width: '100%', paddingBottom: '45%', position: 'relative' }}>
          <img
            src={assetUrl(puzzle.thumbnail_url)}
            alt={puzzle.title}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      ) : (
        <div style={{
          width: '100%', paddingBottom: '45%', position: 'relative',
          background: 'linear-gradient(135deg,#e8f9f5,#d5f1eb)',
        }}>
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 36 }}>🧩</div>
        </div>
      )}

      <div style={{ padding: '14px' }}>
        <div style={{ fontWeight: 900, fontSize: 14, color: '#153e67', marginBottom: 3,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {puzzle.title}
        </div>
        <div style={{ fontSize: 11, color: '#688097', marginBottom: 10 }}>
          {puzzle.grid_size && `${puzzle.grid_size}×${puzzle.grid_size} · ${puzzle.total_pieces} pieces`}
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={onResults} style={btnStyle('#f4f8f9','#153e67','#d8e5e9')}>📊 Results</button>
          <button onClick={onView}    style={btnStyle('#f4f8f9','#153e67','#d8e5e9')}>✏️ Review</button>
          <button onClick={onUnpublish} disabled={saving} style={btnStyle('#fff8df','#a77818','#e0eaed', saving)}>⏸ Unpublish</button>
          <button onClick={onDelete}    disabled={saving} style={btnStyle('#fff0ef','#c85a59','#f5c1be', saving)}>🗑 Delete</button>
        </div>
      </div>
    </article>
  );
}

function btnStyle(bg, color, border, disabled = false) {
  return {
    flex: '1 1 auto', padding: '7px 10px', borderRadius: 9,
    border: `1px solid ${border}`, background: bg, color,
    fontWeight: 800, cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 12, opacity: disabled ? 0.6 : 1,
  };
}

/* ── main page ────────────────────────────────────────────────────────────── */
export default function ResourcesPage({ user, onSignOut }) {
  const navigate  = useNavigate();
  const [activities, setActivities] = useState([]);
  const [puzzles,    setPuzzles]    = useState([]);
  const [crosswords, setCrosswords] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [toast,      setToast]      = useState(null);

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [topics, puzzleData, crosswordData] = await Promise.all([
        api.topics().catch(() => []),
        api.puzzle.listTeacher().catch(() => ({ puzzles: [] })),
        api.crossword.list().catch(() => ({ crosswords: [] })),
      ]);

      const published = [];
      for (const topic of topics || []) {
        for (const activity of topic.activities || []) {
          if (activity.is_published) {
            published.push({
              id:        activity.id,
              topicId:   topic.id,
              title:     topic.title,
              grade:     topic.grade,
              subject:   topic.subject,
              type:      activity.game_type,
              questions: activity.latest_version?.item_count || 0,
            });
          }
        }
      }
      setActivities(published);
      setPuzzles((puzzleData?.puzzles || []).filter(p => p.is_published));
      setCrosswords((crosswordData?.crosswords || []).filter(c => c.status === 'published'));
    } catch (err) {
      showToast('Failed to load: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── activity actions ─────────────────────────────────────────────────── */
  const handleUnpublishActivity = async (id) => {
    setSaving(true);
    try {
      await api.unpublishActivity(id);
      setActivities(prev => prev.filter(a => a.id !== id));
      showToast('Activity unpublished. Students can no longer access it.');
    } catch (err) {
      showToast('Unpublish failed: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteActivity = async (activity) => {
    if (!window.confirm(
      `Permanently delete "${activity.title}"?\nThis will unpublish it first, then delete all questions and attempts. This cannot be undone.`
    )) return;
    setSaving(true);
    try {
      // Unpublish first (removes published_version_id guard), then delete
      await api.unpublishActivity(activity.id).catch(() => {});
      await api.deleteActivity(activity.id);
      setActivities(prev => prev.filter(a => a.id !== activity.id));
      showToast('Activity deleted.');
    } catch (err) {
      showToast('Delete failed: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  /* ── puzzle actions ───────────────────────────────────────────────────── */
  const handleUnpublishPuzzle = async (id) => {
    setSaving(true);
    try {
      await api.puzzle.unpublish(id);
      setPuzzles(prev => prev.filter(p => p.puzzle_id !== id));
      showToast('Puzzle unpublished. Students can no longer access it.');
    } catch (err) {
      showToast('Unpublish failed: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePuzzle = async (puzzle) => {
    if (!window.confirm(
      `Permanently delete puzzle "${puzzle.title}"?\nThis deletes the image, all tiles, and student attempts. This cannot be undone.`
    )) return;
    setSaving(true);
    try {
      await api.puzzle.delete(puzzle.puzzle_id);
      setPuzzles(prev => prev.filter(p => p.puzzle_id !== puzzle.puzzle_id));
      showToast('Puzzle deleted.');
    } catch (err) {
      showToast('Delete failed: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  /* ── crossword actions ───────────────────────────────────────────────── */
  const handleUnpublishCrossword = async (id) => {
    setSaving(true);
    try {
      await api.crossword.unpublish(id);
      setCrosswords(prev => prev.filter(c => c.id !== id));
      showToast('Crossword unpublished. Students can no longer access it.');
    } catch (err) {
      showToast('Unpublish failed: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCrossword = async (cw) => {
    if (!window.confirm(
      `Permanently delete crossword "${cw.title || cw.topic}"?\nThis deletes all words and student attempts. This cannot be undone.`
    )) return;
    setSaving(true);
    try {
      await api.crossword.delete(cw.id);
      setCrosswords(prev => prev.filter(c => c.id !== cw.id));
      showToast('Crossword deleted.');
    } catch (err) {
      showToast('Delete failed: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const total = activities.length + puzzles.length + crosswords.length;

  return (
    <TeacherLayout crumb="Teacher Studio / Published REPLAYs" activePage="resources" user={user} onSignOut={onSignOut}>
      <PageHeader
        eyebrow="RESOURCES"
        title="Published REPLAYs"
        subtitle={`${total} activit${total !== 1 ? 'ies' : 'y'} visible to students`}
        action={
          <button className="btn btn-primary" onClick={() => navigate('/create')} style={{ borderRadius: 999 }}>
            ＋ Create new
          </button>
        }
      />

      {loading && (
        <p role="status" style={{ color: '#688097', textAlign: 'center', padding: 40 }}>
          Loading published activities…
        </p>
      )}

      {/* Regular activities */}
      {!loading && activities.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ color: '#153e67', fontSize: 15, margin: '0 0 14px' }}>
            📝 Question activities ({activities.length})
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 15 }}>
            {activities.map(a => (
              <ActivityReplayCard
                key={a.id}
                activity={a}
                saving={saving}
                onView={() => navigate(`/reports/${a.topicId}`)}
                onUnpublish={() => handleUnpublishActivity(a.id)}
                onDelete={() => handleDeleteActivity(a)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Published puzzles */}
      {!loading && puzzles.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ color: '#153e67', fontSize: 15, margin: '0 0 14px' }}>
            🧩 Puzzle games ({puzzles.length})
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 15 }}>
            {puzzles.map(p => (
              <PuzzleReplayCard
                key={p.puzzle_id}
                puzzle={p}
                saving={saving}
                onView={() => navigate(`/review/${p.puzzle_id}`)}
                onResults={() => navigate(`/puzzle-results/${p.puzzle_id}`)}
                onUnpublish={() => handleUnpublishPuzzle(p.puzzle_id)}
                onDelete={() => handleDeletePuzzle(p)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Published crosswords */}
      {!loading && crosswords.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ color: '#153e67', fontSize: 15, margin: '0 0 14px' }}>
            🔤 Crossword games ({crosswords.length})
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 15 }}>
            {crosswords.map(cw => (
              <div key={cw.id} style={{
                background: 'white', border: '1px solid #e0eaed', borderRadius: 14,
                padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 28 }}>🔤</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: '#153e67', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {cw.title || cw.topic}
                    </div>
                    <div style={{ fontSize: 12, color: '#688097', marginTop: 2 }}>
                      {cw.difficulty} · {cw.word_count || 0} words
                      {cw.grade_level ? ` · Grade ${cw.grade_level}` : ''}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 900, background: '#e5f8eb', color: '#238650',
                    padding: '3px 8px', borderRadius: 999, whiteSpace: 'nowrap',
                  }}>Published</span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-soft"
                    style={{ fontSize: 12, padding: '5px 10px' }}
                    onClick={() => navigate(`/review/${cw.id}`)}
                  >
                    👁 Review
                  </button>
                  <button
                    className="btn btn-soft"
                    style={{ fontSize: 12, padding: '5px 10px' }}
                    onClick={() => navigate(`/crossword-results/${cw.id}`)}
                  >
                    📊 Results
                  </button>
                  <button
                    className="btn btn-soft"
                    style={{ fontSize: 12, padding: '5px 10px' }}
                    disabled={saving}
                    onClick={() => handleUnpublishCrossword(cw.id)}
                  >
                    ⏸ Unpublish
                  </button>
                  <button
                    className="btn"
                    style={{ fontSize: 12, padding: '5px 10px', color: '#c85a59' }}
                    disabled={saving}
                    onClick={() => handleDeleteCrossword(cw)}
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {!loading && total === 0 && (
        <div style={{
          background: 'white', border: '1px solid #e0eaed',
          borderRadius: 16, padding: '48px 20px', textAlign: 'center', color: '#688097',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎮</div>
          <h3 style={{ color: '#153e67', margin: '8px 0' }}>No published activities yet</h3>
          <p>Create and publish an activity to share with students.</p>
          <button className="btn btn-primary" onClick={() => navigate('/create')}>
            Create activity
          </button>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </TeacherLayout>
  );
}
