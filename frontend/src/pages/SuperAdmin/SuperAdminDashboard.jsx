import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api.js';
import AdminPage from '../../components/SuperAdmin/AdminPage.jsx';
import { BarChart, DonutChart, LineChart } from '../../components/SuperAdmin/charts.jsx';
import { Async, DEFAULT_RANGE, DateRangeFilter, KpiCard, Panel, fmtDuration, fmtNum, fmtPct, rangeParams, useAdminData } from '../../components/SuperAdmin/ui.jsx';
import { ActivitiesIcon, AttemptsIcon, BanIcon, ClassroomIcon, ClockIcon, MailPlusIcon, PercentIcon, RefreshIcon, StudentsIcon, TeachersIcon, UsersIcon } from '../../components/SuperAdmin/icons.jsx';

const shortDate = (x) => { const d = new Date(x); return Number.isNaN(d.getTime()) ? x : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }); };

export default function SuperAdminDashboard({ user, onSignOut }) {
  const navigate = useNavigate();
  const [range, setRange] = useState(DEFAULT_RANGE);
  const params = rangeParams(range);
  const result = useAdminData(() => adminApi.dashboard(params), [params.range, params.start, params.end]);
  const { data, loading } = result;
  const k = data?.kpis;
  const trendNote = (kpi, fallback) => (kpi?.new_in_range != null ? `${kpi.new_in_range} new in this period` : fallback);

  return (
    <AdminPage user={user} onSignOut={onSignOut} title="Dashboard" subtitle="Platform overview. Every figure comes from the live database."
      actions={<button type="button" className="sa-btn sa-btn-primary" onClick={result.reload} disabled={loading} aria-busy={loading}><RefreshIcon size={18} className={loading ? 'sa-spin' : undefined} />{loading ? 'Refreshing…' : 'Refresh'}</button>}>
      <Panel style={{ marginBottom: 16 }}>
        <DateRangeFilter value={range} onChange={setRange} />
        <p className="sa-sub" style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--sa-muted)' }}>
          Attempts, accuracy and score use the selected period. Teacher, student and classroom totals are current. Trend arrows compare with the previous period of the same length.
        </p>
      </Panel>

      <Async result={result} rows={6}>{() => (
        <>
          <section className="sa-grid kpis" aria-label="Key metrics" style={{ marginBottom: 16 }}>
            <KpiCard icon={TeachersIcon} label="Total Teachers" value={fmtNum(k.total_teachers.value)} trend={k.total_teachers.trend} note={trendNote(k.total_teachers, 'Active + pending + suspended')} info="Teacher accounts plus invitations that have not become accounts yet." />
            <KpiCard icon={TeachersIcon} label="Active Teachers" value={fmtNum(k.active_teachers.value)} note="Activated and not suspended" />
            <KpiCard icon={ClockIcon} label="Pending Teachers" value={fmtNum(k.pending_teachers.value)} note={`${k.pending_teachers.accounts} awaiting first login · ${k.pending_teachers.invitations} invitations not accepted`} info="Invited, but has not yet activated the account. A suspended teacher is never counted as pending." />
            <KpiCard icon={BanIcon} label="Suspended Teachers" value={fmtNum(k.suspended_teachers.value)} note="Access switched off by an admin" />
            <KpiCard icon={StudentsIcon} label="Total Students" value={fmtNum(k.total_students.value)} trend={k.total_students.trend} note={trendNote(k.total_students, 'Unique student accounts')} info="Each student account counts once, even if the student is in several classrooms." />
            <KpiCard icon={UsersIcon} label="Active Students" value={fmtNum(k.active_students.value)} note="Accounts that are not suspended" />
            <KpiCard icon={ClassroomIcon} label="Total Classrooms" value={fmtNum(k.total_classrooms.value)} note="Created by all teachers" />
            <KpiCard icon={ActivitiesIcon} label="Published Activities" value={fmtNum(k.published_activities.value)} note={`${k.published_activities.of} activities created in total`} />
            <KpiCard icon={AttemptsIcon} label="Total Game Attempts" value={fmtNum(k.total_attempts.value)} trend={k.total_attempts.trend} note="Attempts started in the period" />
            <KpiCard icon={PercentIcon} label="Overall Student Accuracy" value={fmtPct(k.overall_accuracy.value)} trend={k.overall_accuracy.trend} note="Correct answers ÷ answers given (quiz, sequencing, matching)" info="Crossword and puzzle attempts do not record individual answers, so they are included in score but not in accuracy." />
          </section>

          <div className="sa-grid two" style={{ marginBottom: 16 }}>
            <Panel title="Teacher registration overview" subtitle="Teachers by account state, and registrations over time">
              <div className="sa-grid" style={{ gap: 18 }}>
                <DonutChart title="Teachers by status" centerLabel="teachers" data={[
                  { label: 'Active', value: data.teachers.active, color: '#22c55e' }, { label: 'Pending', value: data.teachers.pending, color: '#f59e0b' },
                  { label: 'Suspended', value: data.teachers.suspended, color: '#ef4444' }]} />
                <LineChart title="Teacher registrations" series={[{ key: 'value', label: 'New teachers' }]} rows={data.teachers.registrations.map((p) => ({ x: p.bucket, value: p.value }))} xLabel={shortDate} height={190} />
              </div>
            </Panel>
            <Panel title="Student enrollment overview" subtitle="Unique students vs. classroom memberships">
              <div className="sa-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', marginBottom: 12, gap: 10 }}>
                {[['Registered', data.students.total], ['Active', data.students.active], ['In a classroom', data.students.enrolled], ['Not enrolled', data.students.not_enrolled], ['Memberships', data.students.memberships]].map(([l, v]) => (
                  <div key={l} style={{ background: '#f7fafb', borderRadius: 12, padding: 10, textAlign: 'center' }}><strong style={{ fontSize: 22, color: 'var(--sa-navy)' }}>{fmtNum(v)}</strong><div className="sa-kpi-note">{l}</div></div>))}
              </div>
              <LineChart title="Student registrations" series={[{ key: 'value', label: 'New students', color: '#36a9db' }]} rows={data.students.registrations.map((p) => ({ x: p.bucket, value: p.value }))} xLabel={shortDate} height={180} />
              <p className="sa-kpi-note" style={{ marginTop: 6 }}>Memberships can be higher than students because one student can join several classrooms.</p>
            </Panel>
          </div>

          <div className="sa-grid two" style={{ marginBottom: 16 }}>
            <Panel title="Unique students by teacher" subtitle="Top 15 · a student in two of a teacher's classrooms counts once for that teacher">
              <BarChart title="Students per teacher" data={data.students.by_teacher.map((t) => ({ label: t.teacher, value: t.students }))} />
            </Panel>
            <Panel title="Students by grade" subtitle="Unique students in classrooms of each grade">
              <BarChart title="Students per grade" colorFor={() => '#36a9db'} data={data.students.by_grade.map((g) => ({ label: `Grade ${g.grade}`, value: g.students }))} />
            </Panel>
          </div>

          <Panel title="Learning performance" subtitle={`Period: ${data.range.label === 'custom' ? 'custom range' : data.range.label}`} style={{ marginBottom: 16 }}>
            <div className="sa-grid kpis" style={{ marginBottom: 14 }}>
              <KpiCard label="Overall accuracy" value={fmtPct(data.learning.accuracy)} note={`${fmtNum(data.learning.correct_answers)} correct of ${fmtNum(data.learning.answered_questions)} answers`} />
              <KpiCard label="Average score" value={fmtPct(data.learning.avg_score)} note="Mean score of completed attempts" />
              <KpiCard label="Completed activities" value={fmtNum(data.learning.assignments_completed)} note="Assigned activities finished at least once" />
              <KpiCard label="Pending activities" value={fmtNum(data.learning.assignments_pending)} note={`of ${fmtNum(data.learning.assignments_total)} assigned to students`} />
              <KpiCard label="Total attempts" value={fmtNum(data.learning.attempts)} note={`${fmtNum(data.learning.completed_attempts)} completed`} />
              <KpiCard label="Participation rate" value={fmtPct(data.learning.participation_rate)} note={`${fmtNum(data.learning.participants)} students played in the period`} info="Students with at least one attempt ÷ all student accounts." />
              <KpiCard label="Completion rate" value={fmtPct(data.learning.completion_rate)} note="Completed ÷ assigned activities" />
              <KpiCard label="Avg time per activity" value={fmtDuration(data.learning.avg_seconds_per_activity)} note="From recorded question times" />
            </div>
            <LineChart title="Attempts over time" series={[{ key: 'value', label: 'Attempts', color: '#8b5cf6' }]} rows={data.learning.attempts_series.map((p) => ({ x: p.bucket, value: p.value }))} xLabel={shortDate} />
          </Panel>

          <Panel title="Quick actions">
            <div className="sa-actions" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
              <button type="button" className="sa-action" onClick={() => navigate('/admin/invitations')}><span className="sa-action-icon"><MailPlusIcon size={20} /></span><span>Invite Teacher<small>Create a teacher account</small></span></button>
              <button type="button" className="sa-action" onClick={() => navigate('/admin/analytics/compare')}><span className="sa-action-icon"><ClassroomIcon size={20} /></span><span>Compare Classrooms<small>Performance side by side</small></span></button>
              <button type="button" className="sa-action" onClick={() => navigate('/admin/reports')}><span className="sa-action-icon"><ActivitiesIcon size={20} /></span><span>Reports &amp; Exports<small>CSV and Excel</small></span></button>
              <button type="button" className="sa-action" onClick={() => navigate('/admin/audit-logs')}><span className="sa-action-icon"><AttemptsIcon size={20} /></span><span>Audit Logs<small>Who did what, and when</small></span></button>
            </div>
          </Panel>
        </>
      )}</Async>
    </AdminPage>
  );
}
