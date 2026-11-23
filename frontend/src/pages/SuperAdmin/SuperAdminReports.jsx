import { useState } from 'react';
import { adminApi } from '../../api.js';
import { useApp } from '../../context/AppContext';
import AdminPage from '../../components/SuperAdmin/AdminPage.jsx';
import { DownloadIcon } from '../../components/SuperAdmin/icons.jsx';
import { Async, DEFAULT_RANGE, DataTable, DateRangeFilter, EmptyState, ErrorState, GAME_NAMES, Panel, Select, rangeParams, useAdminData } from '../../components/SuperAdmin/ui.jsx';

export default function SuperAdminReports({ user, onSignOut }) {
  const { showToast } = useApp();
  const [selected, setSelected] = useState('');
  const [range, setRange] = useState(DEFAULT_RANGE);
  const [f, setF] = useState({ grade: '', subject: '', teacher_id: '', game_type: '', classroom_ids: [] });
  const [busy, setBusy] = useState('');
  const list = useAdminData(() => adminApi.reports(), []);
  const options = useAdminData(() => adminApi.filters(), []);
  const o = options.data;
  const reports = list.data?.reports || [];
  const name = selected || reports[0]?.key || '';
  const params = { ...rangeParams(range), grade: f.grade || undefined, subject: f.subject || undefined, teacher_id: f.teacher_id || undefined, game_type: f.game_type || undefined, classroom_ids: f.classroom_ids };
  const key = JSON.stringify([name, params]);
  const preview = useAdminData(() => (name ? adminApi.reportPreview(name, params) : Promise.resolve(null)), [key]);
  const set = (patch) => setF((s) => ({ ...s, ...patch }));

  const download = async (format) => {
    setBusy(format);
    try {
      const file = await adminApi.downloadReport(name, params, format);
      showToast(`✓ ${file} downloaded`);
    } catch (err) { showToast(`❌ ${err.message}`); } finally { setBusy(''); }
  };

  const rows = (preview.data?.rows || []).map((cells, i) => ({ id: i, cells }));
  const columns = (preview.data?.columns || []).map((label, i) => ({ key: `c${i}`, label, render: (r) => (r.cells[i] === null || r.cells[i] === undefined || r.cells[i] === '' ? '—' : String(r.cells[i])) }));

  return (
    <AdminPage user={user} onSignOut={onSignOut} title="Reports & exports" subtitle="Download platform data as CSV or Excel. Files use the filters below.">
      <Async result={list} rows={3}>{() => (
        <div className="sa-grid two" style={{ alignItems: 'start' }}>
          <Panel title="Report" subtitle="Choose what to export">
            <div role="radiogroup" aria-label="Report type" style={{ display: 'grid', gap: 8 }}>
              {reports.map((r) => (
                <label key={r.key} className="sa-field" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <input type="radio" name="report" value={r.key} checked={name === r.key} onChange={() => setSelected(r.key)} />
                  <span>{r.title}</span>
                </label>
              ))}
            </div>
          </Panel>
          <Panel title="Filters">
            <div style={{ marginBottom: 12 }}><DateRangeFilter value={range} onChange={setRange} /></div>
            <div className="sa-filters">
              <Select label="Teacher" value={f.teacher_id} onChange={(v) => set({ teacher_id: v })} options={(o?.teachers || []).map((t) => ({ value: t.id, label: t.name }))} />
              <Select label="Grade" value={f.grade} onChange={(v) => set({ grade: v })} options={(o?.grades || []).map((g) => ({ value: g, label: `Grade ${g}` }))} />
              <Select label="Subject" value={f.subject} onChange={(v) => set({ subject: v })} options={o?.subjects || []} />
              <Select label="Game" value={f.game_type} onChange={(v) => set({ game_type: v })} options={Object.entries(GAME_NAMES).map(([value, label]) => ({ value, label }))} />
              <label className="sa-field">Classrooms
                <select multiple size={4} aria-label="Classrooms" value={f.classroom_ids.map(String)} onChange={(e) => set({ classroom_ids: [...e.target.selectedOptions].map((x) => x.value) })}>
                  {(o?.classrooms || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
            </div>
          </Panel>
        </div>
      )}</Async>
      <Panel title="Preview" subtitle={preview.data ? `First ${preview.data.rows.length} of ${preview.data.total_rows} rows` : undefined}
        actions={name && (
          <span style={{ display: 'inline-flex', gap: 8 }}>
            <button type="button" className="sa-btn sa-btn-ghost" disabled={!!busy} onClick={() => download('csv')}><DownloadIcon size={16} /> {busy === 'csv' ? 'Preparing…' : 'CSV'}</button>
            <button type="button" className="sa-btn sa-btn-primary" disabled={!!busy} onClick={() => download('xlsx')}><DownloadIcon size={16} /> {busy === 'xlsx' ? 'Preparing…' : 'Excel'}</button>
          </span>)}
        style={{ marginTop: 16 }}>
        {preview.error && <ErrorState message={preview.error} onRetry={preview.reload} />}
        {name ? <DataTable caption="Report preview" loading={preview.loading} rows={rows} columns={columns} empty="This report has no rows for the selected filters" />
          : !list.loading && <EmptyState title="No reports available" />}
      </Panel>
    </AdminPage>
  );
}
