import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import '../styles/pages.css';

const GAME_ICON  = { quiz: '🧩', matching: '🔗', sequencing: '📋' };
const MODE_LABEL = { recall: 'Recall', play: 'Play', apply: 'Apply' };

export default function JoinClassroom() {
  const [code,          setCode]        = useState('');
  const [error,         setError]       = useState('');
  const [successMsg,    setSuccessMsg]  = useState('');
  const [loading,       setLoading]     = useState(false);
  const [classrooms,    setClassrooms]  = useState([]);
  const [pageLoading,   setPageLoading] = useState(true);
  const [expandedClass, setExpanded]    = useState(null);
  const [activities,    setActivities]  = useState({});
  const [actLoading,    setActLoading]  = useState(null);
  const navigate = useNavigate();

  const loadClassrooms = useCallback(async () => {
    setPageLoading(true);
    try {
      const data = await api.studentClassrooms();
      setClassrooms(data || []);
    } catch { setClassrooms([]); }
    finally   { setPageLoading(false); }
  }, []);

  useEffect(() => { loadClassrooms(); }, [loadClassrooms]);

  const loadActivities = async (classroomId) => {
    if (activities[classroomId]) return;
    setActLoading(classroomId);
    try {
      const data = await api.classroomActivities(classroomId);
      setActivities(prev => ({ ...prev, [classroomId]: data || [] }));
    } catch { setActivities(prev => ({ ...prev, [classroomId]: [] })); }
    finally   { setActLoading(null); }
  };

  const toggleExpand = (classroomId) => {
    const next = expandedClass === classroomId ? null : classroomId;
    setExpanded(next);
    if (next) loadActivities(next);
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) { setError('Join code must be exactly 6 characters'); return; }
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const result = await api.joinClassroom(trimmed);
      const classroomName = result.classroom?.name || 'classroom';
      setSuccessMsg(
        `✓ You joined ${classroomName}! Your classroom assignments are now available in Resources.`
      );
      setCode('');
      await loadClassrooms();
      setActivities({});  // clear cached activity lists so fresh data loads
      if (result.classroom?.classroom_id) setExpanded(result.classroom.classroom_id);
    } catch (err) {
      const msg = err.message || 'Failed to join classroom';
      if (msg.toLowerCase().includes('already enrolled')) {
        setSuccessMsg("You're already in this classroom! Check Resources for your assignments.");
        setCode('');
      } else if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('invalid')) {
        setError('Invalid code. Please check and try again.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Page header */}
      <div style={{ marginBottom: '28px' }}>
        <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: '900', color: '#12a99f', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Classroom enrolment
        </p>
        <h1 style={{ margin: 0, fontSize: '28px', color: '#153e67', fontWeight: '900' }}>Join a class</h1>
        <p style={{ margin: '6px 0 0', color: '#688097', fontSize: '14px' }}>
          Enter the code your teacher shared to join their class and access assigned quizzes.
        </p>
      </div>

      {/* Join form */}
      <div style={{
        background: 'linear-gradient(130deg,#e7f9f5,#eaf8ff)',
        borderRadius: '20px', padding: '28px 32px',
        border: '1px solid #d4ebeb', marginBottom: '36px',
        maxWidth: '520px',
      }}>
        <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <label style={{ fontSize: '12px', fontWeight: '900', color: '#153e67' }}>
            CLASS JOIN CODE
          </label>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. MATH42"
            maxLength={6}
            disabled={loading}
            style={{
              textAlign: 'center', letterSpacing: '5px', textTransform: 'uppercase',
              fontWeight: '900', fontSize: '22px', padding: '14px',
              border: error ? '2px solid #e07b7b' : '1px solid #cddfe4',
              borderRadius: '14px', background: 'white', width: '100%',
              boxSizing: 'border-box',
            }}
          />

          {error && (
            <div style={{ background: '#ffe9e7', color: '#c85a59', padding: '11px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '600' }}>
              ⚠ {error}
            </div>
          )}
          {successMsg && (
            <div style={{ background: '#e5f9eb', color: '#1d7a45', padding: '11px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '600' }}>
              ✓ {successMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            style={{
              background: (loading || code.length !== 6) ? '#ccc' : 'linear-gradient(100deg,#19b7a7,#079c98)',
              color: 'white', padding: '14px', borderRadius: '999px',
              fontWeight: '900', border: 'none',
              cursor: (loading || code.length !== 6) ? 'not-allowed' : 'pointer',
              fontSize: '15px', transition: '0.15s',
            }}
          >
            {loading ? 'Joining…' : 'Enter your class →'}
          </button>
        </form>
      </div>

      {/* Enrolled classes */}
      <div>
        <h2 style={{ fontSize: '17px', color: '#153e67', margin: '0 0 16px', fontWeight: '900' }}>
          My enrolled classes
        </h2>

        {pageLoading ? (
          <p style={{ color: '#688097' }}>Loading…</p>
        ) : classrooms.length === 0 ? (
          <div style={{
            background: 'white', border: '1px dashed #cddfe4', borderRadius: '16px',
            padding: '32px', textAlign: 'center', color: '#688097',
          }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🎒</div>
            <p style={{ margin: 0, fontWeight: '600' }}>You haven't joined any classes yet.</p>
            <p style={{ margin: '6px 0 0', fontSize: '13px' }}>Enter a code above to get started.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {classrooms.map(cls => (
              <div key={cls.id} style={{
                background: 'white', border: '1px solid #e0eaed', borderRadius: '16px',
                overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}>
                {/* Header row */}
                <div
                  style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
                  onClick={() => toggleExpand(cls.id)}
                >
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '12px',
                    background: '#eef8ff', display: 'grid', placeItems: 'center', fontSize: '20px', flexShrink: 0,
                  }}>
                    🏫
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '900', fontSize: '15px', color: '#153e67' }}>{cls.name}</div>
                    <div style={{ fontSize: '12px', color: '#688097', marginTop: '2px' }}>
                      Grade {cls.grade} · {cls.subject} · <span style={{ color: '#12a99f', fontWeight: '700' }}>Teacher: {cls.teacher_name}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {cls.activities_count > 0 && (
                      <span style={{ background: '#eaf6ff', color: '#267ca8', borderRadius: '999px', padding: '4px 10px', fontSize: '11px', fontWeight: '900' }}>
                        {cls.activities_count} quiz{cls.activities_count !== 1 ? 'zes' : ''}
                      </span>
                    )}
                    <span style={{ color: '#12a99f', fontSize: '18px', fontWeight: '900', lineHeight: 1 }}>
                      {expandedClass === cls.id ? '▲' : '▼'}
                    </span>
                  </div>
                </div>

                {/* Expanded quizzes */}
                {expandedClass === cls.id && (
                  <div style={{ borderTop: '1px solid #e8f0f3', padding: '16px 20px', background: '#fbfcfd' }}>
                    <p style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: '900', color: '#153e67', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Assigned quizzes
                    </p>
                    {actLoading === cls.id ? (
                      <p style={{ color: '#688097', fontSize: '13px' }}>Loading quizzes…</p>
                    ) : !(activities[cls.id]?.length) ? (
                      <p style={{ color: '#688097', fontSize: '13px', margin: 0 }}>
                        No quizzes assigned to this class yet. Check back soon!
                      </p>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: '12px' }}>
                        {activities[cls.id].map(act => (
                          <div key={act.activity_id} style={{
                            background: 'white', border: '1px solid #e0eaed', borderRadius: '14px',
                            padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '22px' }}>{GAME_ICON[act.game_type] || '📝'}</span>
                              <div>
                                <div style={{ fontWeight: '800', fontSize: '13px', color: '#153e67' }}>{act.topic_title}</div>
                                <div style={{ fontSize: '11px', color: '#688097' }}>
                                  {act.game_type} · {MODE_LABEL[act.mode] || act.mode} · {act.difficulty}
                                </div>
                              </div>
                            </div>
                            {act.due_at && (
                              <div style={{ fontSize: '11px', color: '#a77818', background: '#fff8e1', borderRadius: '6px', padding: '3px 8px', alignSelf: 'flex-start' }}>
                                📅 Due {new Date(act.due_at).toLocaleDateString()}
                              </div>
                            )}
                            <button
                              onClick={() => navigate(`/play/a/${act.activity_id}`)}
                              style={{
                                background: 'linear-gradient(100deg,#19b7a7,#079c98)',
                                color: 'white', border: 'none', borderRadius: '999px',
                                padding: '9px 16px', fontWeight: '900', cursor: 'pointer',
                                fontSize: '12px', marginTop: '4px',
                              }}
                            >
                              Start quiz →
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
