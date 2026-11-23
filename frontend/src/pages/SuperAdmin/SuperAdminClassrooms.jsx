import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api.js';
import AdminPage from '../../components/SuperAdmin/AdminPage.jsx';
import { DataTable, ErrorState, Panel, SearchBox, Select, StatusBadge, fmtDate, fmtNum, fmtPct, useAdminData, useTableState } from '../../components/SuperAdmin/ui.jsx';

export default function SuperAdminClassrooms({ user, onSignOut }) {
  const navigate = useNavigate();
  const table = useTableState({ sort: 'created_at', order: 'desc' });
  const f = table.filters;
  const options = useAdminData(() => adminApi.filters(), []);
  const params = { ...table.params, grade: f.grade || undefined, subject: f.subject || undefined, teacher_id: f.teacher_id || undefined, status: f.status || undefined, page_size: 20 };
  const result = useAdminData(() => adminApi.classrooms(params), [JSON.stringify(params)]);
  const o = options.data;
  const columns = [
    { key: 'name', label: 'Classroom', sortKey: 'name', render: (r) => <button type="button" className="sa-link-btn" onClick={() => navigate(`/admin/classrooms/${r.id}`)}>{r.name}</button> },
    { key: 'grade', label: 'Grade', sortKey: 'grade' }, { key: 'subject', label: 'Subject', sortKey: 'subject' },
    { key: 'teacher', label: 'Teacher', sortKey: 'teacher', render: (r) => <button type="button" className="sa-link-btn" onClick={() => navigate(`/admin/teachers/${r.teacher_id}`)}>{r.teacher}</button> },
    { key: 'students', label: 'Students', sortKey: 'students', align: 'right', render: (r) => fmtNum(r.enrolled_students) },
    { key: 'assigned', label: 'Assigned', align: 'right', render: (r) => fmtNum(r.activities_assigned) },
    { key: 'done', label: 'Completed', align: 'right', render: (r) => fmtNum(r.assignments_completed) },
    { key: 'accuracy', label: 'Accuracy', align: 'right', render: (r) => fmtPct(r.accuracy) },
    { key: 'status', label: 'Status', sortKey: 'status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'created_at', label: 'Created', sortKey: 'created_at', render: (r) => fmtDate(r.created_at) },
  ];
  return (
    <AdminPage user={user} onSignOut={onSignOut} title="Classrooms" subtitle="All classrooms across the platform">
      <Panel>
        <div className="sa-filters">
          <SearchBox value={f.search} onChange={(search) => table.setFilter({ search })} placeholder="Classroom or teacher" />
          <Select label="Grade" value={f.grade} onChange={(v) => table.setFilter({ grade: v })} options={(o?.grades || []).map((g) => ({ value: g, label: `Grade ${g}` }))} />
          <Select label="Subject" value={f.subject} onChange={(v) => table.setFilter({ subject: v })} options={o?.subjects || []} />
          <Select label="Teacher" value={f.teacher_id} onChange={(v) => table.setFilter({ teacher_id: v })} options={(o?.teachers || []).map((t) => ({ value: t.id, label: t.name }))} />
          <Select label="Status" value={f.status} onChange={(v) => table.setFilter({ status: v })} options={[{ value: 'active', label: 'Active (played in last 30 days)' }, { value: 'idle', label: 'Idle' }, { value: 'empty', label: 'No students' }]} />
        </div>
        {result.error && <ErrorState message={result.error} onRetry={result.reload} />}
        <DataTable caption="Classrooms" columns={columns} rows={result.data?.items} loading={result.loading} sort={{ key: table.sort, order: table.order }} onSort={table.toggleSort}
          meta={result.data} onPage={table.setPage} empty="No classrooms found" />
        <p className="sa-kpi-note" style={{ marginTop: 10 }}>Status is derived: <b>active</b> = a student attempted an assigned activity in the last 30 days, <b>idle</b> = students but no recent play, <b>empty</b> = no students.</p>
      </Panel>
    </AdminPage>
  );
}
