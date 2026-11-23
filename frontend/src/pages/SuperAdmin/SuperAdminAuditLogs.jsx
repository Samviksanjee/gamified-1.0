import { adminApi } from '../../api.js';
import AdminPage from '../../components/SuperAdmin/AdminPage.jsx';
import { DataTable, ErrorState, Panel, SearchBox, Select, StatusBadge, fmtDateTime, useAdminData, useTableState } from '../../components/SuperAdmin/ui.jsx';

const TARGETS = ['USER', 'INVITATION', 'CLASSROOM', 'ACTIVITY', 'REPORT'];

export default function SuperAdminAuditLogs({ user, onSignOut }) {
  const table = useTableState({});
  const f = table.filters;
  const invalid = f.date_from && f.date_to && f.date_to < f.date_from;
  const params = { action: f.action || undefined, target_type: f.target_type || undefined, search: f.search || undefined,
    date_from: f.date_from || undefined, date_to: invalid ? undefined : f.date_to || undefined, page: table.page, page_size: 25 };
  const result = useAdminData(() => adminApi.auditEvents(params), [JSON.stringify(params)]);
  const actions = result.data?.actions || [];

  return (
    <AdminPage user={user} onSignOut={onSignOut} title="Audit logs" subtitle="A record of important actions taken on the platform">
      <Panel>
        <div className="sa-filters">
          <SearchBox value={f.search} onChange={(search) => table.setFilter({ search })} placeholder="Email or details" />
          <Select label="Action" value={f.action} onChange={(v) => table.setFilter({ action: v })} options={actions} />
          <Select label="Record type" value={f.target_type} onChange={(v) => table.setFilter({ target_type: v })} options={TARGETS.map((t) => ({ value: t, label: t.charAt(0) + t.slice(1).toLowerCase() }))} />
          <label className="sa-field sm">From<input type="date" value={f.date_from || ''} max={f.date_to || undefined} onChange={(e) => table.setFilter({ date_from: e.target.value })} /></label>
          <label className="sa-field sm">To<input type="date" value={f.date_to || ''} min={f.date_from || undefined} onChange={(e) => table.setFilter({ date_to: e.target.value })} /></label>
        </div>
        {invalid && <div className="sa-alert" role="alert">The end date must not be before the start date.</div>}
        {result.error && <ErrorState message={result.error} onRetry={result.reload} />}
        <DataTable caption="Audit events" loading={result.loading} rows={result.data?.items} meta={result.data} onPage={table.setPage} empty="No audit events found" columns={[
          { key: 'at', label: 'When', render: (e) => fmtDateTime(e.at) },
          { key: 'label', label: 'Action', render: (e) => <strong>{e.label}</strong> },
          { key: 'actor', label: 'Performed by', render: (e) => e.actor || 'System' },
          { key: 'target', label: 'Related to', render: (e) => <>{e.target}<div className="sa-kpi-note">{e.target_type}</div></> },
          { key: 'outcome', label: 'Outcome', render: (e) => <StatusBadge status={e.outcome.replace(/^.*\./, '')} /> },
          { key: 'details', label: 'Details', render: (e) => e.details || '—' }]} />
      </Panel>
    </AdminPage>
  );
}
