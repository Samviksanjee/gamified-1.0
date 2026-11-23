import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import TeacherLayout from '../components/TeacherLayout';
import PageHeader from '../components/PageHeader';
import ClassCard from '../components/ClassCard';
import Modal from '../components/Modal';
import { api } from '../api.js';

// ── small reusable helpers ────────────────────────────────────────────────────
function Toast({ msg, type = 'success', onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
      background: type === 'error' ? '#ffe9e7' : '#e5f9eb',
      color: type === 'error' ? '#c85a59' : '#1d7a45',
      border: `1px solid ${type === 'error' ? '#f5b8b5' : '#8ddcac'}`,
      borderRadius: '12px', padding: '14px 20px', fontWeight: '700', fontSize: '13px',
      boxShadow: '0 4px 18px rgba(0,0,0,0.10)',
    }}>
      {msg}
    </div>
  );
}

const SUBJECTS = ['Mathematics', 'Science', 'English', 'Social Studies', 'Maths'];
const GRADES   = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export default function ClassesPage({ user, onSignOut }) {
  const [classes,          setClasses]          = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [toast,            setToast]            = useState(null);
  const [showCreateModal,  setShowCreateModal]  = useState(false);
  const [detailClass,      setDetailClass]      = useState(null); // classroom object for detail modal
  const [detailStudents,   setDetailStudents]   = useState([]);
  const [detailActivities, setDetailActivities] = useState([]);
  const [assignableTopics, setAssignableTopics] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState('');
  const [assignLoading,    setAssignLoading]    = useState(false);
  const [formData, setFormData] = useState({ name: '', grade: 5, subject: 'Science', max_students: 30 });
  const navigate = useNavigate();

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  // ── load classroom list ──────────────────────────────────────────────────
  const loadClasses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.classrooms();
      setClasses((data || []).map(c => ({ ...c, joined: c.students_count, students: c.max_students })));
    } catch { setClasses([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadClasses(); }, [loadClasses]);

  // ── load publishable activities (all teacher topics) for assign dropdown ──
  const loadAssignableActivities = useCallback(async () => {
    try {
      const topics = await api.topics();
      const flat = [];
      for (const t of (topics || [])) {
        for (const a of (t.activities || [])) {
          if (a.is_published) {
            flat.push({ id: a.id, label: `${t.title} – ${a.game_type} (${a.mode})` });
          }
        }
      }
      setAssignableTopics(flat);
    } catch { setAssignableTopics([]); }
  }, []);

  // ── open classroom detail modal ──────────────────────────────────────────
  const openDetail = async (id) => {
    const cls = classes.find(c => c.id === id);
    if (!cls) return;
    setDetailClass(cls);
    setDetailStudents([]);
    setDetailActivities([]);
    setSelectedActivity('');
    loadAssignableActivities();
    try {
      const [studentsData, activitiesData] = await Promise.all([
        api.classroom(id).then(r => r.students || []),
        api.classroomAssignedActivities(id).catch(() => []),
      ]);
      setDetailStudents(studentsData);
      setDetailActivities(activitiesData);
    } catch (err) {
      showToast('Failed to load class details: ' + err.message, 'error');
    }
  };

  // ── create classroom ─────────────────────────────────────────────────────
  const handleCreateClass = async () => {
    if (!formData.name.trim()) { showToast('Class name is required', 'error'); return; }
    try {
      const newClassroom = await api.createClassroom(formData);
      setClasses(prev => [...prev, { ...newClassroom, joined: 0, students: newClassroom.max_students }]);
      setFormData({ name: '', grade: 5, subject: 'Science', max_students: 30 });
      setShowCreateModal(false);
      showToast(`Class "${newClassroom.name}" created! Code: ${newClassroom.code}`);
    } catch (err) { showToast('Error creating class: ' + err.message, 'error'); }
  };

  // ── delete classroom ─────────────────────────────────────────────────────
  const handleDeleteClass = async (id) => {
    if (!window.confirm('Delete this classroom? All enrollments and assignments will be removed.')) return;
    try {
      await api.deleteClassroom(id);
      setClasses(prev => prev.filter(c => c.id !== id));
      if (detailClass?.id === id) setDetailClass(null);
      showToast('Classroom deleted');
    } catch (err) { showToast('Delete failed: ' + err.message, 'error'); }
  };

  // ── remove student from classroom ────────────────────────────────────────
  const handleRemoveStudent = async (classroomId, studentId) => {
    if (!window.confirm('Remove this student from the classroom?')) return;
    try {
      await api.deleteClassroom(`${classroomId}/students/${studentId}`);  // reuses DELETE pattern
      setDetailStudents(prev => prev.filter(s => s.id !== studentId));
      showToast('Student removed');
    } catch (err) { showToast('Failed: ' + err.message, 'error'); }
  };

  // ── assign activity ──────────────────────────────────────────────────────
  const handleAssign = async () => {
    if (!selectedActivity || !detailClass) return;
    setAssignLoading(true);
    try {
      await api.assignActivity(detailClass.id, { activity_id: parseInt(selectedActivity) });
      const updated = await api.classroomAssignedActivities(detailClass.id).catch(() => []);
      setDetailActivities(updated);
      setSelectedActivity('');
      showToast('Activity assigned to class');
    } catch (err) { showToast('Assign failed: ' + err.message, 'error'); }
    finally { setAssignLoading(false); }
  };

  // ── unassign activity ────────────────────────────────────────────────────
  const handleUnassign = async (activityId) => {
    if (!detailClass) return;
    try {
      await api.unassignActivity(detailClass.id, activityId);
      setDetailActivities(prev => prev.filter(a => a.activity_id !== activityId));
      showToast('Activity removed from class');
    } catch (err) { showToast('Failed: ' + err.message, 'error'); }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code).catch(() => {});
    showToast(`Code ${code} copied to clipboard`);
  };

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <TeacherLayout crumb="Teacher Studio / My classes" activePage="classes" user={user} onSignOut={onSignOut}>
      <PageHeader
        eyebrow="CLASSROOM MANAGEMENT"
        title="My classes"
        subtitle="Create classes, share a join code, and bring students into the right classroom."
        action={
          <button
            onClick={() => setShowCreateModal(true)}
            style={{ background: 'linear-gradient(100deg,#19b7a7,#079c98)', color: 'white', padding: '11px 17px', borderRadius: '999px', fontWeight: '900', border: 'none', cursor: 'pointer' }}
          >
            ＋ Create class
          </button>
        }
      />

      {loading ? (
        <p style={{ color: '#688097' }}>Loading classes…</p>
      ) : classes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#688097' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏫</div>
          <h3 style={{ color: '#153e67' }}>No classes yet</h3>
          <p>Create your first class to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px', marginBottom: '40px' }}>
          {classes.map(cls => (
            <ClassCard
              key={cls.id}
              classData={cls}
              onDetails={openDetail}
              onDelete={handleDeleteClass}
              onProgress={(id) => navigate(`/analytics?class=${id}`)}
              onCopyCode={handleCopyCode}
            />
          ))}
        </div>
      )}

      {/* How Students Join */}
      <div style={{ marginTop: '40px' }}>
        <h2 style={{ fontSize: '17px', color: '#153e67', margin: '0 0 20px', fontWeight: '900' }}>How students join</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '15px' }}>
          {[
            ['1️⃣', 'Share the code',   'Give students the class code or display it on your screen.'],
            ['2️⃣', 'Student enters code', 'Students open the Join Class page and type the code.'],
            ['3️⃣', 'Assign quizzes',   'Use "Class details" to assign published quizzes to the class.'],
          ].map(([emoji, title, desc]) => (
            <div key={title} style={{ background: 'white', border: '1px solid #e0eaed', borderRadius: '16px', padding: '19px' }}>
              <div style={{ fontSize: '24px', marginBottom: '12px' }}>{emoji}</div>
              <h3 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: '900', color: '#153e67' }}>{title}</h3>
              <p style={{ fontSize: '12px', color: '#688097', margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Create Class Modal ─────────────────────────────────────── */}
      <Modal isOpen={showCreateModal} title="Create a class" onClose={() => setShowCreateModal(false)} onSave={handleCreateClass} primaryButtonText="Create">
        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Class name / section</label>
            <input type="text" placeholder="e.g. Class 4 · Section A" value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Grade</label>
              <select value={formData.grade} onChange={e => setFormData({ ...formData, grade: parseInt(e.target.value) })} style={inputStyle}>
                {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Subject</label>
              <select value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} style={inputStyle}>
                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Expected students</label>
            <input type="number" min="1" max="500" value={formData.max_students}
              onChange={e => setFormData({ ...formData, max_students: parseInt(e.target.value) })} style={inputStyle} />
          </div>
        </div>
      </Modal>

      {/* ── Class Detail Modal ─────────────────────────────────────── */}
      {detailClass && (
        <div style={overlayStyle} onClick={() => setDetailClass(null)}>
          <div style={detailModalStyle} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <p style={{ margin: 0, fontSize: '11px', fontWeight: '900', color: '#12a99f' }}>CLASS DETAILS</p>
                <h2 style={{ margin: '4px 0 0', fontSize: '22px', color: '#153e67', fontWeight: '900' }}>{detailClass.name}</h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#688097' }}>Grade {detailClass.grade} · {detailClass.subject}</p>
              </div>
              <button onClick={() => setDetailClass(null)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#688097', lineHeight: 1 }}>×</button>
            </div>

            {/* Code banner */}
            <div style={{ background: '#effaf7', border: '1px dashed #80cec3', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <small style={{ color: '#688097', fontSize: '10px', fontWeight: '900' }}>STUDENT JOIN CODE</small>
                <div style={{ fontSize: '26px', letterSpacing: '4px', color: '#153e67', fontWeight: '900' }}>{detailClass.code}</div>
              </div>
              <button onClick={() => handleCopyCode(detailClass.code)} style={copyBtnStyle}>Copy code</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '20px' }}>
              {/* Students */}
              <div>
                <h3 style={sectionHeadStyle}>Enrolled students ({detailStudents.length})</h3>
                {detailStudents.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#688097' }}>No students enrolled yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                    {detailStudents.map(s => (
                      <div key={s.id} style={studentRowStyle}>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '13px', color: '#153e67' }}>{s.name}</div>
                          <div style={{ fontSize: '11px', color: '#688097' }}>{s.email}</div>
                        </div>
                        <button onClick={() => handleRemoveStudent(detailClass.id, s.id)} style={removeBtnStyle} title="Remove student">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Assigned quizzes */}
              <div>
                <h3 style={sectionHeadStyle}>Assigned quizzes ({detailActivities.length})</h3>

                {/* Assign new */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <select
                    value={selectedActivity}
                    onChange={e => setSelectedActivity(e.target.value)}
                    style={{ ...inputStyle, flex: 1, fontSize: '12px', padding: '8px 10px' }}
                  >
                    <option value="">— pick a published quiz —</option>
                    {assignableTopics
                      .filter(a => !detailActivities.some(da => da.activity_id === a.id))
                      .map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                  </select>
                  <button
                    onClick={handleAssign}
                    disabled={!selectedActivity || assignLoading}
                    style={{ ...assignBtnStyle, opacity: (!selectedActivity || assignLoading) ? 0.5 : 1 }}
                  >
                    {assignLoading ? '…' : 'Assign'}
                  </button>
                </div>

                {detailActivities.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#688097' }}>No quizzes assigned yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                    {detailActivities.map(a => (
                      <div key={a.activity_id} style={activityRowStyle}>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '13px', color: '#153e67' }}>{a.topic_title}</div>
                          <div style={{ fontSize: '11px', color: '#688097' }}>{a.game_type} · {a.mode} · {a.difficulty}</div>
                          {a.due_at && <div style={{ fontSize: '10px', color: '#a77818' }}>Due {new Date(a.due_at).toLocaleDateString()}</div>}
                        </div>
                        <button onClick={() => handleUnassign(a.activity_id)} style={removeBtnStyle} title="Remove assignment">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer actions */}
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e0eaed', display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
              <button onClick={() => handleDeleteClass(detailClass.id)} style={deleteBtnStyle}>🗑 Delete class</button>
              <button onClick={() => navigate(`/analytics?class=${detailClass.id}`)} style={progressBtnStyle}>View progress ↗</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </TeacherLayout>
  );
}

// ── style constants ────────────────────────────────────────────────────────
const labelStyle = { display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '900', color: '#153e67' };
const inputStyle  = { width: '100%', border: '1px solid #d8e5e9', borderRadius: '11px', padding: '11px 12px', background: '#fff', color: '#23425e', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' };

const overlayStyle    = { position: 'fixed', inset: 0, background: 'rgba(10,30,50,0.35)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', overflowY: 'auto' };
const detailModalStyle= { background: 'white', borderRadius: '20px', padding: 'clamp(18px,4vw,28px)', width: '100%', maxWidth: '820px', maxHeight: 'calc(100dvh - 32px)', overflowY: 'auto', boxShadow: '0 16px 48px rgba(0,0,0,0.18)', flex: '0 1 auto' };

const sectionHeadStyle = { margin: '0 0 12px', fontSize: '13px', fontWeight: '900', color: '#153e67' };
const studentRowStyle  = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fbfc', borderRadius: '10px', border: '1px solid #e8f0f3' };
const activityRowStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fbfc', borderRadius: '10px', border: '1px solid #e8f0f3' };
const removeBtnStyle   = { background: '#ffe9e7', border: '1px solid #f5c1be', color: '#c85a59', borderRadius: '8px', padding: '5px 10px', cursor: 'pointer', fontWeight: '800', fontSize: '12px' };
const copyBtnStyle     = { padding: '9px 14px', borderRadius: '10px', border: '1px solid #dce7ea', background: 'white', color: '#153e67', fontWeight: '800', cursor: 'pointer', fontSize: '12px' };
const assignBtnStyle   = { padding: '8px 14px', borderRadius: '10px', border: 'none', background: 'linear-gradient(100deg,#19b7a7,#079c98)', color: 'white', fontWeight: '900', cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap' };
const deleteBtnStyle   = { background: '#fff0ef', border: '1px solid #f5c1be', color: '#c85a59', borderRadius: '10px', padding: '10px 16px', cursor: 'pointer', fontWeight: '800', fontSize: '13px' };
const progressBtnStyle = { background: '#eaf7f7', border: '1px solid #cde9e7', color: '#147d81', borderRadius: '10px', padding: '10px 16px', cursor: 'pointer', fontWeight: '800', fontSize: '13px' };
