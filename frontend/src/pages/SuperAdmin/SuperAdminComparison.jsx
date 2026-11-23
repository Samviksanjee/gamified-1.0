import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { adminApi } from '../../api.js';
import AdminPage from '../../components/SuperAdmin/AdminPage.jsx';
import { BarChart, HorizontalBars, LineChart, PALETTE } from '../../components/SuperAdmin/charts.jsx';
import { Async, DEFAULT_RANGE, DataTable, DateRangeFilter, ErrorState, GAME_NAMES, Panel, Select, fmtDate, fmtDuration, fmtNum, fmtPct, rangeParams, useAdminData } from '../../components/SuperAdmin/ui.jsx';

const METRIC_LABEL = { accuracy: 'accuracy', avg_score: 'average score', completion_rate: 'completion', participation_rate: 'participation' };

export default function SuperAdminComparison({ user, onSignOut }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [range, setRange] = useState(DEFAULT_RANGE);
  const [filters, setFilters] = useState({ grade: '', subject: '', teacher_id: '', game_type: '' });
  const [selected, setSelected] = useState(() => (searchParams.get('classrooms') || '').split(',').filter(Boolean).map(Number));
  const [sort, setSort] = useState({ key: 'accuracy', order: 'desc' });
  const options = useAdminData(() => adminApi.filters(), []);
  const o = options.data;
  const r = rangeParams(range);

  const pool = useMemo(() => (o?.classrooms || []).filter((c) => (!filters.grade || String(c.grade) === String(filters.grade))
    && (!filters.subject || c.subject?.toLowerCase() === filters.subject.toLowerCase()) && (!filters.teacher_id || String(c.teacher_id) === String(filters.teacher_id))), [o, filters]);
  const query = { ...r, game_type: filters.game_type || undefined, grade: filters.grade || undefined, subject: filters.subject || undefined,
    teacher_id: selected.length ? undefined : filters.teacher_id || undefined, classroom_ids: selected.length ? selected : undefined };
  const result = useAdminData(() => adminApi.compare(query), [JSON.stringify(query)]);
  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const setFilter = (patch) => { setFilters((f) => ({ ...f, ...patch })); setSelected((s) => s.filter((id) => pool.some((c) => c.id === id))); };

  return (
    <AdminPage user={user} onSignOut={onSignOut} title="Classroom comparison" subtitle="Compare the learning performance of classrooms side by side">
      <Panel title="Choose classrooms" subtitle="Tick the classrooms to compare, or leave all unticked to compare every classroom that matches the filters." style={{ marginBottom: 16 }}>
        <div className="sa-filters">
          <Select label="Grade" value={filters.grade} onChange={(v) => setFilter({ grade: v })} options={(o?.grades || []).map((g) => ({ value: g, label: `Grade ${g}` }))} />
          <Select label="Subject" value={filters.subject} onChange={(v) => setFilter({ subject: v })} options={o?.subjects || []} />
          <Select label="Teacher" value={filters.teacher_id} onChange={(v) => setFilter({ teacher_id: v })} options={(o?.teachers || []).map((t) => ({ value: t.id, label: t.name }))} />
          <Select label="Game type" value={filters.game_type} onChange={(v) => setFilter({ game_type: v })} options={Object.entries(GAME_NAMES).map(([value, label]) => ({ value, label }))} placeholder="All games" />
        </div>
        <fieldset style={{ border: 0, padding: 0, margin: '0 0 12px' }}>
          <legend className="sa-kpi-note" style={{ marginBottom: 6 }}>{pool.length} classroom{pool.length === 1 ? '' : 's'} match · {selected.length ? `${selected.length} selected` : 'none selected (comparing all that match)'}</legend>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 150, overflow: 'auto' }}>
            {pool.map((c) => (
              <label key={c.id} className="sa-chip" style={{ display: 'inline-flex', gap: 6, alignItems: 'center', background: selected.includes(c.id) ? '#e7f8f3' : '#fff', borderColor: selected.includes(c.id) ? '#12a99f' : undefined }}>
                <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggle(c.id)} />{c.name} <small style={{ color: '#688097' }}>G{c.grade} · {c.subject}</small>
              </label>))}
            {!pool.length && <span className="sa-kpi-note">No classrooms match these filters.</span>}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <button type="button" className="sa-btn sa-btn-ghost sm" onClick={() => setSelected(pool.map((c) => c.id))} disabled={!pool.length}>Select all shown</button>
            <button type="button" className="sa-btn sa-btn-ghost sm" onClick={() => setSelected([])} disabled={!selected.length}>Clear selection</button>
          </div>
        </fieldset>
        <DateRangeFilter value={range} onChange={setRange} />
      </Panel>

      {result.error && !result.data && <ErrorState message={result.error} onRetry={result.reload} />}
      <Async result={result} rows={6}>{(d) => {
        const rows = [...d.classrooms].sort((a, b) => {
          const av = a[sort.key], bv = b[sort.key];
          if (av == null && bv == null) return 0;
          if (av == null) return 1;
          if (bv == null) return -1;
          return typeof av === 'string' ? av.localeCompare(bv) * (sort.order === 'asc' ? 1 : -1) : (av - bv) * (sort.order === 'asc' ? 1 : -1);
        });
        if (!d.classrooms.length) return <Panel><div className="sa-state"><strong>No classrooms to compare</strong>Adjust the filters or tick at least one classroom.</div></Panel>;
        const label = (c) => `${c.classroom}${d.mixed_grades ? ` (G${c.grade})` : ''}`;
        const bar = (key) => d.classrooms.map((c, i) => ({ label: label(c), value: c[key], color: PALETTE[i % PALETTE.length] }));
        const mark = (c, key) => (d.highlights[key]?.strongest === c.classroom_id ? ' ▲ strongest' : d.highlights[key]?.weakest === c.classroom_id ? ' ▼ weakest' : '');
        const th = (key) => ({ key, sortKey: key });
        return (
          <>
            {d.notes.map((n) => <div className="sa-note" role="note" key={n}>{n}</div>)}
            <div className="sa-grid two" style={{ marginBottom: 16 }}>
              <Panel title="Accuracy" subtitle="Correct answers ÷ answers given"><BarChart title="Accuracy by classroom" unit="%" max={100} data={bar('accuracy')} /></Panel>
              <Panel title="Completion rate" subtitle="Completed ÷ assigned activities"><BarChart title="Completion rate by classroom" unit="%" max={100} data={bar('completion_rate')} /></Panel>
              <Panel title="Student participation" subtitle="Students who played at least once"><BarChart title="Participating students" data={bar('participating_students')} /></Panel>
              <Panel title="Average score" subtitle="Mean score of completed attempts"><BarChart title="Average score by classroom" unit="%" max={100} data={bar('avg_score')} /></Panel>
            </div>
            <Panel title="Learning progress over time" subtitle="Daily accuracy for each classroom" style={{ marginBottom: 16 }}>
              <LineChart title="Accuracy over time" unit="%" xLabel={fmtDate} rows={d.trend.map((t) => ({ x: t.date, ...t }))}
                series={d.classrooms.map((c, i) => ({ key: String(c.classroom_id), label: label(c), color: PALETTE[i % PALETTE.length] }))} />
            </Panel>
            <Panel title="Activity engagement" subtitle="Assigned, attempted, completed and pending, per classroom" style={{ marginBottom: 16 }}>
              <HorizontalBars title="Activity engagement" rows={d.engagement.map((e) => ({ label: e.classroom, ...e }))}
                keys={[{ key: 'assigned', label: 'Assigned', color: '#36a9db' }, { key: 'attempted', label: 'Attempts', color: '#8b5cf6' }, { key: 'completed', label: 'Completed', color: '#22c55e' }, { key: 'pending', label: 'Pending', color: '#f59e0b' }]} />
              <p className="sa-kpi-note">Assigned, completed and pending count student-activity assignments; attempts count plays.</p>
            </Panel>
            <Panel title="Comparison table" subtitle={`Highlights need at least ${d.min_sample} participating students. Sample sizes are shown beside each rate.`}>
              <DataTable caption="Classroom comparison" rowKey="classroom_id" rows={rows} sort={sort} onSort={(key) => setSort((s) => ({ key, order: s.key === key && s.order === 'desc' ? 'asc' : 'desc' }))} columns={[
                { key: 'classroom', label: 'Classroom', sortKey: 'classroom', render: (c) => <button type="button" className="sa-link-btn" onClick={() => navigate(`/admin/classrooms/${c.classroom_id}`)}>{c.classroom}</button> },
                { key: 'teacher', label: 'Teacher', sortKey: 'teacher' }, { key: 'grade', label: 'Grade', sortKey: 'grade' }, { key: 'subject', label: 'Subject' },
                { ...th('enrolled_students'), label: 'Students', align: 'right', render: (c) => fmtNum(c.enrolled_students) },
                { ...th('participating_students'), label: 'Participating', align: 'right', render: (c) => <>{fmtNum(c.participating_students)}{c.low_sample && <span className="sa-badge pending" title={`Fewer than ${d.min_sample} participating students: read with care`} style={{ marginLeft: 6 }}>small sample</span>}</> },
                { ...th('activities_assigned'), label: 'Assigned', align: 'right', render: (c) => fmtNum(c.activities_assigned) },
                { ...th('assignments_completed'), label: 'Completed', align: 'right', render: (c) => `${fmtNum(c.assignments_completed)} / ${fmtNum(c.assignments_total)}` },
                { ...th('attempts'), label: 'Attempts', align: 'right', render: (c) => fmtNum(c.attempts) },
                { ...th('avg_score'), label: 'Avg score', align: 'right', render: (c) => <>{fmtPct(c.avg_score)}<small>{mark(c, 'avg_score')}</small></> },
                { ...th('accuracy'), label: 'Accuracy', align: 'right', render: (c) => <>{fmtPct(c.accuracy)}<small>{mark(c, 'accuracy')}</small><div className="sa-kpi-note">n = {fmtNum(c.answered_questions)} answers</div></> },
                { ...th('completion_rate'), label: 'Completion', align: 'right', render: (c) => <>{fmtPct(c.completion_rate)}<small>{mark(c, 'completion_rate')}</small></> },
                { ...th('participation_rate'), label: 'Participation', align: 'right', render: (c) => <>{fmtPct(c.participation_rate)}<small>{mark(c, 'participation_rate')}</small></> },
                { ...th('avg_attempts_per_student'), label: 'Attempts / student', align: 'right', render: (c) => c.avg_attempts_per_student ?? '—' },
                { ...th('avg_seconds_per_activity'), label: 'Avg time', align: 'right', render: (c) => fmtDuration(c.avg_seconds_per_activity) }]} />
              {Object.keys(d.highlights).length > 0 && <p className="sa-kpi-note" style={{ marginTop: 8 }}>▲ / ▼ mark the highest and lowest value for {Object.keys(d.highlights).map((k) => METRIC_LABEL[k]).join(', ')} among classrooms with enough students. They describe these classrooms in this period, not a ranking of teachers.</p>}
            </Panel>
          </>
        );
      }}</Async>
    </AdminPage>
  );
}
