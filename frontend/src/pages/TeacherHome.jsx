import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import TeacherLayout from '../components/TeacherLayout';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import ActivityCard from '../components/ActivityCard';
import CreateTopicModal from '../components/CreateTopicModal';

export default function TeacherHome({ user, onSignOut }) {
  const [topics, setTopics] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [studentsNeedingSupport, setStudentsNeedingSupport] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateTopicModal, setShowCreateTopicModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [topicsData, dashboardData, classroomsData, progressData] = await Promise.all([
        api.topics().catch(() => []),
        api.teacherDashboard().catch(() => null),
        api.classrooms().catch(() => []),
        api.studentProgress().catch(() => ({ students: [] }))
      ]);
      
      setTopics(topicsData || []);
      setDashboard(dashboardData || {
        teacher_name: user?.name || 'Teacher',
        total_topics: 0,
        students_engaged: 0,
        topics: []
      });
      
      setClassrooms(classroomsData || []);
      
      // progressData is an object with structure {students: [...]}
      const students = (progressData?.students || []).map(s => ({
        ...s,
        accuracy: s.scores && s.scores.length > 0 
          ? Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length)
          : 100,
        weak_area: 'Review needed'
      }));
      
      const needsSupport = students
        .filter(s => s.accuracy < 60)
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 2);
      setStudentsNeedingSupport(needsSupport);
      
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTopic = () => {
    navigate('/create');
  };

  const handleTopicCreated = (topic) => {
    // Reload topics after creation
    loadData();
    // Show success message
    alert(`Topic "${topic.title}" created! Now generate questions with AI or upload manually.`);
  };

  const handleViewStudentProgress = () => {
    navigate('/analytics');
  };

  const handleManageClasses = () => {
    navigate('/classes');
  };

  const handleViewAllResources = () => {
    navigate('/resources');
  };

  if (loading) {
    return (
      <TeacherLayout
        crumb="Teacher Studio / Overview"
        activePage="home"
        user={user}
        onSignOut={onSignOut}
      >
        <p style={{ color: '#688097', textAlign: 'center', padding: '40px' }}>Loading your dashboard…</p>
      </TeacherLayout>
    );
  }

  const studentCount = classrooms.reduce((sum, c) => sum + (c.students_count || 0), 0);
  const publishedCount = topics.reduce((sum, t) => sum + (t.activities?.filter(a => a.published_version_id).length || 0), 0);
  const studentsNeedingSupportCount = studentsNeedingSupport.length;

  return (
    <TeacherLayout
      crumb="Teacher Studio / Overview"
      activePage="home"
      user={user}
      onSignOut={onSignOut}
    >
      {error && (
        <div style={{ background: '#ffe0e0', color: '#c00', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        eyebrow="TEACHER WORKSPACE"
        title={`Good morning, ${user?.name}! ☀️`}
        subtitle="Here's how your learners are doing today. Let's turn practice into progress."
        action={
          <button
            onClick={handleCreateTopic}
            style={{
              background: 'linear-gradient(100deg, #19b7a7, #079c98)',
              color: 'white',
              padding: '11px 17px',
              borderRadius: '999px',
              fontWeight: '900',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 5px 12px #14a99f25'
            }}
          >
            ＋ Create REPLAY
          </button>
        }
      />

      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(110deg, #e4f7fa, #effaf8 65%, #fff3d5)',
        border: '1px solid #d6ecec',
        borderRadius: '18px',
        padding: 'clamp(16px,3vw,23px) clamp(18px,3vw,26px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '17px',
        overflow: 'hidden',
        flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.3px', color: '#078b84', marginBottom: '6px' }}>
            YOUR CLASSROOM AT A GLANCE
          </div>
          <h2 style={{ fontSize: '25px', lineHeight: '1.2', color: '#153e67', margin: '6px 0 7px', fontWeight: '900' }}>
            Every learner has a way to grow.
          </h2>
          <p style={{ color: '#58778b', margin: '0 0 14px' }}>
            Review class progress, spot learning gaps, and create a playful activity in minutes.
          </p>
          <button
            onClick={handleViewStudentProgress}
            style={{
              background: '#ffd44e',
              color: '#183f5d',
              padding: '11px 17px',
              borderRadius: '999px',
              fontWeight: '900',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            View student progress →
          </button>
        </div>
        <div style={{ fontSize: '64px', filter: 'drop-shadow(0 6px 3px #acdcd6)', padding: '0 14px' }} aria-hidden="true">
          👩🏻‍🏫📚
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '15px', marginBottom: '25px' }}>
        <StatCard
          icon="👩‍🎓"
          value={studentCount}
          label="Students joined"
          extra={`Across ${classrooms.length} classes`}
        />
        <StatCard
          icon="🎮"
          value={publishedCount}
          label="Published REPLAYs"
          extra="Ready for students"
        />
        <StatCard
          icon="🧠"
          value="72%"
          label="Average concept mastery"
          trend="↑ 8% this month"
        />
        <StatCard
          icon="🫶"
          value={studentsNeedingSupportCount}
          label="Need extra support"
          extra="A small check-in may help"
        />
      </div>

      {/* Quick Create Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '25px' }}>
        <div style={{
          background: 'linear-gradient(115deg, #e4f7fa, #effaf8)',
          border: '1px solid #cde9e7',
          borderRadius: '16px',
          padding: '20px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          textAlign: 'center'
        }}
        onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)'}
        onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
        onClick={() => setShowCreateTopicModal(true)}
        >
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📝</div>
          <h3 style={{ color: '#153e67', fontSize: '14px', margin: '0 0 8px', fontWeight: '900' }}>
            Create Topic
          </h3>
          <p style={{ color: '#688097', fontSize: '12px', margin: '0' }}>
            Set up learning objectives and reference materials
          </p>
        </div>

        <div style={{
          background: 'linear-gradient(115deg, #fffaf0, #fff3d5)',
          border: '1px solid #f5dba8',
          borderRadius: '16px',
          padding: '20px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          textAlign: 'center'
        }}
        onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)'}
        onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
        onClick={() => navigate('/create')}
        >
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>✨</div>
          <h3 style={{ color: '#153e67', fontSize: '14px', margin: '0 0 8px', fontWeight: '900' }}>
            Generate with AI
          </h3>
          <p style={{ color: '#688097', fontSize: '12px', margin: '0' }}>
            Let AI create questions from your topic
          </p>
        </div>

        <div style={{
          background: 'linear-gradient(115deg, #f0f9ff, #e9f5ff)',
          border: '1px solid #b3d9ff',
          borderRadius: '16px',
          padding: '20px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          textAlign: 'center'
        }}
        onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)'}
        onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
        onClick={() => navigate('/drafts')}
        >
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
          <h3 style={{ color: '#153e67', fontSize: '14px', margin: '0 0 8px', fontWeight: '900' }}>
            Review Drafts
          </h3>
          <p style={{ color: '#688097', fontSize: '12px', margin: '0' }}>
            Approve, edit, or publish your questions
          </p>
        </div>
      </div>

      {/* Classroom Overview Section */}
      <div style={{ marginBottom: '25px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div>
            <h2 style={{ fontSize: '17px', color: '#153e67', margin: '0', fontWeight: '900' }}>
              Classroom overview
            </h2>
            <p style={{ fontSize: '12px', color: '#688097', margin: '4px 0 0' }}>
              Concept mastery across your active class.
            </p>
          </div>
          <button
            onClick={handleManageClasses}
            style={{
              background: 'white',
              color: '#153e67',
              border: '1px solid #dce8ed',
              padding: '11px 17px',
              borderRadius: '999px',
              fontWeight: '900',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Manage classes →
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,340px), 1fr))', gap: '15px' }}>
          {/* Class Performance Card */}
          <div style={{
            background: 'white',
            border: '1px solid #e0eaed',
            borderRadius: '16px',
            padding: '19px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: '0', color: '#153e67', fontSize: '14px', fontWeight: '900' }}>
                Class performance
              </h3>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                borderRadius: '999px',
                padding: '5px 9px',
                fontSize: '10px',
                fontWeight: '900',
                background: '#e5f8eb',
                color: '#238650'
              }}>
                ✓ Live overview
              </span>
            </div>

            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '300px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5edef' }}>
                    <th style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#7890a0', textAlign: 'left', padding: '12px 10px' }}>Class</th>
                    <th style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#7890a0', textAlign: 'center', padding: '12px 10px' }}>Joined</th>
                    <th style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#7890a0', textAlign: 'center', padding: '12px 10px' }}>Join code</th>
                  </tr>
                </thead>
                <tbody>
                  {classrooms.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #edf2f3' }}>
                      <td style={{ padding: '13px 10px' }}>
                        <strong style={{ display: 'block', color: '#153e67', fontWeight: '900', fontSize: '12px' }}>
                          Class {c.grade} · {c.name}
                        </strong>
                        <div style={{ fontSize: '10px', color: '#688097' }}>
                          Grade {c.grade} · {c.subject}
                        </div>
                      </td>
                      <td style={{ padding: '13px 10px', textAlign: 'center', fontSize: '12px', color: '#153e67', fontWeight: '900' }}>
                        {c.students_count}/{c.max_students}
                      </td>
                      <td style={{ padding: '13px 10px', textAlign: 'center' }}>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(c.code);
                            alert(`Code ${c.code} copied!`);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            borderRadius: '999px',
                            padding: '5px 9px',
                            fontSize: '10px',
                            fontWeight: '900',
                            background: '#eaf6ff',
                            color: '#267ca8',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          {c.code} ⧉
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Learners to Check In Card */}
          <div style={{
            background: 'white',
            border: '1px solid #e0eaed',
            borderRadius: '16px',
            padding: '19px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: '0', color: '#153e67', fontSize: '14px', fontWeight: '900' }}>
                Learners to check in with
              </h3>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                borderRadius: '999px',
                padding: '5px 9px',
                fontSize: '10px',
                fontWeight: '900',
                background: '#ffe9e7',
                color: '#c85a59'
              }}>
                Needs support
              </span>
            </div>

            <div style={{ display: 'grid', gap: '0' }}>
              {studentsNeedingSupport.length > 0 ? (
                studentsNeedingSupport.map((student, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '12px 0', borderBottom: idx < studentsNeedingSupport.length - 1 ? '1px solid #edf2f3' : 'none' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '12px',
                      display: 'grid',
                      placeItems: 'center',
                      background: '#eef8ff',
                      fontSize: '18px',
                      flexShrink: '0'
                    }}>
                      👤
                    </div>
                    <div style={{ flex: '1', minWidth: '0' }}>
                      <strong style={{ display: 'block', color: '#153e67', fontSize: '12px' }}>
                        {student.name}
                      </strong>
                      <small style={{ color: '#688097', fontSize: '11px' }}>
                        {student.weak_area}
                      </small>
                    </div>
                    <button
                      onClick={handleViewStudentProgress}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#12a99f',
                        fontWeight: '900',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      View →
                    </button>
                  </div>
                ))
              ) : (
                <div style={{ padding: '12px 0', textAlign: 'center', color: '#688097', fontSize: '12px' }}>
                  All students are doing well! 🎉
                </div>
              )}
            </div>

            <button
              onClick={handleViewStudentProgress}
              style={{
                width: '100%',
                padding: '11px 17px',
                marginTop: '10px',
                borderRadius: '999px',
                background: '#eaf7f7',
                color: '#147d81',
                border: '1px solid #cde9e7',
                fontWeight: '900',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Open learner insights
            </button>
          </div>
        </div>
      </div>

      {/* Recently Published Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div>
            <h2 style={{ fontSize: '17px', color: '#153e67', margin: '0', fontWeight: '900' }}>
              Recently published
            </h2>
            <p style={{ fontSize: '12px', color: '#688097', margin: '4px 0 0' }}>
              Activities students can play now.
            </p>
          </div>
          <button
            onClick={handleViewAllResources}
            style={{
              background: 'none',
              border: 'none',
              color: '#12a99f',
              fontWeight: '900',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            View all →
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
          {topics.slice(0, 3).map(topic =>
            topic.activities?.filter(a => a.published_version_id).slice(0, 1).map(activity => (
              <ActivityCard
                key={activity.id}
                activity={{
                  id: activity.id,
                  title: topic.title,
                  grade: topic.grade,
                  subject: topic.subject,
                  type: activity.game_type,
                  questions: activity.latest_version?.item_count || 0,
                  status: 'Published',
                  plays: 0,
                  avg: 0
                }}
                onAction={(id) => navigate(`/topic/${topic.id}`)}
              />
            ))
          )}
        </div>
      </div>

      {/* Create Topic Modal */}
      <CreateTopicModal 
        isOpen={showCreateTopicModal}
        onClose={() => setShowCreateTopicModal(false)}
        onTopicCreated={handleTopicCreated}
      />
    </TeacherLayout>
  );
}
