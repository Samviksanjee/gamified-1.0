import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api.js';
import AdminPage from '../../components/SuperAdmin/AdminPage.jsx';
import { BarChart } from '../../components/SuperAdmin/charts.jsx';
import { Async, DEFAULT_RANGE, DataTable, DateRangeFilter, ErrorState, GAME_NAMES, Panel, SearchBox, Select, StatusBadge, fmtDate, fmtNum, fmtPct, rangeParams, useAdminData, useTableState } from '../../components/SuperAdmin/ui.jsx';

export function SuperAdminActivities({ user, onSignOut }) {
  const navigate = useNavigate();
  const table = useTableState({ sort: 'id', order: 'desc' });
  const f = table.filters;
  const options = useAdminData(() => adminApi.filters(), []);
  const o = options.data;
  const params = { ...table.params, teacher_id: f.teacher_id || undefined, grade: f.grade || undefined, subject: f.subject || undefined, game_type: f.game_type || undefined,
    published: f.published || undefined, created_from: f.from || undefined, created_to: f.to || undefined, page_size: 20 };
  const result = useAdminData(() => adminApi.activities(params), [JSON.stringify(params)]);
  return (
    <AdminPage user={user} onSignOut={onSignOut} title="Activities" subtitle="Every activity teachers have created, and how it is being used">
      <Panel>
        <div className="sa-filters">
          <SearchBox value={f.search} onChange={(search) => table.setFilter({ search })} placeholder="Activity or topic" />
          <Select label="Teacher" value={f.teacher_id} onChange={(v) => table.setFilter({ teacher_id: v })} options={(o?.teachers || []).map((t) => ({ value: t.id, label: t.name }))} />
          <Select label="Grade" value={f.grade} onChange={(v) => table.setFilter({ grade: v })} options={(o?.grades || []).map((g) => ({ value: g, label: `Grade ${g}` }))} />
          <Select label="Subject" value={f.subject} onChange={(v) => table.setFilter({ subject: v })} options={o?.subjects || []} />
          <Select label="Game" value={f.game_type} onChange={(v) => table.setFilter({ game_type: v })} options={Object.entries(GAME_NAMES).map(([value, label]) => ({ value, label }))} />
          <Select label="Status" value={f.published} onChange={(v) => table.setFilter({ published: v })} options={[{ value: 'published', label: 'Published' }, { value: 'draft', label: 'Not published' }]} />
          <label className="sa-field sm">Created from<input type="date" value={f.from || ''} max={f.to || undefined} onChange={(e) => table.setFilter({ from: e.target.value })} /></label>
          <label className="sa-field sm">Created to<input type="date" value={f.to || ''} min={f.from || undefined} onChange={(e) => table.setFilter({ to: e.target.value })} /></label>
        </div>
        {result.error && <ErrorState message={result.error} onRetry={result.reload} />}
        <DataTable caption="Activities" loading={result.loading} rows={result.data?.items} sort={{ key: table.sort, order: table.order }} onSort={table.toggleSort} meta={result.data} onPage={table.setPage} empty="No activities found" columns={[
          { key: 'title', label: 'Activity', sortKey: 'title', render: (a) => <><strong>{a.title}</strong><div className="sa-kpi-note">{a.topic}</div></> },
          { key: 'game_type', label: 'Game', sortKey: 'game_type', render: (a) => GAME_NAMES[a.game_type] || a.game_type },
          { key: 'teacher', label: 'Teacher', sortKey: 'teacher', render: (a) => <button type="button" className="sa-link-btn" onClick={() => navigate(`/admin/teachers/${a.teacher_id}`)}>{a.teacher}</button> },
          { key: 'grade', label: 'Grade', sortKey: 'grade' }, { key: 'subject', label: 'Subject', sortKey: 'subject' },
          { key: 'published', label: 'Status', render: (a) => <StatusBadge status={a.published ? 'published' : 'draft'} /> },
          { key: 'classrooms', label: 'Classrooms', sortKey: 'classrooms', align: 'right', render: (a) => fmtNum(a.assigned_classrooms) },
          { key: 'attempts', label: 'Attempts', sortKey: 'attempts', align: 'right', render: (a) => fmtNum(a.attempts) },
          { key: 'accuracy', label: 'Accuracy', align: 'right', render: (a) => fmtPct(a.accuracy) },
          { key: 'avg_score', label: 'Avg score', sortKey: 'avg_score', align: 'right', render: (a) => fmtPct(a.avg_score) },
          { key: 'created_at', label: 'Created', sortKey: 'created_at', render: (a) => (a.created_at ? fmtDate(a.created_at) : <span className="sa-kpi-note" title="Created before creation dates were recorded">Not recorded</span>) }]} />
      </Panel>
    </AdminPage>
  );
}

export function SuperAdminGames({ user, onSignOut }) {
  const [range, setRange] = useState(DEFAULT_RANGE);
  const p = rangeParams(range);
  const result = useAdminData(() => adminApi.games(p), [p.range, p.start, p.end]);
  return (
    <AdminPage user={user} onSignOut={onSignOut} title="Game analytics" subtitle="Quiz, matching, sequencing, crossword and puzzle compared">
      <Panel style={{ marginBottom: 16 }}><DateRangeFilter value={range} onChange={setRange} /></Panel>
      <Async result={result} rows={5}>{({ games }) => (
        <>
          <div className="sa-grid two" style={{ marginBottom: 16 }}>
            <Panel title="Attempts by game"><BarChart title="Attempts by game" data={games.map((g) => ({ label: GAME_NAMES[g.game_type], value: g.attempts }))} /></Panel>
            <Panel title="Completion rate by game" subtitle="Completed attempts ÷ attempts"><BarChart title="Completion rate by game" unit="%" max={100} data={games.map((g) => ({ label: GAME_NAMES[g.game_type], value: g.completion_rate }))} /></Panel>
            <Panel title="Average score by game"><BarChart title="Average score by game" unit="%" max={100} data={games.map((g) => ({ label: GAME_NAMES[g.game_type], value: g.avg_score }))} /></Panel>
            <Panel title="Activities created vs. published"><BarChart title="Activities created" colorFor={() => '#36a9db'} data={games.map((g) => ({ label: GAME_NAMES[g.game_type], value: g.activities_created }))} /></Panel>
          </div>
          <Panel title="Game comparison" subtitle="Accuracy is only available for games that record individual answers (quiz, sequencing, matching).">
            <DataTable caption="Game analytics" rowKey="game_type" rows={games} columns={[
              { key: 'game_type', label: 'Game', render: (g) => GAME_NAMES[g.game_type] }, { key: 'activities_created', label: 'Created', align: 'right', render: (g) => fmtNum(g.activities_created) },
              { key: 'activities_published', label: 'Published', align: 'right', render: (g) => fmtNum(g.activities_published) }, { key: 'attempts', label: 'Attempts', align: 'right', render: (g) => fmtNum(g.attempts) },
              { key: 'players', label: 'Players', align: 'right', render: (g) => fmtNum(g.players) }, { key: 'completion_rate', label: 'Completion', align: 'right', render: (g) => fmtPct(g.completion_rate) },
              { key: 'avg_score', label: 'Avg score', align: 'right', render: (g) => fmtPct(g.avg_score) }, { key: 'accuracy', label: 'Accuracy', align: 'right', render: (g) => fmtPct(g.accuracy) }]} />
          </Panel>
        </>
      )}</Async>
    </AdminPage>
  );
}
