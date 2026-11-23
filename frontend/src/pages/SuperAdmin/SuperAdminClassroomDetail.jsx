import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminApi } from '../../api.js';
import AdminPage from '../../components/SuperAdmin/AdminPage.jsx';
import { BarChart, LineChart } from '../../components/SuperAdmin/charts.jsx';
import { Async, DEFAULT_RANGE, DataTable, DateRangeFilter, GAME_NAMES, KpiCard, Panel, StatusBadge, fmtDate, fmtNum, fmtPct, rangeParams, useAdminData } from '../../components/SuperAdmin/ui.jsx';

export default function SuperAdminClassroomDetail({ user, onSignOut }) {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const [range, setRange] = useState({ ...DEFAULT_RANGE, range: 'all' });
  const p = rangeParams(range);
  const result = useAdminData(() => adminApi.classroom(classroomId, p), [classroomId, p.range, p.start, p.end]);
  const c = result.data;
  return (
    <AdminPage user={user} onSignOut={onSignOut} title={c ? c.classroom.name : 'Classroom'} subtitle={c ? `Grade ${c.classroom.grade} · ${c.classroom.subject}` : ''}
      actions={<span style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap' }}>
        {c && <button type="button" className="sa-btn sa-btn-primary" onClick={() => navigate(`/admin/analytics/compare?classrooms=${c.classroom.id}`)}>Compare with others</button>}
        <button type="button" className="sa-btn sa-btn-ghost" onClick={() => navigate('/admin/classrooms')}>← All classrooms</button></span>}>
      <Async result={result} rows={6}>{(d) => {
        const m = d.metrics;
        return (
          <>
            <div className="sa-grid two" style={{ marginBottom: 16 }}>
              <Panel title="Classroom information"><dl className="sa-dl"><dt>Name</dt><dd>{d.classroom.name}</dd><dt>Grade</dt><dd>{d.classroom.grade}</dd><dt>Subject</dt><dd>{d.classroom.subject}</dd>
                <dt>Section</dt><dd>{d.classroom.section || '—'}</dd><dt>Join code</dt><dd>{d.classroom.code}</dd><dt>Capacity</dt><dd>{d.classroom.max_students} students</dd>
                <dt>Status</dt><dd><StatusBadge status={d.classroom.status} /></dd><dt>Created</dt><dd>{fmtDate(d.classroom.created_at)}</dd></dl></Panel>
              <Panel title="Teacher information">{d.teacher ? <dl className="sa-dl"><dt>Name</dt><dd><button type="button" className="sa-link-btn" onClick={() => navigate(`/admin/teachers/${d.teacher.id}`)}>{d.teacher.name}</button></dd><dt>Email</dt><dd>{d.teacher.email}</dd></dl> : <p className="sa-kpi-note">No teacher record.</p>}</Panel>
            </div>
            <Panel style={{ marginBottom: 16 }}><DateRangeFilter value={range} onChange={setRange} /></Panel>
            <section className="sa-grid kpis" style={{ marginBottom: 16 }} aria-label="Classroom statistics">
              <KpiCard label="Enrolled students" value={fmtNum(m.enrolled_students)} note={`${fmtNum(m.active_students)} with active accounts`} />
              <KpiCard label="Assigned activities" value={fmtNum(m.activities_assigned)} />
              <KpiCard label="Completed activities" value={fmtNum(m.assignments_completed)} note={`of ${fmtNum(m.assignments_total)} student assignments`} info="One assignment = one student x one activity." />
              <KpiCard label="Pending activities" value={fmtNum(m.assignments_pending)} />
              <KpiCard label="Average accuracy" value={fmtPct(m.accuracy)} note={`${fmtNum(m.correct_answers)} correct of ${fmtNum(m.answered_questions)} answers`} />
              <KpiCard label="Average score" value={fmtPct(m.avg_score)} />
              <KpiCard label="Participation" value={fmtPct(m.participation_rate)} note={`${fmtNum(m.participating_students)} of ${fmtNum(m.enrolled_students)} students`} />
              <KpiCard label="Completion rate" value={fmtPct(m.completion_rate)} />
            </section>
            <div className="sa-grid two" style={{ marginBottom: 16 }}>
              <Panel title="Performance trend" subtitle="Daily accuracy"><LineChart title="Accuracy by day" unit="%" series={[{ key: 'accuracy', label: 'Accuracy' }]} rows={d.trend.map((t) => ({ x: t.date, accuracy: t.accuracy }))} xLabel={fmtDate} /></Panel>
              <Panel title="Participation trend" subtitle="Attempts per day"><LineChart title="Attempts by day" series={[{ key: 'attempts', label: 'Attempts', color: '#8b5cf6' }]} rows={d.trend.map((t) => ({ x: t.date, attempts: t.attempts }))} xLabel={fmtDate} /></Panel>
              <Panel title="Game-type performance"><BarChart title="Accuracy by game" unit="%" max={100} data={d.game_performance.map((g) => ({ label: GAME_NAMES[g.game_type] || g.game_type, value: g.accuracy ?? g.avg_score }))} />
                <p className="sa-kpi-note">Quiz, sequencing and matching show accuracy; crossword and puzzle show average score.</p></Panel>
              <Panel title="Students"><DataTable caption="Students in this classroom" rows={d.students} empty="No students have joined" columns={[
                { key: 'name', label: 'Student', render: (r) => <button type="button" className="sa-link-btn" onClick={() => navigate(`/admin/students/${r.id}`)}>{r.name}</button> },
                { key: 'attempts', label: 'Attempts', align: 'right' }, { key: 'accuracy', label: 'Accuracy', align: 'right', render: (r) => fmtPct(r.accuracy) },
                { key: 'avg_score', label: 'Avg score', align: 'right', render: (r) => fmtPct(r.avg_score) }, { key: 'last_activity', label: 'Last activity', render: (r) => (r.last_activity ? fmtDate(r.last_activity) : 'Never') }]} /></Panel>
            </div>
            <Panel title="Assigned activities (activity-wise performance)">
              <DataTable caption="Activities assigned to this classroom" rows={d.activities} empty="No activities assigned" columns={[
                { key: 'title', label: 'Activity' }, { key: 'game_type', label: 'Game', render: (r) => GAME_NAMES[r.game_type] || r.game_type },
                { key: 'assigned_at', label: 'Assigned', render: (r) => fmtDate(r.assigned_at) }, { key: 'participants', label: 'Students played', align: 'right' },
                { key: 'attempts', label: 'Attempts', align: 'right' }, { key: 'accuracy', label: 'Accuracy', align: 'right', render: (r) => fmtPct(r.accuracy) },
                { key: 'avg_score', label: 'Avg score', align: 'right', render: (r) => fmtPct(r.avg_score) }]} />
            </Panel>
          </>
        );
      }}</Async>
    </AdminPage>
  );
}
