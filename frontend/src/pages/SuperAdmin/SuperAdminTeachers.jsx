import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { adminApi } from '../../api.js';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useApp } from '../../context/AppContext';
import AdminPage from '../../components/SuperAdmin/AdminPage.jsx';
import InviteTeacherForm from '../../components/SuperAdmin/InviteTeacherForm.jsx';
import { PlusIcon } from '../../components/SuperAdmin/icons.jsx';
import { DataTable, ErrorState, Modal, Panel, SearchBox, StatusBadge, Tabs, fmtDate, fmtDateTime, fmtNum, useAdminData, useTableState } from '../../components/SuperAdmin/ui.jsx';

const TABS = [{ key: '', label: 'All' }, { key: 'active', label: 'Active' }, { key: 'pending', label: 'Pending' }, { key: 'suspended', label: 'Suspended' }];

export default function SuperAdminTeachers({ user, onSignOut }) {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const status = TABS.some((t) => t.key === searchParams.get('status')) ? searchParams.get('status') : '';
  const table = useTableState({ sort: 'created_at', order: 'desc' });
  const [inviting, setInviting] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const f = table.filters;
  const params = { ...table.params, status: status || undefined, registered_from: f.from || undefined, registered_to: f.to || undefined, page_size: 20 };
  const result = useAdminData(() => adminApi.teachers(params), [JSON.stringify(params)]);
  const data = result.data;

  const change = async () => {
    const { teacher, action } = confirm;
    setBusyId(teacher.id);
    try {
      await (action === 'suspend' ? adminApi.suspendTeacher(teacher.id) : adminApi.reactivateTeacher(teacher.id));
      showToast(action === 'suspend' ? `✓ ${teacher.name} has been suspended` : `✓ ${teacher.name} has been reactivated`);
      setConfirm(null);
      await result.reload();
    } catch (err) { showToast(`❌ ${err.message}`); setConfirm(null); } finally { setBusyId(null); }
  };

  const columns = [
    { key: 'name', label: 'Teacher', sortKey: 'name', render: (r) => <><button type="button" className="sa-link-btn" onClick={() => navigate(`/admin/teachers/${r.id}`)}>{r.name}</button><div className="sa-kpi-note">{r.email}</div></> },
    { key: 'created_at', label: 'Registered', sortKey: 'created_at', render: (r) => fmtDate(r.created_at) },
    { key: 'status', label: 'Status', sortKey: 'status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'classrooms', label: 'Classrooms', sortKey: 'classrooms', align: 'right', render: (r) => fmtNum(r.classrooms) },
    { key: 'students', label: 'Students', sortKey: 'students', align: 'right', render: (r) => fmtNum(r.students) },
    { key: 'created', label: 'Created', sortKey: 'created', align: 'right', render: (r) => fmtNum(r.activities_created) },
    { key: 'published', label: 'Published', sortKey: 'published', align: 'right', render: (r) => fmtNum(r.activities_published) },
    { key: 'last_login', label: 'Last login', sortKey: 'last_login', render: (r) => (r.last_login_at ? fmtDateTime(r.last_login_at) : 'Never') },
    { key: 'actions', label: 'Actions', render: (r) => (
      <span style={{ display: 'inline-flex', gap: 6 }}>
        <button type="button" className="sa-btn sa-btn-ghost sm" onClick={() => navigate(`/admin/teachers/${r.id}`)}>View</button>
        {r.status === 'suspended'
          ? <button type="button" className="sa-btn sa-btn-ghost sm" disabled={busyId === r.id} onClick={() => setConfirm({ teacher: r, action: 'reactivate' })}>Reactivate</button>
          : <button type="button" className="sa-btn sa-btn-danger sm" disabled={busyId === r.id} onClick={() => setConfirm({ teacher: r, action: 'suspend' })}>Suspend</button>}
      </span>) },
  ];

  return (
    <AdminPage user={user} onSignOut={onSignOut} title="Teachers" subtitle="Accounts, classrooms and activity for every teacher"
      actions={<button type="button" className="sa-btn sa-btn-primary" onClick={() => setInviting(true)}><PlusIcon size={18} />Invite teacher</button>}>
      <Tabs label="Teacher status" value={status} onChange={(key) => { setSearchParams(key ? { status: key } : {}); table.setPage(1); }} tabs={TABS} />
      <Panel>
        <div className="sa-filters">
          <SearchBox value={f.search} onChange={(search) => table.setFilter({ search })} placeholder="Name or email" />
          <label className="sa-field sm">Registered from<input type="date" value={f.from || ''} max={f.to || undefined} onChange={(e) => table.setFilter({ from: e.target.value })} /></label>
          <label className="sa-field sm">Registered to<input type="date" value={f.to || ''} min={f.from || undefined} onChange={(e) => table.setFilter({ to: e.target.value })} /></label>
        </div>
        {result.error && <ErrorState message={result.error} onRetry={result.reload} />}
        <DataTable caption="Teachers" columns={columns} rows={data?.items} loading={result.loading} sort={{ key: table.sort, order: table.order }} onSort={table.toggleSort}
          meta={data} onPage={table.setPage} empty="No teachers found" />
      </Panel>

      {(status === '' || status === 'pending') && data?.pending_invitations?.length > 0 && (
        <Panel title="Invitations waiting for a response" subtitle="Sent by e-mail link; no account exists until the teacher accepts" style={{ marginTop: 16 }}>
          <DataTable caption="Pending invitations" rowKey="id" columns={[{ key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }, { key: 'invited_at', label: 'Invited', render: (r) => fmtDate(r.invited_at) },
            { key: 'expires_at', label: 'Expires', render: (r) => fmtDate(r.expires_at) }, { key: 'email_sent_status', label: 'Email', render: (r) => <StatusBadge status={String(r.email_sent_status || '').toLowerCase() === 'sent' ? 'success' : 'pending'} /> }]}
            rows={data.pending_invitations} />
        </Panel>
      )}

      {inviting && (
        <Modal title="Invite a teacher" onClose={() => setInviting(false)}>
          <InviteTeacherForm notify={showToast} onCancel={() => setInviting(false)} onCreated={() => { setInviting(false); result.reload(); }} />
        </Modal>
      )}
      <ConfirmDialog isOpen={Boolean(confirm)} danger={confirm?.action === 'suspend'} onCancel={() => setConfirm(null)} onConfirm={change}
        title={confirm?.action === 'suspend' ? 'Suspend this teacher?' : 'Reactivate this teacher?'}
        confirmText={confirm?.action === 'suspend' ? 'Suspend' : 'Reactivate'}
        message={confirm ? (confirm.action === 'suspend'
          ? `${confirm.teacher.name} will no longer be able to sign in. Their classrooms, activities and student results are kept. You can reactivate the account at any time.`
          : `${confirm.teacher.name} will be able to sign in again.`) : ''} />
    </AdminPage>
  );
}
