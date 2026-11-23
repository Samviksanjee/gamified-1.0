import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TeacherLayout from '../components/TeacherLayout';
import PageHeader from '../components/PageHeader';
import ActivityCard from '../components/ActivityCard';
import { api, assetUrl } from '../api.js';

/* ── game-type icon helper ─────────────────────────────────────────────── */
function gameIcon(type) {
  return { quiz: '🎯', matching: '🔗', sequencing: '🔀', puzzle: '🧩', crossword: '🔤' }[type] || '📋';
}

/* ── puzzle status badge ───────────────────────────────────────────────── */
function PuzzleStatusBadge({ status }) {
  const cfg = {
    no_image:  { bg: '#f4f8f9', color: '#688097', label: 'No image' },
    pending:   { bg: '#fff8df', color: '#a77818', label: 'Generating…' },
    ready:     { bg: '#e5f8eb', color: '#238650', label: 'Ready to approve' },
    approved:  { bg: '#e8faf8', color: '#12864e', label: 'Approved' },
    superseded:{ bg: '#f4f8f9', color: '#688097', label: 'Superseded' },
    published: { bg: '#e8faf8', color: '#0d7a72', label: 'Published' },
  }[status] || { bg: '#f4f8f9', color: '#688097', label: status };
  return (
    <span style={{
      display: 'inline-block', padding: '2px 9px', borderRadius: 20,
      fontSize: 11, fontWeight: 700,
      background: cfg.bg, color: cfg.color,
    }}>
      {cfg.label}
    </span>
  );
}

/* ── Puzzle card ──────────────────────────────────────────────────────── */
function PuzzleCard({ puzzle, onOpen }) {
  return (
    <div style={{
      background: 'white', border: '1px solid #e0eaed',
      borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(24,63,93,0.05)',
      cursor: 'pointer', transition: 'box-shadow .15s',
    }}
      onClick={onOpen}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 16px rgba(24,63,93,0.12)'}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(24,63,93,0.05)'}
    >
      {puzzle.thumbnail_url ? (
        <div style={{ width: '100%', paddingBottom: '50%', position: 'relative', overflow: 'hidden' }}>
          <img src={assetUrl(puzzle.thumbnail_url)} alt={puzzle.title}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ) : (
        <div style={{
          width: '100%', paddingBottom: '50%', position: 'relative',
          background: 'linear-gradient(135deg,#e8f9f5,#d5f1eb)',
        }}>
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 40 }}>
            🧩
          </div>
        </div>
      )}

      <div style={{ padding: '12px 14px' }}>
        <div style={{
          fontWeight: 900, fontSize: 13, color: '#153e67',
          marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {puzzle.title}
        </div>
        <div style={{ fontSize: 11, color: '#688097', marginBottom: 8 }}>
          {puzzle.grid_size ? `${puzzle.grid_size}×${puzzle.grid_size}` : '—'}
          {puzzle.total_pieces ? ` · ${puzzle.total_pieces} pieces` : ''}
          {puzzle.is_published ? ' · Published' : ''}
        </div>
        <PuzzleStatusBadge status={puzzle.is_published ? 'published' : puzzle.image_status} />
      </div>
    </div>
  );
}

