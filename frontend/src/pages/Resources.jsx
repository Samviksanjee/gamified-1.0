/**
 * Resources — student's assignments grouped by classroom, with filters.
 *
 * Shows assignments from ALL joined classrooms. Each card clearly identifies
 * its classroom, subject, and teacher. Filters by classroom, subject, status.
 * Joining a classroom triggers a data refresh.
 */
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import '../styles/pages.css';

const SUBJECT_ICONS = {
  science: '🌿', maths: '➗', math: '➗', mathematics: '➗',
  english: '📚', history: '📜', geography: '🗺️', arts: '🎨', evs: '🌱', default: '📖',
};
function sIcon(s) { return SUBJECT_ICONS[(s || '').toLowerCase()] || SUBJECT_ICONS.default; }

const STATUS_COLORS = {
  New:         { bg: '#eaf7f7', text: '#147d81' },
  'In Progress':{ bg: '#fff3d4', text: '#a77818' },
  Completed:   { bg: '#e5f8eb', text: '#238650' },
  Overdue:     { bg: '#ffe9e7', text: '#c85a59' },
};

function ctaLabel(status, gameType) {
  if (status === 'Completed') return 'Try Again';
  if (status === 'In Progress') return 'Continue →';
  if (gameType === 'sequencing') return 'Start Activity →';
  return 'Start Test →';
}
function ctaVariant(status) {
  return status === 'Completed' ? 'btn-soft' : 'btn-primary';
}

