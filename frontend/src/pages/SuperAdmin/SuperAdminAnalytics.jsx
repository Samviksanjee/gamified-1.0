import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api.js';
import AdminPage from '../../components/SuperAdmin/AdminPage.jsx';
import { BarChart, DonutChart, LineChart } from '../../components/SuperAdmin/charts.jsx';
import { Async, DEFAULT_RANGE, DataTable, DateRangeFilter, GAME_NAMES, KpiCard, Panel, fmtDate, fmtNum, fmtPct, rangeParams, useAdminData, useTableState } from '../../components/SuperAdmin/ui.jsx';

const TITLES = {
  overall: ['Overall performance', 'Teachers, students, games and engagement across the platform'],
  teachers: ['Teacher performance', 'How each teacher’s students are doing on that teacher’s activities'],
  students: ['Student performance', 'Student results across the platform'],
};

function Overall({ range }) {
  const p = rangeParams(range);
  const result = useAdminData(() => adminApi.platform(p), [p.range, p.start, p.end]);
  return (
    <Async result={result} rows={6}>{(d) => (
      <>
        <section className="sa-grid kpis" style={{ marginBottom: 16 }} aria-label="Platform totals">
          <KpiCard label="Total attempts" value={fmtNum(d.overall.attempts)} note={`${fmtNum(d.overall.completed_attempts)} completed`} />
          <KpiCard label="Overall accuracy" value={fmtPct(d.overall.accuracy)} note="Quiz, sequencing and matching answers" />
          <KpiCard label="Average score" value={fmtPct(d.overall.avg_score)} />
          <KpiCard label="Student participation" value={fmtPct(d.overall.participation_rate)} note={`${fmtNum(d.overall.participants)} of ${fmtNum(d.overall.students_total)} students`} />
          <KpiCard label="Weekly active students" value={fmtNum(d.engagement.weekly_active)} note="Played in the last 7 days" />
          <KpiCard label="Monthly active students" value={fmtNum(d.engagement.monthly_active)} note="Played in the last 30 days" />
        </section>
        <div className="sa-grid two" style={{ marginBottom: 16 }}>
          <Panel title="Teacher registrations"><LineChart title="Teacher registrations" xLabel={fmtDate} series={[{ key: 'v', label: 'New teachers' }]} rows={d.teachers.registrations.map((r) => ({ x: r.bucket, v: r.value }))} /></Panel>
          <Panel title="Active vs. suspended teachers"><DonutChart title="Teachers" centerLabel="teachers" data={[{ label: 'Active', value: d.teachers.counts.active, color: '#22c55e' }, { label: 'Pending', value: d.teachers.counts.pending, color: '#f59e0b' }, { label: 'Suspended', value: d.teachers.counts.suspended, color: '#ef4444' }]} /></Panel>
          <Panel title="Students per teacher" subtitle="Unique students"><BarChart title="Students per teacher" data={d.teachers.per_teacher.filter((t) => t.students).slice(0, 15).map((t) => ({ label: t.teacher, value: t.students }))} /></Panel>
          <Panel title="Classrooms per teacher"><BarChart title="Classrooms per teacher" colorFor={() => '#36a9db'} data={d.teachers.per_teacher.filter((t) => t.classrooms).slice(0, 15).map((t) => ({ label: t.teacher, value: t.classrooms }))} /></Panel>
          <Panel title="Activities created per teacher"><BarChart title="Activities per teacher" colorFor={() => '#8b5cf6'} data={d.teachers.per_teacher.filter((t) => t.activities_created).slice(0, 15).map((t) => ({ label: t.teacher, value: t.activities_created }))} /></Panel>
          <Panel title="Student registrations"><LineChart title="Student registrations" xLabel={fmtDate} series={[{ key: 'v', label: 'New students', color: '#36a9db' }]} rows={d.students.registrations.map((r) => ({ x: r.bucket, v: r.value }))} /></Panel>
          <Panel title="Students by grade"><BarChart title="Students by grade" colorFor={() => '#12a99f'} data={d.students.by_grade.map((g) => ({ label: `Grade ${g.grade}`, value: g.students }))} /></Panel>
          <Panel title="Participating vs. not participating" subtitle="Students with at least one attempt in the period"><DonutChart title="Participation" centerLabel="students" data={[{ label: 'Played', value: d.students.participating, color: '#12a99f' }, { label: 'Did not play', value: d.students.not_participating, color: '#cbd5e1' }]} /></Panel>
        </div>
        <div className="sa-grid two">
          <Panel title="Daily active students" subtitle="Distinct students who played each day"><LineChart title="Daily active students" xLabel={fmtDate} series={[{ key: 'v', label: 'Active students' }]} rows={d.engagement.daily_active_students.map((r) => ({ x: r.bucket, v: r.value }))} /></Panel>
          <Panel title="Attempts and completions"><LineChart title="Attempts and completions" xLabel={fmtDate} series={[{ key: 'a', label: 'Started' }, { key: 'c', label: 'Completed', color: '#22c55e' }]}
            rows={d.engagement.attempts.map((r, i) => ({ x: r.bucket, a: r.value, c: d.engagement.completed[i]?.value ?? 0 }))} /></Panel>
        </div>
      </>
    )}</Async>
  );
}

