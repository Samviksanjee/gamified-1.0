import { useState } from 'react';
import { adminApi } from '../../api.js';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useApp } from '../../context/AppContext';
import AdminPage from '../../components/SuperAdmin/AdminPage.jsx';
import InviteTeacherForm from '../../components/SuperAdmin/InviteTeacherForm.jsx';
import { DataTable, ErrorState, Panel, StatusBadge, Tabs, fmtDateTime, useAdminData } from '../../components/SuperAdmin/ui.jsx';

const FILTERS = [{ key: 'all', label: 'All' }, { key: 'pending', label: 'Pending' }, { key: 'used', label: 'Accepted' }, { key: 'expired', label: 'Expired' }, { key: 'revoked', label: 'Revoked' }];

export default function SuperAdminInvitations({ user, onSignOut }) {
  const { showToast } = useApp();
  const [filter, setFilter] = useState('all');
  const [revoke, setRevoke] = useState(null);
  const [busy, setBusy] = useState(null);
  const result = useAdminData(() => adminApi.invitations(true), []);
  const all = result.data?.invitations || [];
  const rows = all.filter((i) => filter === 'all' || i.status === filter);

  const resend = async (inv) => {
    setBusy(inv.id);
    try { await adminApi.resendInvitation(inv.id); showToast(`✓ Invitation re-sent to ${inv.email}`); await result.reload(); }
    catch (err) { showToast(`❌ ${err.message}`); } finally { setBusy(null); }
  };
  const doRevoke = async () => {
    setBusy(revoke.id);
    try { await adminApi.revokeInvitation(revoke.id); showToast('✓ Invitation revoked'); setRevoke(null); await result.reload(); }
    catch (err) { showToast(`❌ ${err.message}`); setRevoke(null); } finally { setBusy(null); }
  };

  return (
    <AdminPage user={user} onSignOut={onSignOut} title="Invitations" subtitle="Create a teacher with a temporary password and track their invitation">
      <div className="sa-grid two" style={{ alignItems: 'start' }}>
        <Panel title="Invite a teacher" subtitle="Full name, email and a temporary password. The teacher chooses their own password at first login.">
          <InviteTeacherForm notify={showToast} onCreated={result.reload} />
        </Panel>
        <Panel title="Invitation history">
          <Tabs label="Invitation status" value={filter} onChange={setFilter} tabs={FILTERS.map((f) => ({ ...f, count: f.key === 'all' ? all.length : all.filter((i) => i.status === f.key).length }))} />
          {result.error && <ErrorState message={result.error} onRetry={result.reload} />}
          <DataTable caption="Invitations" loading={result.loading} rows={rows} empty="No invitations" columns={[
            { key: 'name', label: 'Teacher', render: (r) => <><strong>{r.name || '—'}</strong><div className="sa-kpi-note">{r.email}</div></> },
            { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status === 'used' ? 'active' : r.status} /> },
            { key: 'created_at', label: 'Sent', render: (r) => fmtDateTime(r.created_at) },
            { key: 'actions', label: '', render: (r) => (r.status === 'pending' || r.status === 'expired') && (
              <span style={{ display: 'inline-flex', gap: 6 }}>
                <button type="button" className="sa-btn sa-btn-ghost sm" disabled={busy === r.id} onClick={() => resend(r)}>Resend</button>
                {r.status === 'pending' && <button type="button" className="sa-btn sa-btn-danger sm" disabled={busy === r.id} onClick={() => setRevoke(r)}>Revoke</button>}
              </span>) }]} />
        </Panel>
      </div>
      <ConfirmDialog isOpen={Boolean(revoke)} danger title="Revoke this invitation?" confirmText="Revoke" onCancel={() => setRevoke(null)} onConfirm={doRevoke}
        message={revoke ? `The invitation link for ${revoke.email} will stop working. If a temporary-password account was created, it stays in the Teachers list and can be suspended there.` : ''} />
    </AdminPage>
  );
}
