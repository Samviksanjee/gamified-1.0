import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import '../styles/pages.css';

export default function MyLearning({ user }) {
  const [dashboard, setDashboard] = useState(null);
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(true);
  const navigate = useNavigate();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const dashboardData = await api.studentDashboard();
      setDashboard(dashboardData);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <p style={{ color: '#688097' }}>Loading…</p>
    </div>
  );

  return (
    <>
      <div className="welcome">
        <div>
          <div className="eyebrow">Your learning space</div>
          <h2>Hi, {user?.name}! ⭐</h2>
          <p className="sub" style={{ margin: '3px 0 0' }}>You're doing great! Keep going!</p>
        </div>
        <div className="goal">
          <span className="emoji">⏱️</span>
          <div>
            <small>Today's goal</small>
            <strong>10 minutes REPLAY</strong>
            <div className="progress" style={{ width: '130px', marginTop: '5px' }}>
              <span style={{ width: `${Math.min(dashboard?.daily_progress || 0, 100)}%` }}></span>
            </div>
          </div>
        </div>
      </div>

      {error && <div style={{ padding: '16px', background: '#ffe0e0', color: '#c00', borderRadius: '8px', marginBottom: '20px' }}>{error}</div>}

      {dashboard && (
        <>
          <div className="grid two">
            {dashboard.recommended_activity && (
              <article className="card" style={{ background: 'linear-gradient(115deg, #37b7df, #278fc7)', color: 'white' }}>
                <div className="eyebrow" style={{ color: '#e5ffff' }}>TODAY'S REPLAY</div>
                <h3 style={{ color: 'white', fontSize: '20px', margin: '8px 0' }}>{dashboard.recommended_activity?.title || 'Ready to learn?'}</h3>
                <p style={{ margin: '0 0 16px' }}>5 questions · 3 minutes</p>
                <button onClick={() => navigate(`/play/a/${dashboard.recommended_activity?.id}`)} className="btn btn-yellow" style={{ cursor: 'pointer', border: 'none' }}>
                  Start now →
                </button>
              </article>
            )}

            <article className="card">
              <h3>Your Learning Path</h3>
              <div className="path-card" style={{ marginTop: '18px' }}>
                {dashboard.topics?.slice(0, 4).map((topic, idx) => (
                  <div key={topic.id} className={`path-step ${topic.completion_percentage === 0 && idx > 0 ? 'locked' : ''}`}>
                    <div className="path-icon">
                      {topic.completion_percentage === 0 && idx > 0 ? '🔒' : '✓'}
                    </div>
                    <small>{topic.title}</small>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <div className="section-head">
            <h2>Concepts needing practice</h2>
            <button onClick={() => navigate('/resources')} className="text-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#078b84', fontWeight: '900' }}>Explore chapters →</button>
          </div>

          <div className="grid two">
            <article className="card">
              {dashboard.topics?.slice(0, 3).map((topic) => (
                <div key={topic.id} className="list-item">
                  <span className="dot" style={{ background: topic.completion_percentage === 100 ? '#4dbb85' : topic.completion_percentage > 0 ? '#f4c64d' : '#f07878' }}></span>
                  <span style={{ flex: '1' }}>{topic.title}</span>
                  <span className="badge green-bg" style={{ background: topic.completion_percentage === 100 ? '#e5f8eb' : topic.completion_percentage > 0 ? '#fff3d4' : '#ffe9e7', color: topic.completion_percentage === 100 ? '#238650' : topic.completion_percentage > 0 ? '#a77818' : '#c85a59' }}>
                    {topic.completion_percentage === 100 ? 'Mastered' : topic.completion_percentage > 0 ? 'Practising' : 'Try Again'}
                  </span>
                </div>
              ))}
            </article>

            <article className="card">
              <h3>My Mastery Badges</h3>
              <div className="grid three" style={{ marginTop: '16px', gap: '6px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '36px' }}>🌱</div>
                  <small>Curious<br />Learner</small>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '36px' }}>🏆</div>
                  <small>Problem<br />Solver</small>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '36px' }}>⭐</div>
                  <small>Science<br />Explorer</small>
                </div>
              </div>
            </article>
          </div>

          <div className="section-head">
            <h2>My concept mastery</h2>
          </div>

          <div className="grid three">
            <article className="card stat">
              <div className="stat-icon">🟢</div>
              <div>
                <strong>{dashboard.mastered_count || 0}</strong>
                <small>Mastered</small>
              </div>
            </article>
            <article className="card stat">
              <div className="stat-icon" style={{ background: '#fff4d5' }}>🟡</div>
              <div>
                <strong>{dashboard.practising_count || 0}</strong>
                <small>Practising</small>
              </div>
            </article>
            <article className="card stat">
              <div className="stat-icon" style={{ background: '#ffefed' }}>🔴</div>
              <div>
                <strong>{dashboard.retry_count || 0}</strong>
                <small>Try Again</small>
              </div>
            </article>
          </div>

          <div className="section-head">
            <h2>Spaced revisit calendar</h2>
          </div>

          <article className="card">
            <div className="row between" style={{ marginBottom: '12px' }}>
              <h3>October 2026</h3>
              <span className="badge green-bg">3-day streak 🔥</span>
            </div>
            <div className="calendar">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                <b key={`header-${idx}`} style={{ color: '#8398a5', padding: '5px' }}>{day}</b>
              ))}
              {Array.from({ length: 35 }, (_, i) => {
                const dayNum = i - 2;
                const doneOnDays = [1, 4, 8, 10, 14, 17, 20, 22, 26];
                const isToday = dayNum === 14;
                const isDone = doneOnDays.includes(dayNum);
                return (
                  <span key={`day-${i}`} style={{
                    padding: '7px 0', borderRadius: '8px',
                    ...(isDone && { background: '#dff6e8', color: '#21875b', fontWeight: '900' }),
                    ...(isToday && { background: '#dff4fc', color: '#1975a3', fontWeight: '900', border: '1px solid #80cce1' })
                  }}>
                    {dayNum > 0 && dayNum <= 31 ? dayNum : ''}
                  </span>
                );
              })}
            </div>
          </article>

          <div className="section-head">
            <h2>Available activities by topic</h2>
          </div>

          {dashboard.topics?.map(topic => (
            <div key={topic.id} style={{ marginBottom: '32px' }}>
              <h3>{topic.title}</h3>
              <p style={{ color: '#688097', marginBottom: '16px' }}>Grade {topic.grade} • {topic.subject}</p>
              <div className="grid three">
                {topic.activities?.map(activity => (
                  <button
                    key={activity.id}
                    onClick={() => navigate(`/play/a/${activity.id}`)}
                    className="card activity-card"
                    style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid #e0eaed', background: 'white' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                      <span className="badge green-bg" style={{ background: '#e8f4fd', color: '#36a9db', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
                        {activity.mode}
                      </span>
                    </div>
                    <h4>{activity.game_type}</h4>
                    {activity.best_score != null && (
                      <p style={{ fontSize: '12px', color: '#688097', marginTop: '8px' }}>Best: {activity.best_score}%</p>
                    )}
                    <button className="btn btn-primary" style={{ marginTop: '12px', width: '100%' }}>
                      Start Activity →
                    </button>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </>
  );
}
