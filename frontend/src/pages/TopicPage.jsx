import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import TeacherLayout from '../components/TeacherLayout';
import { api } from '../api.js';

export default function TopicPage({ user, onSignOut }) {
  const { topicId } = useParams();
  const [topic, setTopic] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generationOptions, setGenerationOptions] = useState({
    games: ['quiz'],
    difficulty: 'medium',
    questions_per_activity: 8,
    include_recall: true,
    include_apply: true,
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadTopic();
  }, [topicId]);

  const loadTopic = async () => {
    setLoading(true);
    try {
      const data = await api.topic(topicId);
      setTopic(data);
      setActivities(data.activities || []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateActivities = async () => {
    setGenerating(true);
    try {
      await api.generate(topicId, generationOptions);
      setError('');
      await loadTopic();
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <TeacherLayout
        crumb="Topic Details"
        activePage="topics"
        user={user}
        onSignOut={onSignOut}
      >
        <p style={{ color: '#688097', textAlign: 'center', padding: '40px' }}>Loading topic…</p>
      </TeacherLayout>
    );
  }

  if (!topic) {
    return (
      <TeacherLayout
        crumb="Topic Details"
        activePage="topics"
        user={user}
        onSignOut={onSignOut}
      >
        <p style={{ color: '#c00', textAlign: 'center', padding: '40px' }}>Topic not found</p>
        <div style={{ textAlign: 'center' }}>
          <button onClick={() => navigate('/')} style={{ padding: '11px 17px', background: '#19b7a7', color: 'white', border: 'none', borderRadius: '999px', fontWeight: '900', cursor: 'pointer', marginTop: '16px' }}>Back to Dashboard</button>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout
      crumb="Topic Details"
      activePage="topics"
      user={user}
      onSignOut={onSignOut}
    >
      {/* Title Section */}
      <div style={{ marginBottom: '22px' }}>
        <div style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.3px', color: '#078b84', marginBottom: '6px' }}>TOPIC DETAILS</div>
        <h1 style={{ fontSize: '29px', lineHeight: '1.18', color: '#153e67', fontWeight: '900', margin: '5px 0 7px', letterSpacing: '-0.7px' }}>{topic.title}</h1>
        <p style={{ color: '#688097', margin: '0', lineHeight: '1.6' }}>Grade {topic.grade} • {topic.subject}</p>
      </div>

      {error && (
        <div style={{ background: '#ffe0e0', color: '#c00', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {/* Learning Objectives */}
      {topic.objectives && topic.objectives.length > 0 && (
        <div className="card" style={{ background: 'white', border: '1px solid #e0eaed', borderRadius: '16px', padding: '19px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '17px', color: '#153e67', margin: '0 0 12px', fontWeight: '900' }}>Learning Objectives</h2>
          <ul style={{ listStyle: 'none', padding: '0', margin: '0', display: 'grid', gap: '8px' }}>
            {topic.objectives.map(obj => (
              <li key={obj.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '14px', color: '#23425e' }}>
                <span style={{ color: '#12a99f', fontWeight: '900', flexShrink: 0 }}>✓</span>
                <span>{obj.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Generate Activities Section */}
      <div className="card" style={{ background: 'white', border: '1px solid #e0eaed', borderRadius: '16px', padding: '19px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '17px', color: '#153e67', margin: '0 0 12px', fontWeight: '900' }}>Generate AI Activities</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '900', color: '#153e67', display: 'block', marginBottom: '4px' }}>Difficulty</label>
            <select 
              value={generationOptions.difficulty}
              onChange={(e) => setGenerationOptions({...generationOptions, difficulty: e.target.value})}
              style={{ width: '100%', border: '1px solid #d8e5e9', borderRadius: '11px', padding: '8px 12px', background: '#fff', color: '#23425e', fontSize: '14px', fontFamily: 'inherit' }}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '900', color: '#153e67', display: 'block', marginBottom: '4px' }}>Questions per Activity</label>
            <select 
              value={generationOptions.questions_per_activity}
              onChange={(e) => setGenerationOptions({...generationOptions, questions_per_activity: parseInt(e.target.value)})}
              style={{ width: '100%', border: '1px solid #d8e5e9', borderRadius: '11px', padding: '8px 12px', background: '#fff', color: '#23425e', fontSize: '14px', fontFamily: 'inherit' }}
            >
              {[5, 8, 10, 15, 20].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px', color: '#23425e' }}>
            <input type="checkbox" checked={generationOptions.include_recall} onChange={(e) => setGenerationOptions({...generationOptions, include_recall: e.target.checked})} />
            Include recall mode
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px', color: '#23425e' }}>
            <input type="checkbox" checked={generationOptions.include_apply} onChange={(e) => setGenerationOptions({...generationOptions, include_apply: e.target.checked})} />
            Include apply mode
          </label>
        </div>
        <button 
          onClick={handleGenerateActivities}
          disabled={generating}
          style={{ background: 'linear-gradient(100deg, #19b7a7, #079c98)', color: 'white', padding: '11px 17px', borderRadius: '999px', fontWeight: '900', border: '0', cursor: 'pointer', fontSize: '14px', transition: '0.15s' }}
        >
          {generating ? 'Generating...' : '✨ Generate Activities'}
        </button>
      </div>

      {/* Activities List */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '17px', color: '#153e67', margin: '0', fontWeight: '900' }}>Activities</h2>
          <span style={{ fontSize: '12px', color: '#688097', fontWeight: '700' }}>{activities.length} total</span>
        </div>
        {activities.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
            {activities.map(activity => (
              <div key={activity.id} className="card" style={{ background: 'white', border: '1px solid #e0eaed', borderRadius: '16px', padding: '19px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontSize: '18px' }}>
                    {activity.game_type === 'quiz' ? '🎯' : activity.game_type === 'matching' ? '🔀' : '📝'}
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', borderRadius: '999px', padding: '5px 9px', fontSize: '10px', fontWeight: '900', background: activity.published_version_id ? '#e5f8eb' : '#fff3d4', color: activity.published_version_id ? '#238650' : '#a77818' }}>
                    {activity.published_version_id ? '✓ Published' : '📋 Draft'}
                  </span>
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: '900', color: '#153e67', textTransform: 'capitalize' }}>{activity.mode} - {activity.game_type}</h3>
                <p style={{ fontSize: '12px', color: '#688097', margin: '0 0 12px' }}>
                  Difficulty: <strong>{activity.difficulty}</strong>
                </p>
                {activity.latest_version && (
                  <p style={{ fontSize: '12px', color: '#688097', margin: '0 0 16px' }}>
                    {activity.latest_version.item_count} questions · {activity.latest_version.status}
                  </p>
                )}
                <button 
                  onClick={() => navigate(`/topics/${topicId}/activity/${activity.id}`)}
                  style={{ background: '#eaf7f7', color: '#147d81', border: '1px solid #cde9e7', padding: '9px 13px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', width: '100%', fontSize: '12px' }}
                >
                  Review & Approve
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ background: 'white', border: '1px solid #e0eaed', borderRadius: '16px', padding: '30px', textAlign: 'center', color: '#688097' }}>
            <p style={{ fontSize: '14px', margin: '0 0 16px' }}>No activities yet. Generate some to get started!</p>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}
