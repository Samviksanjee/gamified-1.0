import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminApi } from '../../api.js';
import AdminPage from '../../components/SuperAdmin/AdminPage.jsx';
import { LineChart } from '../../components/SuperAdmin/charts.jsx';
import { Async, DEFAULT_RANGE, DataTable, DateRangeFilter, GAME_NAMES, KpiCard, Panel, StatusBadge, fmtDate, fmtDateTime, fmtDuration, fmtNum, fmtPct, rangeParams, useAdminData } from '../../components/SuperAdmin/ui.jsx';

export default function SuperAdminStudentDetail({ user, onSignOut }) {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [range, setRange] = useState({ ...DEFAULT_RANGE, range: 'all' });
  const params = rangeParams(range);
  const result = useAdminData(() => adminApi.student(studentId, params), [studentId, params.range, params.start, params.end]);
  const s = result.data;
  return (
    <AdminPage user={user} onSignOut={onSignOut} title={s ? s.profile.name : 'Student'} subtitle={s ? s.profile.email : 'Student profile'}
      actions={<button type="button" className="sa-btn sa-btn-ghost" onClick={() => navigate('/admin/students')}>← All students</button>}>
      <Async result={result} rows={6}>{(d) => (
        <>
          <div className="sa-grid two" style={{ marginBottom: 16 }}>
            <Panel title="Student profile"><dl className="sa-dl"><dt>Name</dt><dd>{d.profile.name}</dd><dt>Email</dt><dd>{d.profile.email}</dd>
              <dt>Account</dt><dd><StatusBadge status={d.profile.is_active ? 'active' : 'suspended'} /></dd><dt>Registered</dt><dd>{fmtDate(d.profile.created_at)}</dd>
              <dt>Teachers</dt><dd>{d.teachers.length ? d.teachers.join(', ') : '—'}</dd></dl></Panel>
            <Panel title="Classroom memberships" subtitle="This student is counted once on the platform, whatever the number of classrooms">
              <DataTable caption="Memberships" rowKey="classroom_id" rows={d.memberships} empty="Not enrolled in any classroom" columns={[
                { key: 'classroom', label: 'Classroom', render: (r) => <button type="button" className="sa-link-btn" onClick={() => navigate(`/admin/classrooms/${r.classroom_id}`)}>{r.classroom}</button> },
                { key: 'grade', label: 'Grade' }, { key: 'teacher', label: 'Teacher' }, { key: 'joined_at', label: 'Joined', render: (r) => fmtDate(r.joined_at) }]} />
            </Panel>
          </div>
          <Panel style={{ marginBottom: 16 }}><DateRangeFilter value={range} onChange={setRange} /></Panel>
          <section className="sa-grid kpis" style={{ marginBottom: 16 }} aria-label="Student statistics">
            <KpiCard label="Activities assigned" value={fmtNum(d.summary.activities_assigned)} />
            <KpiCard label="Activities completed" value={fmtNum(d.summary.activities_completed)} note={`Completion ${fmtPct(d.summary.completion_rate)}`} />
            <KpiCard label="Total attempts" value={fmtNum(d.summary.attempts)} note={`${fmtNum(d.summary.completed_attempts)} completed`} />
            <KpiCard label="Average accuracy" value={fmtPct(d.summary.accuracy)} />
            <KpiCard label="Average score" value={fmtPct(d.summary.avg_score)} />
            <KpiCard label="Avg time per activity" value={fmtDuration(d.summary.avg_seconds_per_activity)} />
          </section>
          <div className="sa-grid two">
            <Panel title="Performance history" subtitle="Average score of completed attempts, by day"><LineChart title="Student performance history" series={[{ key: 'score', label: 'Average score' }]} rows={d.performance_history.map((p) => ({ x: p.date, score: p.avg_score }))} xLabel={(x) => fmtDate(x)} unit="%" /></Panel>
            <Panel title="Recent activity">
              <DataTable caption="Recent attempts" rowKey="attempt_id" rows={d.recent_activity} empty="No attempts yet" columns={[
                { key: 'at', label: 'When', render: (r) => fmtDateTime(r.at) }, { key: 'activity', label: 'Activity', render: (r) => `${r.activity} · ${GAME_NAMES[r.game_type] || r.game_type}` },
                { key: 'score', label: 'Score', align: 'right', render: (r) => (r.completed ? fmtPct(r.score) : 'In progress') }]} />
            </Panel>
          </div>
        </>
      )}</Async>
    </AdminPage>
  );
}
