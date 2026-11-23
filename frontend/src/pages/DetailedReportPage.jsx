import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import TeacherLayout from '../components/TeacherLayout';
import { api } from '../api.js';

export default function DetailedReportPage({ user, onSignOut }) {
  const { topicId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadReport();
  }, [topicId]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await api.topicDetailedReport(topicId);
      setReport(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <TeacherLayout
        crumb="Detailed Reports"
        activePage="analytics"
        user={user}
        onSignOut={onSignOut}
      >
        <p style={{ color: '#688097', textAlign: 'center', padding: '40px' }}>Loading report…</p>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout
      crumb="Detailed Reports"
      activePage="analytics"
      user={user}
      onSignOut={onSignOut}
    >
      {report && (
        <>
          <div style={{ marginBottom: '22px' }}>
            <div style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.3px', color: '#078b84' }}>STUDENT PROGRESS</div>
            <h1 style={{ fontSize: '29px', lineHeight: '1.18', color: '#153e67', fontWeight: '900', margin: '5px 0 7px', letterSpacing: '-0.7px' }}>{report.topic_title}</h1>
            <p style={{ color: '#688097', margin: '0' }}>Grade {report.grade} • {report.subject} — Detailed performance breakdown</p>
          </div>

          {error && (
            <div style={{ background: '#ffe0e0', color: '#c00', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          {/* Summary Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '25px' }}>
            <div className="card" style={{ background: 'white', border: '1px solid #e0eaed', borderRadius: '16px', padding: '19px' }}>
              <div style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#688097', marginBottom: '8px' }}>Total Attempts</div>
              <div style={{ fontSize: '32px', fontWeight: '900', color: '#153e67' }}>{report.total_attempts}</div>
            </div>
            <div className="card" style={{ background: 'white', border: '1px solid #e0eaed', borderRadius: '16px', padding: '19px' }}>
              <div style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#688097', marginBottom: '8px' }}>Avg Score</div>
              <div style={{ fontSize: '32px', fontWeight: '900', color: '#153e67' }}>{report.average_score !== null ? report.average_score : 'N/A'}%</div>
            </div>
            <div className="card" style={{ background: 'white', border: '1px solid #e0eaed', borderRadius: '16px', padding: '19px' }}>
              <div style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#688097', marginBottom: '8px' }}>Students</div>
              <div style={{ fontSize: '32px', fontWeight: '900', color: '#153e67' }}>{report.total_students_engaged}</div>
            </div>
          </div>

          {/* Student Details Table */}
          {report.student_reports && report.student_reports.length > 0 && (
            <div className="card" style={{ background: 'white', border: '1px solid #e0eaed', borderRadius: '16px', padding: '30px', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '17px', color: '#153e67', margin: '0 0 20px', fontWeight: '900' }}>Student Performance</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e5edef' }}>
                      <th style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#7890a0', textAlign: 'left', padding: '12px 10px' }}>Student</th>
                      <th style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#7890a0', textAlign: 'center', padding: '12px 10px' }}>Score</th>
                      <th style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#7890a0', textAlign: 'center', padding: '12px 10px' }}>Activity Type</th>
                      <th style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#7890a0', textAlign: 'center', padding: '12px 10px' }}>Hints Used</th>
                      <th style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#7890a0', textAlign: 'left', padding: '12px 10px' }}>Mastery</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.student_reports.map((student, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #edf2f3' }}>
                        <td style={{ padding: '13px 10px', fontSize: '12px', color: '#153e67', fontWeight: '900' }}>{student.student_name}</td>
                        <td style={{ padding: '13px 10px', fontSize: '12px', textAlign: 'center', fontWeight: '900', color: '#12a99f' }}>{student.score !== null ? student.score : 'N/A'}%</td>
                        <td style={{ padding: '13px 10px', fontSize: '12px', textAlign: 'center', color: '#688097', textTransform: 'capitalize' }}>{student.game_type}</td>
                        <td style={{ padding: '13px 10px', fontSize: '12px', textAlign: 'center', color: '#688097' }}>{student.hints_revealed}</td>
                        <td style={{ padding: '13px 10px', fontSize: '12px' }}>
                          {student.objectives_mastered?.length > 0 && (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              {student.objectives_mastered.slice(0, 2).map(obj => (
                                <span key={obj.objective_id} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', borderRadius: '999px', padding: '3px 8px', fontSize: '10px', fontWeight: '900', background: obj.mastery >= 70 ? '#e5f8eb' : '#fff3d4', color: obj.mastery >= 70 ? '#238650' : '#a77818' }}>
                                  {obj.mastery >= 70 ? '✓' : '◐'} {obj.mastery}%
                                </span>
                              ))}
                              {student.objectives_mastered.length > 2 && (
                                <span style={{ fontSize: '10px', color: '#688097', fontWeight: '900' }}>+{student.objectives_mastered.length - 2}</span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </TeacherLayout>
  );
}
