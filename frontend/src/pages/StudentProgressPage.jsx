import { useState, useEffect } from 'react';
import TeacherLayout from '../components/TeacherLayout';
import PageHeader from '../components/PageHeader';
import { api } from '../api.js';

export default function StudentProgressPage({ user, onSignOut }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    loadStudentProgress();
  }, []);

  const loadStudentProgress = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all students' progress - response is {students: [...], classrooms: [...], summary: {...}}
      const response = await api.studentProgress();
      
      // Map the students data and add calculated fields
      const studentsData = (response?.students || []).map(student => ({
        ...student,
        accuracy: student.scores && student.scores.length > 0 
          ? Math.round(student.scores.reduce((a, b) => a + b, 0) / student.scores.length)
          : 0,
        mastery: student.scores && student.scores.length > 0 
          ? Math.round(student.scores.reduce((a, b) => a + b, 0) / student.scores.length)
          : 0,
        attempts_count: student.attempts ? student.attempts.length : 0,
        pace: 'Steady',
        weak_area: 'Review needed',
        strong_area: 'Consistent improvement',
        recent_activity: 'Today',
        topics_count: 1,
        emoji: '👤'
      }));
      
      setStudents(studentsData || []);
    } catch (err) {
      console.error('Failed to load student progress:', err);
      setError(err.message || 'Failed to load student progress');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const getPaceColor = (pace) => {
    if (pace === 'Fast') return { bg: '#e5f8eb', color: '#238650' };
    if (pace === 'Steady') return { bg: '#eaf6ff', color: '#267ca8' };
    if (pace === 'Needs support') return { bg: '#ffe9e7', color: '#c85a59' };
    return { bg: '#f0f0f0', color: '#666' };
  };

  const getHeatColor = (accuracy) => {
    if (accuracy >= 80) return '#45b980';
    if (accuracy >= 60) return '#f3c44f';
    return '#ed7777';
  };

  return (
    <TeacherLayout
      crumb="Teacher Studio / Student progress"
      activePage="analytics"
      user={user}
      onSignOut={onSignOut}
    >
      <PageHeader
        eyebrow="LEARNER INSIGHTS"
        title="Student progress"
        subtitle={`Track learning, spot gaps, and support ${students.length} students`}
      />

      {loading && (
        <p style={{ color: '#688097', textAlign: 'center', padding: '40px' }}>Loading student data…</p>
      )}

      {!loading && error && (
        <div style={{ background: '#ffe0e0', color: '#c00', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
          Error: {error}
        </div>
      )}

      {!loading && students.length === 0 && !error && (
        <p style={{ color: '#688097', textAlign: 'center', padding: '40px' }}>No student progress data available. Create and publish activities to track student learning.</p>
      )}

      {!loading && students.length > 0 && selectedStudent ? (
        // Student Detail View
        <div>
          <button
            onClick={() => setSelectedStudent(null)}
            style={{
              background: 'white',
              border: '1px solid #dce8ed',
              padding: '8px 16px',
              borderRadius: '999px',
              fontWeight: '900',
              cursor: 'pointer',
              fontSize: '12px',
              marginBottom: '20px'
            }}
          >
            ← Back to all students
          </button>

          <div style={{ background: 'white', border: '1px solid #e0eaed', borderRadius: '16px', padding: '30px' }}>
            {/* Student Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '30px' }}>
              <div style={{
                width: '58px',
                height: '58px',
                borderRadius: '18px',
                background: '#fff0d5',
                display: 'grid',
                placeItems: 'center',
                fontSize: '29px'
              }}>
                {selectedStudent.emoji}
              </div>
              <div>
                <h2 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '900', color: '#153e67' }}>
                  {selectedStudent.name}
                </h2>
                <p style={{ fontSize: '12px', color: '#688097', margin: '0' }}>
                  {selectedStudent.grade}
                </p>
              </div>
            </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '30px' }}>
            <div style={{ background: '#f0f9f7', padding: '16px', borderRadius: '12px' }}>
              <div style={{ fontSize: '10px', fontWeight: '900', color: '#688097', textTransform: 'uppercase', marginBottom: '8px' }}>Accuracy</div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#153e67' }}>{selectedStudent.accuracy}%</div>
            </div>
            <div style={{ background: '#f0f9f7', padding: '16px', borderRadius: '12px' }}>
              <div style={{ fontSize: '10px', fontWeight: '900', color: '#688097', textTransform: 'uppercase', marginBottom: '8px' }}>Mastery</div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#153e67' }}>{selectedStudent.mastery}%</div>
            </div>
            <div style={{ background: '#f0f9f7', padding: '16px', borderRadius: '12px' }}>
              <div style={{ fontSize: '10px', fontWeight: '900', color: '#688097', textTransform: 'uppercase', marginBottom: '8px' }}>Attempts</div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#153e67' }}>{selectedStudent.attempts_count}</div>
            </div>
          </div>

          {/* Sections */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            <div>
              <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '900', color: '#153e67' }}>💪 Strength</h3>
              <p style={{ fontSize: '12px', color: '#688097', margin: '0' }}>{selectedStudent.strong_area}</p>
            </div>
            <div>
              <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '900', color: '#153e67' }}>🎯 Challenge</h3>
              <p style={{ fontSize: '12px', color: '#688097', margin: '0' }}>{selectedStudent.weak_area}</p>
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '900', color: '#153e67' }}>📊 Recent Activity</h3>
            <p style={{ fontSize: '12px', color: '#688097' }}>Last practiced: <strong>{selectedStudent.recent_activity}</strong></p>
            <p style={{ fontSize: '12px', color: '#688097' }}>Topics: <strong>{selectedStudent.topics_count}</strong></p>
          </div>
          </div>
        </div>
      ) : (
        // Student List Table
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5edef' }}>
                <th style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#7890a0', textAlign: 'left', padding: '12px 10px' }}>Student</th>
                <th style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#7890a0', textAlign: 'center', padding: '12px 10px' }}>Accuracy</th>
                <th style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#7890a0', textAlign: 'center', padding: '12px 10px' }}>Pace</th>
                <th style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#7890a0', textAlign: 'center', padding: '12px 10px' }}>Mastery</th>
                <th style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#7890a0', textAlign: 'center', padding: '12px 10px' }}>Attempts</th>
                <th style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#7890a0', textAlign: 'left', padding: '12px 10px' }}>Weak Area</th>
                <th style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#7890a0', textAlign: 'center', padding: '12px 10px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, idx) => {
                const paceColor = getPaceColor(student.pace);
                return (
                  <tr key={idx} style={{ borderBottom: '1px solid #edf2f3', cursor: 'pointer' }} onClick={() => setSelectedStudent(student)}>
                    <td style={{ padding: '13px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px' }}>👤</span>
                      <div>
                        <strong style={{ color: '#153e67', display: 'block' }}>{student.name}</strong>
                        <small style={{ color: '#688097', fontSize: '10px' }}>{student.email}</small>
                      </div>
                    </td>
                    <td style={{ padding: '13px 10px', fontSize: '12px', textAlign: 'center', color: '#153e67', fontWeight: '900' }}>
                      {student.accuracy}%
                    </td>
                    <td style={{ padding: '13px 10px', fontSize: '12px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        borderRadius: '999px',
                        padding: '5px 9px',
                        fontSize: '10px',
                        fontWeight: '900',
                        background: paceColor.bg,
                        color: paceColor.color
                      }}>
                        {student.pace}
                      </span>
                    </td>
                    <td style={{ padding: '13px 10px', fontSize: '12px', textAlign: 'center', color: '#153e67', fontWeight: '900' }}>
                      {student.mastery}%
                    </td>
                    <td style={{ padding: '13px 10px', fontSize: '12px', textAlign: 'center', color: '#153e67', fontWeight: '900' }}>
                      {student.attempts_count}
                    </td>
                    <td style={{ padding: '13px 10px', fontSize: '12px', color: '#688097' }}>
                      {student.weak_area}
                    </td>
                    <td style={{ padding: '13px 10px', textAlign: 'center' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStudent(student);
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          background: '#eaf7f7',
                          color: '#147d81',
                          border: '1px solid #cde9e7',
                          fontWeight: '800',
                          cursor: 'pointer',
                          fontSize: '11px'
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </TeacherLayout>
  );
}