function TeacherPerformance({ range }) {
  const navigate = useNavigate();
  const p = rangeParams(range);
  const result = useAdminData(() => adminApi.teacherPerformance(p), [p.range, p.start, p.end]);
  return (
    <Async result={result} rows={5}>{({ teachers }) => (
      <>
        <Panel title="Accuracy by teacher" subtitle="Teachers with no attempts in the period are left out of the chart" style={{ marginBottom: 16 }}>
          <BarChart title="Accuracy by teacher" unit="%" max={100} data={teachers.filter((t) => t.accuracy != null).slice(0, 20).map((t) => ({ label: t.teacher, value: t.accuracy }))} />
        </Panel>
        <Panel title="All teachers"><DataTable caption="Teacher performance" rowKey="teacher_id" rows={teachers} columns={[
          { key: 'teacher', label: 'Teacher', render: (t) => <button type="button" className="sa-link-btn" onClick={() => navigate(`/admin/teachers/${t.teacher_id}`)}>{t.teacher}</button> },
          { key: 'attempts', label: 'Attempts', align: 'right', render: (t) => fmtNum(t.attempts) }, { key: 'participating_students', label: 'Students played', align: 'right', render: (t) => fmtNum(t.participating_students) },
          { key: 'completed_attempts', label: 'Completed', align: 'right', render: (t) => fmtNum(t.completed_attempts) }, { key: 'avg_score', label: 'Avg score', align: 'right', render: (t) => fmtPct(t.avg_score) },
          { key: 'accuracy', label: 'Accuracy', align: 'right', render: (t) => fmtPct(t.accuracy) }]} /></Panel>
      </>
    )}</Async>
  );
}

function StudentPerformance({ range }) {
  const navigate = useNavigate();
  const table = useTableState({ sort: 'avg_score', order: 'desc' });
  const params = { ...table.params, page_size: 25 };
  const result = useAdminData(() => adminApi.students(params), [JSON.stringify(params)]);
  void range;
  return (
    <Panel title="Students" subtitle="Sorted by average score of completed attempts. Sort any column to find students who need support.">
      <DataTable caption="Student performance" columns={[
        { key: 'name', label: 'Student', sortKey: 'name', render: (s) => <button type="button" className="sa-link-btn" onClick={() => navigate(`/admin/students/${s.id}`)}>{s.name}</button> },
        { key: 'teachers', label: 'Teacher', render: (s) => s.teachers.join(', ') || '—' },
        { key: 'completed', label: 'Completed', sortKey: 'completed', align: 'right', render: (s) => fmtNum(s.completed_activities) },
        { key: 'accuracy', label: 'Accuracy', align: 'right', render: (s) => fmtPct(s.accuracy) },
        { key: 'avg_score', label: 'Avg score', sortKey: 'avg_score', align: 'right', render: (s) => fmtPct(s.avg_score) },
        { key: 'last_activity', label: 'Last activity', sortKey: 'last_activity', render: (s) => (s.last_activity ? fmtDate(s.last_activity) : 'Never') }]}
        rows={result.data?.items} loading={result.loading} sort={{ key: table.sort, order: table.order }} onSort={table.toggleSort} meta={result.data} onPage={table.setPage} empty="No students yet" />
    </Panel>
  );
}

export default function SuperAdminAnalytics({ user, onSignOut, view = 'overall' }) {
  const [range, setRange] = useState(DEFAULT_RANGE);
  const [title, subtitle] = TITLES[view];
  return (
    <AdminPage user={user} onSignOut={onSignOut} title={title} subtitle={subtitle}>
      {view !== 'students' && <Panel style={{ marginBottom: 16 }}><DateRangeFilter value={range} onChange={setRange} /></Panel>}
      {view === 'overall' && <Overall range={range} />}
      {view === 'teachers' && <TeacherPerformance range={range} />}
      {view === 'students' && <StudentPerformance range={range} />}
      {view === 'overall' && <p className="sa-kpi-note" style={{ marginTop: 12 }}>Games: {Object.values(GAME_NAMES).join(', ')}. See Activity Management → Game Analytics for the per-game comparison.</p>}
    </AdminPage>
  );
}
