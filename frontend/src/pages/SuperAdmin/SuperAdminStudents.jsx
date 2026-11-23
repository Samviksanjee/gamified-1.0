import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api.js';
import AdminPage from '../../components/SuperAdmin/AdminPage.jsx';
import { DataTable, ErrorState, Panel, SearchBox, Select, fmtDate, fmtNum, fmtPct, useAdminData, useTableState } from '../../components/SuperAdmin/ui.jsx';

export default function SuperAdminStudents({ user, onSignOut }) {
  const navigate = useNavigate();
  const table = useTableState({ sort: 'created_at', order: 'desc' });
  const f = table.filters;
  const options = useAdminData(() => adminApi.filters(), []);
  const params = { ...table.params, teacher_id: f.teacher_id || undefined, classroom_id: f.classroom_id || undefined, grade: f.grade || undefined,
    registered_from: f.from || undefined, registered_to: f.to || undefined, page_size: 20 };
  const result = useAdminData(() => adminApi.students(params), [JSON.stringify(params)]);
  const o = options.data;
  const rooms = (o?.classrooms || []).filter((c) => !f.teacher_id || String(c.teacher_id) === String(f.teacher_id));

  const columns = [
    { key: 'name', label: 'Student', sortKey: 'name', render: (r) => <><button type="button" className="sa-link-btn" onClick={() => navigate(`/admin/students/${r.id}`)}>{r.name}</button><div className="sa-kpi-note">{r.email}</div></> },
    { key: 'created_at', label: 'Registered', sortKey: 'created_at', render: (r) => fmtDate(r.created_at) },
    { key: 'teachers', label: 'Teacher', render: (r) => (r.teachers.length ? r.teachers.join(', ') : '—') },
    { key: 'classrooms', label: 'Classroom', render: (r) => (r.memberships.length ? r.memberships.map((m) => m.classroom).join(', ') : <span className="sa-kpi-note">Not enrolled</span>) },
    { key: 'grades', label: 'Grade', render: (r) => (r.grades.length ? r.grades.join(', ') : '—') },
    { key: 'completed', label: 'Completed', sortKey: 'completed', align: 'right', render: (r) => fmtNum(r.completed_activities) },
    { key: 'accuracy', label: 'Accuracy', align: 'right', render: (r) => fmtPct(r.accuracy) },
    { key: 'avg_score', label: 'Avg score', sortKey: 'avg_score', align: 'right', render: (r) => fmtPct(r.avg_score) },
    { key: 'last_activity', label: 'Last activity', sortKey: 'last_activity', render: (r) => (r.last_activity ? fmtDate(r.last_activity) : 'Never') },
    { key: 'view', label: '', render: (r) => <button type="button" className="sa-btn sa-btn-ghost sm" onClick={() => navigate(`/admin/students/${r.id}`)}>View</button> },
  ];
  return (
    <AdminPage user={user} onSignOut={onSignOut} title="Students" subtitle="Every student account is listed once, with all of their classroom memberships">
      <Panel>
        <div className="sa-filters">
          <SearchBox value={f.search} onChange={(search) => table.setFilter({ search })} placeholder="Name or email" />
          <Select label="Teacher" value={f.teacher_id} onChange={(v) => table.setFilter({ teacher_id: v, classroom_id: '' })} options={(o?.teachers || []).map((t) => ({ value: t.id, label: t.name }))} />
          <Select label="Classroom" value={f.classroom_id} onChange={(v) => table.setFilter({ classroom_id: v })} options={rooms.map((c) => ({ value: c.id, label: c.name }))} />
          <Select label="Grade" value={f.grade} onChange={(v) => table.setFilter({ grade: v })} options={(o?.grades || []).map((g) => ({ value: g, label: `Grade ${g}` }))} />
          <label className="sa-field sm">Registered from<input type="date" value={f.from || ''} max={f.to || undefined} onChange={(e) => table.setFilter({ from: e.target.value })} /></label>
          <label className="sa-field sm">Registered to<input type="date" value={f.to || ''} min={f.from || undefined} onChange={(e) => table.setFilter({ to: e.target.value })} /></label>
        </div>
        {result.error && <ErrorState message={result.error} onRetry={result.reload} />}
        <DataTable caption="Students" columns={columns} rows={result.data?.items} loading={result.loading} sort={{ key: table.sort, order: table.order }} onSort={table.toggleSort}
          meta={result.data} onPage={table.setPage} empty="No students found" />
      </Panel>
    </AdminPage>
  );
}
