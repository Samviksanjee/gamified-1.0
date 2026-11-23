import { useState } from 'react';
import { adminApi } from '../../api.js';
import AdminPage from '../../components/SuperAdmin/AdminPage.jsx';
import { BarChart, DonutChart, LineChart } from '../../components/SuperAdmin/charts.jsx';
import { Async, DEFAULT_RANGE, DateRangeFilter, KpiCard, Panel, fmtNum, rangeParams, useAdminData } from '../../components/SuperAdmin/ui.jsx';

const shortDate = (x) => { const d = new Date(x); return Number.isNaN(d.getTime()) ? x : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }); };

export default function SuperAdminEnrollment({ user, onSignOut }) {
  const [range, setRange] = useState(DEFAULT_RANGE);
  const p = rangeParams(range);
  const dash = useAdminData(() => adminApi.dashboard(p), [p.range, p.start, p.end]);
  const platform = useAdminData(() => adminApi.platform(p), [p.range, p.start, p.end]);
  return (
    <AdminPage user={user} onSignOut={onSignOut} title="Student enrollment" subtitle="Registered students, classroom memberships and who teaches them">
      <Panel style={{ marginBottom: 16 }}><DateRangeFilter value={range} onChange={setRange} /></Panel>
      <Async result={dash} rows={5}>{({ students }) => (
        <>
          <section className="sa-grid kpis" style={{ marginBottom: 16 }} aria-label="Enrollment totals">
            <KpiCard label="Registered students" value={fmtNum(students.total)} note="Unique accounts" />
            <KpiCard label="Active students" value={fmtNum(students.active)} />
            <KpiCard label="In at least one classroom" value={fmtNum(students.enrolled)} />
            <KpiCard label="Without a classroom" value={fmtNum(students.not_enrolled)} />
            <KpiCard label="Classroom memberships" value={fmtNum(students.memberships)} note="One student can have several" info="Counts student-classroom links, so it can exceed the number of students." />
            <KpiCard label="New in period" value={fmtNum(students.registered_in_range)} />
          </section>
          <div className="sa-grid two" style={{ marginBottom: 16 }}>
            <Panel title="Enrolled vs. not enrolled"><DonutChart title="Enrollment" centerLabel="students" data={[{ label: 'In a classroom', value: students.enrolled, color: '#12a99f' }, { label: 'No classroom', value: students.not_enrolled, color: '#f59e0b' }]} /></Panel>
            <Panel title="Student registrations over time"><LineChart title="Student registrations" series={[{ key: 'value', label: 'New students', color: '#36a9db' }]} rows={students.registrations.map((r) => ({ x: r.bucket, value: r.value }))} xLabel={shortDate} /></Panel>
            <Panel title="Unique students per teacher" subtitle="Top 15"><BarChart title="Students per teacher" data={students.by_teacher.map((t) => ({ label: t.teacher, value: t.students }))} /></Panel>
            <Panel title="Students by grade"><BarChart title="Students by grade" colorFor={() => '#36a9db'} data={students.by_grade.map((g) => ({ label: `Grade ${g.grade}`, value: g.students }))} /></Panel>
          </div>
        </>
      )}</Async>
      <Async result={platform} rows={3}>{({ students }) => (
        <Panel title="Largest classrooms" subtitle="Unique students per classroom (top 20)"><BarChart title="Students per classroom" data={students.per_classroom.map((c) => ({ label: c.classroom, value: c.students }))} /></Panel>
      )}</Async>
    </AdminPage>
  );
}
