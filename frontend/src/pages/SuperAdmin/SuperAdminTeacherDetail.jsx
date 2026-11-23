import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminApi } from '../../api.js';
import AdminPage from '../../components/SuperAdmin/AdminPage.jsx';
import { Async, DEFAULT_RANGE, DateRangeFilter, DataTable, GAME_NAMES, KpiCard, Panel, StatusBadge, fmtDate, fmtDateTime, fmtNum, fmtPct, rangeParams, useAdminData } from '../../components/SuperAdmin/ui.jsx';

const ACTION_TEXT = { SUSPEND_TEACHER: 'Suspended', REACTIVATE_TEACHER: 'Reactivated', TEACHER_ACTIVATED: 'Activated (first login)', ACCEPT_INVITATION: 'Invitation accepted', TEACHER_CREATED: 'Account created' };

export default function SuperAdminTeacherDetail({ user, onSignOut }) {
  const { teacherId } = useParams();
  const navigate = useNavigate();
  const [range, setRange] = useState({ ...DEFAULT_RANGE, range: 'all' });
  const params = rangeParams(range);
  const result = useAdminData(() => adminApi.teacher(teacherId, params), [teacherId, params.range, params.start, params.end]);
  const t = result.data;

  return (
    <AdminPage user={user} onSignOut={onSignOut} title={t ? t.personal.name : 'Teacher'} subtitle={t ? t.personal.email : 'Teacher profile'}
      actions={<button type="button" className="sa-btn sa-btn-ghost" onClick={() => navigate('/admin/teachers')}>← All teachers</button>}>
      <Async result={result} rows={6}>{(d) => (
        <>
          <div className="sa-grid two" style={{ marginBottom: 16 }}>
            <Panel title="Personal information"><dl className="sa-dl"><dt>Name</dt><dd>{d.personal.name}</dd><dt>Email</dt><dd>{d.personal.email}</dd></dl></Panel>
            <Panel title="Account information">
              <dl className="sa-dl">
                <dt>Status</dt><dd><StatusBadge status={d.account.status} /></dd>
                <dt>Registered</dt><dd>{fmtDateTime(d.account.created_at)}</dd>
                <dt>Last login</dt><dd>{d.account.last_login_at ? fmtDateTime(d.account.last_login_at) : 'Never'}</dd>
                <dt>Must change password</dt><dd>{d.account.must_change_password ? 'Yes, at first login' : 'No'}</dd>
              </dl>
            </Panel>
          </div>

          <Panel style={{ marginBottom: 16 }}><DateRangeFilter value={range} onChange={setRange} /></Panel>

          <section className="sa-grid kpis" aria-label="Teacher statistics" style={{ marginBottom: 16 }}>
            <KpiCard label="Classrooms" value={fmtNum(d.summary.classrooms)} />
            <KpiCard label="Unique students" value={fmtNum(d.summary.unique_students)} note={`${fmtNum(d.summary.enrollments)} classroom memberships`} info="A student in two of this teacher's classrooms counts once." />
            <KpiCard label="Activities created" value={fmtNum(d.summary.activities_created)} note={`${fmtNum(d.summary.activities_published)} published`} />
            <KpiCard label="Student attempts" value={fmtNum(d.summary.attempts)} note={`${fmtNum(d.summary.completed_attempts)} completed`} />
            <KpiCard label="Average accuracy" value={fmtPct(d.summary.accuracy)} note="Correct answers ÷ answers given" />
            <KpiCard label="Average score" value={fmtPct(d.summary.avg_score)} />
            <KpiCard label="Completion rate" value={fmtPct(d.summary.completion_rate)} note={`${fmtNum(d.summary.assignments_completed)} of ${fmtNum(d.summary.assignments_total)} assignments`} />
            <KpiCard label="Student participation" value={fmtPct(d.summary.participation_rate)} note={`${fmtNum(d.summary.participating_students)} students played`} />
          </section>

          <Panel title="Classroom-wise statistics" subtitle="Each row counts only that classroom's students and assigned activities" style={{ marginBottom: 16 }}>
            <DataTable caption="Classrooms of this teacher" rows={d.classrooms} empty="This teacher has no classrooms yet" columns={[
              { key: 'name', label: 'Classroom', render: (r) => <button type="button" className="sa-link-btn" onClick={() => navigate(`/admin/classrooms/${r.id}`)}>{r.name}</button> },
              { key: 'grade', label: 'Grade' }, { key: 'subject', label: 'Subject' },
              { key: 'enrolled_students', label: 'Students', align: 'right', render: (r) => fmtNum(r.enrolled_students) },
              { key: 'activities_assigned', label: 'Activities', align: 'right', render: (r) => fmtNum(r.activities_assigned) },
              { key: 'attempts', label: 'Attempts', align: 'right', render: (r) => fmtNum(r.attempts) },
              { key: 'participation_rate', label: 'Participation', align: 'right', render: (r) => fmtPct(r.participation_rate) },
              { key: 'completion_rate', label: 'Completion', align: 'right', render: (r) => fmtPct(r.completion_rate) },
              { key: 'accuracy', label: 'Accuracy', align: 'right', render: (r) => fmtPct(r.accuracy) }]} />
          </Panel>

          <div className="sa-grid two">
            <Panel title="Recent activity" subtitle="Latest student attempts on this teacher's activities">
              <DataTable caption="Recent attempts" rowKey="attempt_id" rows={d.recent_activity} empty="No student attempts yet" columns={[
                { key: 'at', label: 'When', render: (r) => fmtDateTime(r.at) }, { key: 'student', label: 'Student' },
                { key: 'activity', label: 'Activity', render: (r) => `${r.activity} · ${GAME_NAMES[r.game_type] || r.game_type}` },
                { key: 'score', label: 'Score', align: 'right', render: (r) => (r.completed ? fmtPct(r.score) : 'In progress') }]} />
            </Panel>
            <Panel title="Account status history" subtitle="From the audit log">
              {d.status_history.length === 0 ? <p className="sa-kpi-note">No status changes recorded.</p> : (
                <ol className="sa-timeline">{d.status_history.map((h, i) => <li key={i}><strong>{ACTION_TEXT[h.action] || h.action}</strong> by {h.by}<small>{fmtDateTime(h.at)}{h.details ? ` · ${h.details}` : ''}</small></li>)}</ol>
              )}
              {d.invitation_history.length > 0 && <><h4 style={{ margin: '14px 0 6px', fontSize: 13, color: 'var(--sa-navy)' }}>Invitation</h4>
                <ol className="sa-timeline">{d.invitation_history.map((h, i) => <li key={i}><strong>{h.action.replace(/_/g, ' ').toLowerCase()}</strong> by {h.by}<small>{fmtDate(h.at)}</small></li>)}</ol></>}
            </Panel>
          </div>
        </>
      )}</Async>
    </AdminPage>
  );
}