/* ── main page ────────────────────────────────────────────────────────── */
export default function DraftsPage({ user, onSignOut }) {
  const [drafts,   setDrafts]   = useState([]);
  const [puzzles,  setPuzzles]  = useState([]);
  const [crosswords, setCrosswords] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [topicsData, puzzlesData, crosswordsData] = await Promise.all([
          api.topics().catch(() => []),
          api.puzzle.listTeacher().catch(() => ({ puzzles: [] })),
          api.crossword.list().catch(() => ({ crosswords: [] })),
        ]);

        // Regular activity drafts (quiz, sequencing, matching)
        const allDrafts = [];
        for (const topic of topicsData || []) {
          for (const activity of topic.activities || []) {
            if (!activity.is_published && activity.latest_version) {
              allDrafts.push({
                id:        activity.id,
                title:     topic.title,
                grade:     topic.grade,
                subject:   topic.subject,
                type:      activity.game_type,
                icon:      gameIcon(activity.game_type),
                questions: activity.latest_version.item_count || 0,
                status:    activity.latest_version.status || 'Draft',
                plays: 0, avg: 0,
              });
            }
          }
        }

        if (active) {
          setDrafts(allDrafts);
          setPuzzles(puzzlesData?.puzzles || []);
          setCrosswords(crosswordsData?.crosswords || []);
        }
      } catch (err) {
        if (active) setError(err.message || 'Failed to load drafts.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const totalCount = drafts.length + puzzles.length + crosswords.length;

  return (
    <TeacherLayout crumb="Teacher Studio / AI drafts" activePage="drafts" user={user} onSignOut={onSignOut}>
      <PageHeader
        eyebrow="DRAFT ACTIVITIES"
        title="AI drafts"
        subtitle={`${totalCount} draft${totalCount !== 1 ? 's' : ''} waiting for your review`}
        action={
          <button className="btn btn-primary" onClick={() => navigate('/create')} style={{ borderRadius: 999 }}>
            ＋ Create new
          </button>
        }
      />

      {error && (
        <div role="alert" style={{ background: '#ffe9e7', color: '#a63c3c', borderRadius: 10, padding: 12, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {loading && (
        <p role="status" style={{ color: '#688097', textAlign: 'center', padding: 40 }}>Loading drafts…</p>
      )}

      {/* Regular activity drafts */}
      {!loading && drafts.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ color: '#153e67', fontSize: 15, marginBottom: 14 }}>
            📝 Question activities ({drafts.length})
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 15 }}>
            {drafts.map((draft) => (
              <ActivityCard key={draft.id} activity={draft} onAction={() => navigate(`/review/${draft.id}`)} />
            ))}
          </div>
        </section>
      )}

      {/* Puzzle drafts + published */}
      {!loading && puzzles.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ color: '#153e67', fontSize: 15, marginBottom: 14 }}>
            🧩 Puzzle games ({puzzles.length})
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 15 }}>
            {puzzles.map((p) => (
              <PuzzleCard
                key={p.puzzle_id}
                puzzle={p}
                onOpen={() => navigate(`/review/${p.puzzle_id}`)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Crossword drafts + published */}
      {!loading && crosswords.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ color: '#153e67', fontSize: 15, marginBottom: 14 }}>
            🔤 Crossword games ({crosswords.length})
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 15 }}>
            {crosswords.map((cw) => (
              <div
                key={cw.id}
                style={{
                  background: 'white', border: '1px solid #e0eaed',
                  borderRadius: 16, padding: '16px 18px',
                  boxShadow: '0 2px 8px rgba(24,63,93,0.05)',
                  cursor: 'pointer',
                }}
                onClick={() => navigate(`/review/${cw.id}`)}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔤</div>
                <div style={{
                  fontWeight: 900, fontSize: 13, color: '#153e67',
                  marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {cw.title || cw.topic}
                </div>
                <div style={{ fontSize: 11, color: '#688097', marginBottom: 8 }}>
                  {cw.difficulty || 'crossword'}{cw.word_count ? ` · ${cw.word_count} words` : ''}
                </div>
                <PuzzleStatusBadge status={cw.status === 'published' ? 'published' : cw.status === 'approved' ? 'approved' : 'ready'} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {!loading && totalCount === 0 && (
        <div style={{
          background: '#fff', border: '1px solid #e0eaed',
          borderRadius: 16, padding: 48, textAlign: 'center', color: '#688097',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
          <h3 style={{ color: '#153e67' }}>No drafts yet</h3>
          <p>Generate your first activity or puzzle to get started.</p>
          <button className="btn btn-primary" onClick={() => navigate('/create')}>
            Create activity
          </button>
        </div>
      )}
    </TeacherLayout>
  );
}
