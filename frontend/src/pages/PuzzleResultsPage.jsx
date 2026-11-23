/**
 * PuzzleResultsPage — Phase 6
 *
 * Teacher view of per-student attempts for a published puzzle activity.
 * Shows completion status, moves, elapsed time, score, and attempt timestamps.
 */
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TeacherLayout from '../components/TeacherLayout';
import PageHeader from '../components/PageHeader';
import { api } from '../api.js';

/* ─── design helpers ─────────────────────────────────────────────────────── */
const card = {
  background: '#fff',
  border: '1px solid #e0eaed',
  borderRadius: 16,
  padding: 'clamp(16px,2vw,24px)',
};

function StatusPill({ completed }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
      background: completed ? '#e5f8eb' : '#f4f8f9',
      color:      completed ? '#238650' : '#688097',
    }}>
      {completed ? '✓ Completed' : '⏳ In progress'}
    </span>
  );
}

function StatCell({ value, label, color = '#153e67' }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 60 }}>
      <div style={{ fontWeight: 900, fontSize: 17, color }}>{value ?? '—'}</div>
      <div style={{ fontSize: 11, color: '#688097' }}>{label}</div>
    </div>
  );
}

function formatTime(seconds) {
  if (!seconds && seconds !== 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

/* ─── Summary bar ────────────────────────────────────────────────────────── */
function SummaryBar({ attempts }) {
  const total     = attempts.length;
  const completed = attempts.filter((a) => a.completed).length;
  const pct       = total ? Math.round((completed / total) * 100) : 0;
  const avgMoves  = completed
    ? Math.round(attempts.filter((a) => a.completed).reduce((s, a) => s + (a.moves || 0), 0) / completed)
    : null;
  const avgTime   = completed
    ? Math.round(attempts.filter((a) => a.completed).reduce((s, a) => s + (a.elapsed_seconds || 0), 0) / completed)
    : null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: 12, marginBottom: 24 }}>
      {[
        { emoji: '👥', value: total,            label: 'Attempts'   },
        { emoji: '✅', value: completed,        label: 'Completed'  },
        { emoji: '📊', value: `${pct}%`,        label: 'Completion' },
        { emoji: '🔢', value: avgMoves,          label: 'Avg moves'  },
        { emoji: '⏱',  value: formatTime(avgTime), label: 'Avg time' },
      ].map(({ emoji, value, label }) => (
        <div key={label} style={{
          background: '#f4f8f9', borderRadius: 14, padding: '14px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textAlign: 'center',
        }}>
          <div style={{ fontSize: 28 }}>{emoji}</div>
          <div style={{ fontWeight: 900, fontSize: 20, color: '#153e67', lineHeight: 1 }}>{value ?? '—'}</div>
          <div style={{ fontSize: 11, color: '#688097', fontWeight: 700 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── Attempt table ────────────────────────────────────────────────────── */
function AttemptsTable({ attempts }) {
  if (attempts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 48, color: '#688097' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🧩</div>
        <h3 style={{ color: '#153e67' }}>No attempts yet</h3>
        <p>Students haven't started this puzzle yet. Make sure it's published to their classrooms.</p>
      </div>
    );
  }

  const thStyle = {
    padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 900,
    color: '#688097', textTransform: 'uppercase', letterSpacing: '.8px',
    borderBottom: '2px solid #e0eaed', background: '#f8fdfd',
  };
  const tdStyle = {
    padding: '12px 14px', borderBottom: '1px solid #f0f4f6', verticalAlign: 'middle',
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            <th style={thStyle}>Student</th>
            <th style={thStyle}>Status</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>Moves</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>Time</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>Score</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>Previews used</th>
            <th style={thStyle}>Started</th>
            <th style={thStyle}>Finished</th>
          </tr>
        </thead>
        <tbody>
          {attempts.map((a) => (
            <tr key={a.attempt_id} style={{ transition: 'background .12s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f8fdfd'}
              onMouseLeave={(e) => e.currentTarget.style.background = ''}
            >
              <td style={tdStyle}>
                <div style={{ fontWeight: 700, color: '#153e67' }}>
                  Student {a.student_id}
                </div>
              </td>
              <td style={tdStyle}><StatusPill completed={a.completed} /></td>
              <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: '#153e67' }}>
                {a.moves ?? '—'}
              </td>
              <td style={{ ...tdStyle, textAlign: 'center' }}>
                {formatTime(a.elapsed_seconds)}
              </td>
              <td style={{ ...tdStyle, textAlign: 'center' }}>
                {a.completed ? (
                  <span style={{ fontWeight: 900, color: '#238650' }}>
                    {a.score !== null && a.score !== undefined ? `${Math.round(a.score * 100)}%` : '100%'}
                  </span>
                ) : '—'}
              </td>
              <td style={{ ...tdStyle, textAlign: 'center', color: '#688097' }}>
                {a.preview_uses ?? 0}
              </td>
              <td style={{ ...tdStyle, color: '#688097', fontSize: 12 }}>
                {a.started_at ? new Date(a.started_at).toLocaleDateString() : '—'}
              </td>
              <td style={{ ...tdStyle, color: '#688097', fontSize: 12 }}>
                {a.completed_at ? new Date(a.completed_at).toLocaleDateString() : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────────── */
export default function PuzzleResultsPage({ user, onSignOut }) {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api.puzzle.results(activityId);
      setData(result);
    } catch (err) {
      setError(err.message || 'Could not load results.');
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  useEffect(() => { load(); }, [load]);

  const title = data ? `Puzzle Results — ${data.puzzle_id ? `Puzzle #${data.puzzle_id}` : 'Puzzle'}` : 'Puzzle Results';

  return (
    <TeacherLayout crumb={`Analytics / ${title}`} activePage="analytics" user={user} onSignOut={onSignOut}>
      <PageHeader
        eyebrow="PUZZLE ANALYTICS"
        title="Student Results"
        subtitle="Per-student attempt data for this puzzle activity."
        action={
          <button className="btn btn-soft" onClick={() => navigate(`/review/${activityId}`)}>
            ← Back to puzzle
          </button>
        }
      />

      {loading && (
        <div style={{ ...card, textAlign: 'center', padding: 48, color: '#688097' }}>
          <p role="status">Loading results…</p>
        </div>
      )}

      {error && (
        <div role="alert" style={{ background: '#ffe9e7', color: '#a63c3c', padding: 14, borderRadius: 10, marginBottom: 16 }}>
          ⚠ {error}
          <button className="btn btn-soft" onClick={load} style={{ marginLeft: 12 }}>Retry</button>
        </div>
      )}

      {!loading && data && (
        <>
          <SummaryBar attempts={data.attempts || []} />
          <div style={card}>
            <h2 style={{ color: '#153e67', margin: '0 0 16px', fontSize: 17 }}>
              Individual Attempts ({data.attempts?.length ?? 0})
            </h2>
            <AttemptsTable attempts={data.attempts || []} />
          </div>
        </>
      )}
    </TeacherLayout>
  );
}