// ─── Activity card ────────────────────────────────────────────────────────────
function ActivityCard({ act, classroomName, teacherName, onStart }) {
  const sc = STATUS_COLORS[act.status] || STATUS_COLORS.New;
  return (
    <div style={{
      background: 'white', border: '1.5px solid #e0eaed', borderRadius: 16, padding: '18px',
      display: 'flex', flexDirection: 'column', gap: 10,
      boxShadow: '0 2px 8px rgba(24,63,93,0.04)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#12a99f', textTransform: 'uppercase', marginBottom: 3 }}>
            {sIcon(act.subject)} {act.subject}
          </div>
          <div style={{ fontWeight: 900, fontSize: 15, color: '#153e67', lineHeight: 1.3 }}>
            {act.game_type === 'sequencing' && act.title ? act.title : act.topic_title}
          </div>
          {act.game_type === 'sequencing' && act.title && act.title !== act.topic_title && (
            <div style={{ fontSize: 12, color: '#688097', marginTop: 2 }}>{act.topic_title}</div>
          )}
        </div>
        <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: 10, fontWeight: 900, background: sc.bg, color: sc.text, flexShrink: 0 }}>
          {act.status}
        </span>
      </div>

      {/* Classroom + teacher */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, background: '#f0f4f6', color: '#506b80', borderRadius: 6, padding: '3px 8px', fontWeight: 700 }}>
          🏫 {classroomName}
        </span>
        {teacherName && (
          <span style={{ fontSize: 11, background: '#f0f4f6', color: '#506b80', borderRadius: 6, padding: '3px 8px', fontWeight: 700 }}>
            👤 {teacherName}
          </span>
        )}
        <span style={{ fontSize: 11, background: '#f0f4f6', color: '#506b80', borderRadius: 6, padding: '3px 8px', fontWeight: 700 }}>
          {({ quiz:'🎯', matching:'🔗', sequencing:'🔀', puzzle:'🧩', crossword:'🔤' }[act.game_type] || '📋')} {act.game_type} · {act.difficulty}
        </span>
      </div>

      {/* Score + due date */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {act.best_score != null && (
          <span style={{ fontSize: 12, fontWeight: 800, color: act.best_score >= 70 ? '#238650' : '#c85a59' }}>
            Best: {act.best_score}%
          </span>
        )}
        {act.due_at && (
          <span style={{ fontSize: 11, color: '#a77818', background: '#fff8e1', borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>
            📅 Due {new Date(act.due_at).toLocaleDateString()}
          </span>
        )}
      </div>

      <button
        onClick={() => onStart(act.activity_id, act.game_type)}
        className={`btn ${ctaVariant(act.status)}`}
        style={{ width: '100%', border: 'none', fontSize: 13, marginTop: 'auto' }}
      >
        {ctaLabel(act.status, act.game_type)}
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Resources() {
  const [byClassroom, setByClassroom] = useState([]);  // { classroom_id, classroom_name, subject, grade, teacher_name, activities[] }
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');

  // Filters
  const [filterClassroom, setFilterClassroom] = useState('all');
  const [filterSubject,   setFilterSubject]   = useState('all');
  const [filterStatus,    setFilterStatus]    = useState('all');
  const [filterType,      setFilterType]      = useState('all');

  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.assignmentsByClassroom();
      setByClassroom(data.classrooms || []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Derived filter options
  const subjects = [...new Set(byClassroom.flatMap(c => c.activities.map(a => a.subject)).filter(Boolean))];

  // Flatten + filter
  const allActivities = byClassroom.flatMap(c =>
    c.activities.map(a => ({
      ...a,
      classroom_id:   c.classroom_id,
      classroom_name: c.classroom_name,
      teacher_name:   c.teacher_name,
    }))
  );

  const visible = allActivities.filter(a => {
    if (filterClassroom !== 'all' && String(a.classroom_id) !== filterClassroom) return false;
    if (filterSubject   !== 'all' && a.subject !== filterSubject) return false;
    if (filterStatus    !== 'all' && a.status !== filterStatus) return false;
    if (filterType      !== 'all' && a.game_type !== filterType) return false;
    return true;
  });

  // Group visible activities by classroom for grouped view
  const visibleGroups = byClassroom
    .map(c => ({
      ...c,
      activities: visible.filter(a => a.classroom_id === c.classroom_id),
    }))
    .filter(c => c.activities.length > 0);

  const handleStart = (activityId, gameType) => {
    if (gameType === 'puzzle') return navigate(`/play/puzzle/${activityId}`);
    if (gameType === 'crossword') return navigate(`/play/crossword/${activityId}`);
    navigate(`/play/a/${activityId}`);
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <p style={{ color: '#688097' }}>Loading your assignments…</p>
    </div>
  );

  return (
    <>
      <div className="eyebrow">Your assignments</div>
      <h1 className="page-title">Resources</h1>
      <p className="sub">Assignments from all your joined classrooms — sorted and filtered just for you.</p>

      {error && (
        <div style={{ padding: '12px 16px', background: '#ffe0e0', color: '#c00', borderRadius: 10, marginBottom: 20, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* ── Filters ──────────────────────────────────────────────── */}
      {byClassroom.length > 0 && (
        <div style={{
          display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24,
          padding: '12px 14px', background: 'white', borderRadius: 14,
          border: '1px solid #e0eaed', alignItems: 'center',
        }}>
          <span style={{ fontSize: 11, fontWeight: 900, color: '#688097', marginRight: 4 }}>FILTER:</span>

          {/* Classroom filter */}
          <select
            value={filterClassroom}
            onChange={e => setFilterClassroom(e.target.value)}
            style={{ border: '1px solid #d4e4e8', borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 700, color: '#153e67', background: 'white', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <option value="all">All Classrooms</option>
            {byClassroom.map(c => (
              <option key={c.classroom_id} value={String(c.classroom_id)}>{c.classroom_name}</option>
            ))}
          </select>

          {/* Subject filter */}
          <select
            value={filterSubject}
            onChange={e => setFilterSubject(e.target.value)}
            style={{ border: '1px solid #d4e4e8', borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 700, color: '#153e67', background: 'white', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <option value="all">All Subjects</option>
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{ border: '1px solid #d4e4e8', borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 700, color: '#153e67', background: 'white', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <option value="all">All Statuses</option>
            <option value="New">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Overdue">Overdue</option>
          </select>

          {/* Game type filter */}
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            style={{ border: '1px solid #d4e4e8', borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 700, color: '#153e67', background: 'white', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <option value="all">All Types</option>
            <option value="quiz">🎯 Quiz</option>
            <option value="matching">🔗 Matching</option>
            <option value="sequencing">🔀 Sequencing</option>
            <option value="puzzle">🧩 Puzzle</option>
            <option value="crossword">🔤 Crossword</option>
          </select>

          {(filterClassroom !== 'all' || filterSubject !== 'all' || filterStatus !== 'all' || filterType !== 'all') && (
            <button
              onClick={() => { setFilterClassroom('all'); setFilterSubject('all'); setFilterStatus('all'); setFilterType('all'); }}
              style={{ background: '#ffe9e7', border: '1px solid #f5c1be', color: '#c85a59', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              ✕ Clear
            </button>
          )}

          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#688097', fontWeight: 700 }}>
            {visible.length} assignment{visible.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────────── */}
      {byClassroom.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 20px', background: 'white', borderRadius: 18, border: '1px dashed #d4e4e8' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎒</div>
          <h3 style={{ color: '#153e67', margin: '0 0 8px', fontWeight: 900 }}>No assignments yet</h3>
          <p style={{ color: '#688097', margin: '0 0 20px', fontSize: 14 }}>
            Join a classroom to see your assignments here.
          </p>
          <button onClick={() => navigate('/join-classroom')} className="btn btn-primary" style={{ fontSize: 14 }}>
            Join a classroom
          </button>
        </div>
      )}

      {byClassroom.length > 0 && visible.length === 0 && (
        <div style={{ textAlign: 'center', padding: '36px 20px', background: 'white', borderRadius: 16, border: '1px solid #e0eaed' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
          <p style={{ color: '#688097', margin: 0, fontSize: 14 }}>No assignments match your filters.</p>
        </div>
      )}

      {/* ── Grouped by classroom ─────────────────────────────────── */}
      {visibleGroups.map(group => (
        <div key={group.classroom_id} style={{ marginBottom: 32 }}>
          {/* Classroom header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14,
            padding: '12px 16px', background: 'linear-gradient(100deg,#e9f9f5,#eff9ff)',
            borderRadius: 14, border: '1px solid #d4eaed',
          }}>
            <span style={{ fontSize: 22 }}>🏫</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 900, fontSize: 16, color: '#153e67' }}>{group.classroom_name}</div>
              <div style={{ fontSize: 12, color: '#688097' }}>
                Grade {group.grade} · {group.subject}
                {group.teacher_name && ` · Teacher: ${group.teacher_name}`}
              </div>
            </div>
            <span style={{ fontSize: 12, color: '#688097', fontWeight: 700 }}>
              {group.activities.length} assignment{group.activities.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Activity cards grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 14 }}>
            {group.activities.map(act => (
              <ActivityCard
                key={act.activity_id}
                act={act}
                classroomName={act.classroom_name}
                teacherName={act.teacher_name}
                onStart={handleStart}
              />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
