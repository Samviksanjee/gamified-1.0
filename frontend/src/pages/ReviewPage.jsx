import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TeacherLayout from '../components/TeacherLayout';
import { api } from '../api.js';
import QuizReview from '../games/quiz/QuizReview.jsx';
import SequencingReview from '../games/sequencing/SequencingReview.jsx';
import MatchingReview from '../games/matching/MatchingReview.jsx';
import PuzzleReview from '../games/puzzle/PuzzleReview.jsx';
import CrosswordReview from '../games/crossword/CrosswordReview.jsx';

const input = { width: '100%', boxSizing: 'border-box', border: '1px solid #d8e5e9', borderRadius: 9, padding: '9px 10px' };

const datetimeLocalValue = (value) => value ? String(value).slice(0, 16) : '';

export function PublishModal({ activity, classrooms, selectedClassroomIds = [], saving, onCancel, onConfirm }) {
  const initialClassroomIds = selectedClassroomIds.length
    ? selectedClassroomIds
    : classrooms.length === 1 ? [classrooms[0].id] : [];

  const [classroomIds, setClassroomIds] = useState(initialClassroomIds);
  const [selectionError, setSelectionError] = useState('');

  const toggleClassroom = (id) => {
    setSelectionError('');
    setClassroomIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const submit = () => {
    if (!classroomIds.length) {
      setSelectionError('Select at least one classroom before publishing.');
      return;
    }
    // Pass only what the backend needs; other fields keep their activity defaults
    const title = activity?.title || activity?.topic_title;
    onConfirm({ classroom_ids: classroomIds, student_ids: [], ...(title ? { title } : {}) });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10,30,50,.45)', display: 'grid', placeItems: 'center', padding: 16 }}>
      <div style={{ width: 'min(100%, 420px)', background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 16px 48px rgba(0,0,0,.18)' }}>
        <h2 style={{ margin: '0 0 20px', color: '#153e67' }}>Publish assignment</h2>

        {/* Classrooms */}
        <fieldset style={{ border: '1px solid #e0eaed', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
          <legend style={{ fontWeight: 700, fontSize: 13, color: '#153e67', padding: '0 6px' }}>Classrooms</legend>
          {classrooms.length === 0 ? (
            <p style={{ color: '#688097', fontSize: 13, margin: 0 }}>No classrooms available. Create one first.</p>
          ) : (
            classrooms.map((room) => (
              <label key={room.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={classroomIds.includes(room.id)}
                  onChange={() => toggleClassroom(room.id)}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <span style={{ fontSize: 14, color: '#153e67' }}>{room.name}</span>
              </label>
            ))
          )}
        </fieldset>

        {selectionError && (
          <div role="alert" style={{ color: '#a63c3c', background: '#ffe9e7', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>
            {selectionError}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
          <button onClick={onCancel} className="btn btn-soft">Cancel</button>
          <button disabled={saving} onClick={submit} className="btn btn-primary">
            {saving ? 'Publishing…' : '🚀 Publish'}
          </button>
        </div>
      </div>
    </div>
  );
}

const reviews = { quiz: QuizReview, sequencing: SequencingReview, matching: MatchingReview, puzzle: PuzzleReview, crossword: CrosswordReview };
function UnsupportedReview({ gameType }) { return <section data-game-review="unsupported" role="alert"><strong>This activity uses an unsupported game type.</strong><p>{gameType || 'Unknown'} activities cannot be reviewed in this deployment.</p></section>; }

export default function ReviewPage({ user, onSignOut }) {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState(null);
  const [items, setItems] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPublish, setShowPublish] = useState(false);
  const [classrooms, setClassrooms] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const draft = await api.preview(activityId);
      setActivity(draft);
      setItems(draft.latest_version?.items || []);
      try {
        const persisted = await api.activityClassrooms(activityId);
        setAssignments(Array.isArray(persisted) ? persisted : []);
      } catch (_err) {
        setAssignments([]);
      }
    } catch (err) {
      setError(err.message || 'Activity not found.');
    } finally {
      setLoading(false);
    }
  }, [activityId]);
  useEffect(() => { load(); }, [load]);

  const gameType = activity?.game_type;
  const status = activity?.latest_version?.status;
  // Puzzle uses its own review lifecycle; generic edit/approve/publish don't apply
  const isPuzzle = gameType === 'puzzle';
  const isCrossword = gameType === 'crossword';
  const editable = !isPuzzle && status === 'draft' && ['quiz', 'sequencing', 'matching'].includes(gameType);
  // `value === null` removes the question (used by the sequencing review); otherwise it replaces it.
  const updateItem = (index, value) => setItems((old) => value === null ? old.filter((_, itemIndex) => itemIndex !== index) : old.map((item, itemIndex) => itemIndex === index ? value : item));
  const save = async () => { setSaving(true); try { if (gameType === 'sequencing') await api.sequencing.editDraft(activityId, { items }); else if (gameType === 'quiz') await api.quiz.editDraft(activityId, items); else if (gameType === 'matching') await api.matching.editDraft(activityId, items); await load(); setSuccess('Changes saved.'); } catch (err) { setError(err.message); } finally { setSaving(false); } };
  const approve = async () => { setSaving(true); try { if (gameType === 'sequencing') await api.sequencing.approve(activityId); else await api.approve(activityId); await load(); setSuccess('Draft approved. It is ready to publish.'); } catch (err) { setError(err.message); } finally { setSaving(false); } };
  const remove = async () => { if (!window.confirm('Delete this draft?')) return; setSaving(true); try { if (gameType === 'sequencing') await api.sequencing.deleteDraft(activityId); else await api.deleteActivity(activityId); navigate('/drafts'); } catch (err) { setError(err.message); setSaving(false); } };
  const regenerate = async () => { setSaving(true); try { if (gameType === 'sequencing') await api.sequencing.regenerate(activityId); else await api.regenerate(activityId); await load(); setSuccess('Draft regenerated.'); } catch (err) { setError(err.message); } finally { setSaving(false); } };
  const openPublish = async () => { try { const available = await api.classrooms(); setClassrooms(Array.isArray(available) ? available : []); setShowPublish(true); } catch (err) { setError(err.message); } };
  const publish = async (body) => { setSaving(true); try { if (gameType === 'sequencing') await api.sequencing.publish(activityId, body); else await api.publish(activityId, body); setShowPublish(false); setError(''); await load(); setSuccess('Published successfully. Students in the selected classrooms can now find it in Resources.'); } catch (err) { setError(err.message); } finally { setSaving(false); } };

  if (loading) return <TeacherLayout crumb="Review activity" activePage="reviews" user={user} onSignOut={onSignOut}><p role="status">Loading draft…</p></TeacherLayout>;
  if (!activity) return <TeacherLayout crumb="Review activity" activePage="reviews" user={user} onSignOut={onSignOut}><p role="alert">{error || 'Activity not found.'}</p></TeacherLayout>;
  const Review = reviews[gameType] || UnsupportedReview;
  const isSupportedReview = Boolean(reviews[gameType]);
  return <TeacherLayout crumb={`Review / ${activity.topic_title || activity.title}`} activePage="reviews" user={user} onSignOut={onSignOut}>
    <div><div style={{ color: '#12a99f', textTransform: 'uppercase' }}>{gameType} · {activity.difficulty}</div><h1 style={{ color: '#153e67' }}>{activity.title || activity.topic_title}</h1></div>
    {error && <div role="alert">⚠ {error}</div>}{success && <div role="status">{success}</div>}
    {assignments.length > 0 && <section aria-label="Published assignment classrooms"><h2>Assigned classrooms</h2><ul>{assignments.map((assignment) => <li key={assignment.classroom_id}>{assignment.classroom_name}</li>)}</ul></section>}
    <Review gameType={gameType} activityId={activityId} items={items} editable={editable} onChange={updateItem} onRefresh={load} />
    {!isPuzzle && !isCrossword && <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 22 }}>{status === 'draft' && editable && <><button className="btn btn-soft" disabled={saving} onClick={save}>💾 Save edits</button><button className="btn btn-soft" disabled={saving} onClick={regenerate}>↻ Regenerate set</button><button className="btn btn-primary" disabled={saving} onClick={approve}>✓ Approve draft</button><button className="btn" disabled={saving} onClick={remove}>Delete</button></>}{status === 'approved' && isSupportedReview && <button className="btn btn-primary" disabled={saving} onClick={openPublish}>🚀 Publish</button>}{status === 'published' && isSupportedReview && <button className="btn btn-primary" disabled={saving} onClick={openPublish}>＋ Assign to another classroom</button>}{status === 'published' && !isSupportedReview && <div>✓ Published content is immutable</div>}<button className="btn btn-soft" onClick={() => navigate('/drafts')}>Back</button></div>}
    {showPublish && <PublishModal activity={activity} classrooms={classrooms} selectedClassroomIds={assignments.map((assignment) => assignment.classroom_id)} saving={saving} onCancel={() => setShowPublish(false)} onConfirm={publish} />}
  </TeacherLayout>;
}
