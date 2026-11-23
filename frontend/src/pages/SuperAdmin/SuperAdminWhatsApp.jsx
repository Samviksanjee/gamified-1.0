import { useEffect, useRef, useState } from 'react';
import AdminPage from '../../components/SuperAdmin/AdminPage.jsx';
import {
  Async, EmptyState, Panel, PanelSkeleton,
  fmtDateTime, fmtNum, useAdminData,
} from '../../components/SuperAdmin/ui.jsx';
import { KpiCard } from '../../components/SuperAdmin/ui.jsx';
import { RefreshIcon } from '../../components/SuperAdmin/icons.jsx';
import { adminApi } from '../../api.js';
import { useApp } from '../../context/AppContext.jsx';

// ── Template definitions (one per notification type) ──────────────────────────

const TEMPLATE_CONFIGS = {
  announcement: {
    label: 'Classroom Announcement',
    icon: '📢',
    description: 'Sent when a teacher publishes a new classroom announcement.',
    variables: ['{{student_name}}', '{{teacher_name}}', '{{classroom_name}}', '{{announcement_title}}'],
    defaultBody: `Hello {{student_name}}!\n\nYour teacher {{teacher_name}} has posted a new announcement in GamifiEd.\n\nClassroom: {{classroom_name}}\nTitle: {{announcement_title}}\n\nPlease log in to GamifiEd to read the complete announcement.\n\n- Team GamifiEd`,
  },
  game_published: {
    label: 'New Game Published',
    icon: '🎮',
    description: 'Sent when a teacher publishes a new educational game or activity.',
    variables: ['{{student_name}}', '{{teacher_name}}', '{{game_name}}', '{{subject_name}}', '{{classroom_name}}'],
    defaultBody: `Hello {{student_name}}!\n\nA new learning game has been published by {{teacher_name}}.\n\nGame: {{game_name}}\nSubject: {{subject_name}}\nClassroom: {{classroom_name}}\n\nOpen GamifiEd and start learning through play!\n\n- Team GamifiEd`,
  },
  assignment: {
    label: 'New Assignment',
    icon: '📋',
    description: 'Sent when a student receives a new assignment.',
    variables: ['{{student_name}}', '{{teacher_name}}', '{{assignment_title}}', '{{subject_name}}', '{{due_date}}'],
    defaultBody: `Hello {{student_name}}!\n\nYou have received a new learning assignment from {{teacher_name}}.\n\nAssignment: {{assignment_title}}\nSubject: {{subject_name}}\nDue Date: {{due_date}}\n\nPlease visit GamifiEd to view the instructions and complete your assignment.\n\n- Team GamifiEd`,
  },
  assignment_reminder: {
    label: 'Assignment Reminder',
    icon: '⏰',
    description: 'Sent as an automatic reminder for upcoming or overdue assignments.',
    variables: ['{{student_name}}', '{{teacher_name}}', '{{assignment_title}}', '{{due_date}}', '{{classroom_name}}'],
    defaultBody: `Hello {{student_name}}!\n\nReminder: Your assignment is due soon.\n\nAssignment: {{assignment_title}}\nDue Date: {{due_date}}\nClassroom: {{classroom_name}}\n\nPlease visit GamifiEd to complete your assignment.\n\n- Team GamifiEd`,
  },
  event: {
    label: 'Upcoming Event',
    icon: '📅',
    description: 'Sent when a teacher creates and publishes a classroom event.',
    variables: ['{{student_name}}', '{{teacher_name}}', '{{event_name}}', '{{event_date}}', '{{event_time}}'],
    defaultBody: `Hello {{student_name}}!\n\nThere is an upcoming event in your GamifiEd classroom.\n\nEvent: {{event_name}}\nOrganized by: {{teacher_name}}\nDate: {{event_date}}\nTime: {{event_time}}\n\nPlease check GamifiEd for more details.\n\n- Team GamifiEd`,
  },
  event_reminder: {
    label: 'Event Reminder',
    icon: '🔔',
    description: 'Sent 24 hours or 1 hour before a scheduled classroom event.',
    variables: ['{{student_name}}', '{{teacher_name}}', '{{event_name}}', '{{event_date}}', '{{event_time}}'],
    defaultBody: `Hello {{student_name}}!\n\nReminder: There is an upcoming event in your GamifiEd classroom.\n\nEvent: {{event_name}}\nOrganized by: {{teacher_name}}\nDate: {{event_date}}\nTime: {{event_time}}\n\n- Team GamifiEd`,
  },
  custom_reminder: {
    label: 'Custom / General Reminder',
    icon: '💬',
    description: 'Sent when a teacher creates a manual reminder for students.',
    variables: ['{{student_name}}', '{{teacher_name}}', '{{reminder_message}}', '{{classroom_name}}'],
    defaultBody: `Hello {{student_name}}!\n\nReminder from {{teacher_name}}:\n\n{{reminder_message}}\n\nClassroom: {{classroom_name}}\n\nPlease check GamifiEd for additional details.\n\n- Team GamifiEd`,
  },
};

const TEMPLATE_TYPES = Object.keys(TEMPLATE_CONFIGS);

// ── Status Tab ────────────────────────────────────────────────────────────────

function StatusTab() {
  const result = useAdminData(() => adminApi.whatsappStatus(), []);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button
          type="button"
          className="sa-btn sa-btn-primary"
          onClick={result.reload}
          disabled={result.loading}
          aria-busy={result.loading}
        >
          <RefreshIcon size={16} className={result.loading ? 'sa-spin' : undefined} />
          {result.loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <Async result={result} rows={5}>{(data) => {
        const checks = [
          { label: 'Integration enabled (WHATSAPP_ENABLED)', ok: Boolean(data.enabled) },
          { label: 'Access token configured', ok: Boolean(data.access_token_configured) },
          { label: 'Phone Number ID configured', ok: Boolean(data.phone_number_id_configured) },
          { label: 'Business Account ID configured', ok: Boolean(data.business_account_id_configured ?? data.business_account_configured) },
          { label: 'Webhook verify token set', ok: Boolean(data.webhook_configured) },
          { label: 'App secret set', ok: Boolean(data.app_secret_configured ?? data.webhook_configured) },
        ];

        return (
          <>
            <div className="sa-grid two" style={{ marginBottom: 16 }}>
              <Panel title="Integration Health" subtitle="Configuration checks for the WhatsApp Business Cloud API. Credentials are never shown here.">
                <div style={{ display: 'grid', gap: 8 }}>
                  {checks.map((c) => (
                    <div
                      key={c.label}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                        background: c.ok ? '#e5f8eb' : '#ffe9e7', borderRadius: 10,
                      }}
                    >
                      <span style={{ fontSize: 18, flexShrink: 0 }} aria-hidden="true">{c.ok ? '✅' : '❌'}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: c.ok ? '#238650' : '#c85a59' }}>
                        {c.label}
                      </span>
                    </div>
                  ))}
                </div>

                {data.last_error && (
                  <div style={{ marginTop: 14, padding: '10px 14px', background: '#ffe9e7', borderRadius: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#c85a59', marginBottom: 4 }}>Last API error</div>
                    <div style={{ fontSize: 12, color: '#6b2929' }}>{data.last_error}</div>
                  </div>
                )}
                {data.last_checked_at && (
                  <p className="sa-sub" style={{ marginTop: 10 }}>
                    Last checked: {fmtDateTime(data.last_checked_at)}
                  </p>
                )}
              </Panel>

              <Panel title="Student Opt-In Summary" subtitle="Students who have consented to receive WhatsApp notifications.">
                <div className="sa-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 12 }}>
                  {[
                    { label: 'Total Students', value: data.total_students },
                    { label: 'Opted In', value: data.total_opt_ins },
                    { label: 'Opted Out', value: data.total_opt_outs ?? ((data.total_students ?? 0) - (data.total_opt_ins ?? 0)) },
                    { label: 'Phone Verified', value: data.phone_verified_count },
                  ].map((s) => (
                    <div key={s.label} style={{ background: '#f7fafb', borderRadius: 12, padding: '12px 10px', textAlign: 'center' }}>
                      <strong style={{ fontSize: 22, color: 'var(--sa-navy, #153e67)' }}>{fmtNum(s.value)}</strong>
                      <div className="sa-kpi-note">{s.label}</div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            <Panel title="Configuration Details" subtitle="Read-only details about the current API setup.">
              <dl style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '8px 20px', margin: 0, fontSize: 13 }}>
                <dt>API Version</dt>
                <dd style={{ margin: 0, color: 'var(--sa-navy, #153e67)', fontWeight: 700 }}>{data.api_version || '—'}</dd>
                <dt>Default Country Code</dt>
                <dd style={{ margin: 0, color: 'var(--sa-navy, #153e67)', fontWeight: 700 }}>+{data.default_country_code || '91'} (India)</dd>
                <dt>Webhooks</dt>
                <dd style={{ margin: 0 }}>
                  <span className={`sa-badge ${data.webhook_configured ? 'active' : 'suspended'}`}>
                    {data.webhook_configured ? 'Configured' : 'Not configured'}
                  </span>
                </dd>
              </dl>
              <p className="sa-sub" style={{ marginTop: 12 }}>
                To update API credentials, edit the environment variables on the server
                (<code>WHATSAPP_ACCESS_TOKEN</code>, <code>WHATSAPP_PHONE_NUMBER_ID</code>, etc.)
                and restart the backend. Credentials are never sent to or stored in the frontend.
              </p>
            </Panel>
          </>
        );
      }}</Async>
    </>
  );
}

// ── Templates Tab ─────────────────────────────────────────────────────────────

function TemplatesTab() {
  const { showToast } = useApp();
  const textareaRef = useRef(null);

  const [selected, setSelected] = useState(TEMPLATE_TYPES[0]);
  const [serverTemplates, setServerTemplates] = useState({});
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editBody, setEditBody] = useState(TEMPLATE_CONFIGS[TEMPLATE_TYPES[0]].defaultBody);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setLoadingTemplates(true);
    adminApi.whatsappTemplates()
      .then((data) => {
        const map = {};
        (Array.isArray(data) ? data : data?.templates || []).forEach((t) => {
          map[t.type] = t;
        });
        setServerTemplates(map);
        const first = map[TEMPLATE_TYPES[0]];
        setEditBody(first?.body || TEMPLATE_CONFIGS[TEMPLATE_TYPES[0]].defaultBody);
        setIsActive(first?.is_active ?? true);
        setLoadError('');
      })
      .catch(() => {
        setLoadError('Could not load saved templates — showing built-in defaults. Changes will be saved to the server when you click Save.');
        setEditBody(TEMPLATE_CONFIGS[TEMPLATE_TYPES[0]].defaultBody);
      })
      .finally(() => setLoadingTemplates(false));
  }, []);

  const handleSelectType = (type) => {
    setSelected(type);
    const saved = serverTemplates[type];
    setEditBody(saved?.body || TEMPLATE_CONFIGS[type].defaultBody);
    setIsActive(saved?.is_active ?? true);
    setSaveError('');
    setDirty(false);
  };

  /** Insert variable at cursor position in the textarea. */
  const insertVariable = (variable) => {
    const el = textareaRef.current;
    if (!el) {
      setEditBody((prev) => prev + variable);
      setDirty(true);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = editBody.slice(0, start) + variable + editBody.slice(end);
    setEditBody(next);
    setDirty(true);
    setTimeout(() => {
      el.selectionStart = el.selectionEnd = start + variable.length;
      el.focus();
    }, 0);
  };

  const handleReset = () => {
    setEditBody(TEMPLATE_CONFIGS[selected].defaultBody);
    setDirty(true);
  };

  const handleSave = async () => {
    if (!editBody.trim()) { setSaveError('Template body cannot be empty.'); return; }
    setSaving(true);
    setSaveError('');
    try {
      const updated = await adminApi.updateWhatsappTemplate(selected, {
        body: editBody.trim(),
        is_active: isActive,
      });
      setServerTemplates((prev) => ({
        ...prev,
        [selected]: { type: selected, ...prev[selected], ...updated, body: editBody.trim(), is_active: isActive },
      }));
      showToast(`✓ ${TEMPLATE_CONFIGS[selected].label} template saved!`);
      setDirty(false);
    } catch (err) {
      setSaveError(err.message || 'Failed to save template.');
    } finally {
      setSaving(false);
    }
  };

  const cfg = TEMPLATE_CONFIGS[selected];

  return (
    <div>
      {loadError && (
        <div className="sa-alert" role="alert" style={{ marginBottom: 14 }}>
          <span aria-hidden="true">⚠️</span>
          <div>{loadError}</div>
        </div>
      )}

      {loadingTemplates
        ? <PanelSkeleton rows={4} />
        : (
          <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: 16, alignItems: 'start' }}>
            {/* ── Type list ── */}
            <Panel title="Notification Types">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {TEMPLATE_TYPES.map((type) => {
                  const c = TEMPLATE_CONFIGS[type];
                  const saved = serverTemplates[type];
                  const isSelected = type === selected;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleSelectType(type)}
                      aria-pressed={isSelected}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left', width: '100%',
                        background: isSelected ? '#e5f8f7' : 'transparent',
                        border: `1.5px solid ${isSelected ? '#19b7a7' : 'transparent'}`,
                        transition: 'background .1s',
                      }}
                    >
                      <span style={{ fontSize: 20, flexShrink: 0 }} aria-hidden="true">{c.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 12, fontWeight: 700,
                          color: isSelected ? '#147d81' : 'var(--sa-navy, #153e67)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {c.label}
                        </div>
                        {saved?.is_active === false && (
                          <div style={{ fontSize: 10, color: '#c85a59', fontWeight: 700, marginTop: 2 }}>Disabled</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Panel>

            {/* ── Editor ── */}
            <Panel
              title={`${cfg.icon} ${cfg.label}`}
              subtitle={cfg.description}
              actions={
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => { setIsActive(e.target.checked); setDirty(true); }}
                  />
                  <span style={{ fontWeight: 700, color: isActive ? '#238650' : '#c85a59' }}>
                    {isActive ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              }
            >
              {/* Variable chips */}
              <div style={{ marginBottom: 14 }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: '#688097',
                  textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8,
                }}>
                  Available variables — click to insert at cursor
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {cfg.variables.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => insertVariable(v)}
                      title={`Insert ${v} at cursor position`}
                      style={{
                        padding: '4px 10px', border: '1px solid #c5dfe8', borderRadius: 6,
                        background: '#eaf7f7', color: '#147d81', fontSize: 12, fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'monospace',
                      }}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Template body */}
              <textarea
                ref={textareaRef}
                value={editBody}
                onChange={(e) => { setEditBody(e.target.value); setDirty(true); }}
                rows={16}
                spellCheck={false}
                aria-label="Message template body"
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 10,
                  border: '1.5px solid #cde0e7', fontSize: 13, lineHeight: 1.75,
                  resize: 'vertical', fontFamily: 'monospace', boxSizing: 'border-box',
                  background: '#fafcfd',
                }}
              />

              {/* Live preview */}
              {editBody && (
                <div style={{ marginTop: 14 }}>
                  <div style={{
                    fontSize: 11, fontWeight: 700, color: '#688097',
                    textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8,
                  }}>
                    Message preview (variables shown as placeholders)
                  </div>
                  <div style={{
                    background: '#f0f7f0', border: '1px solid #c5e0c5', borderRadius: 12,
                    padding: '14px 16px', fontSize: 13, lineHeight: 1.75, color: '#2d4a2d',
                    whiteSpace: 'pre-wrap', maxHeight: 220, overflowY: 'auto',
                  }}>
                    {editBody}
                  </div>
                </div>
              )}

              {saveError && (
                <div role="alert" style={{
                  marginTop: 12, padding: '10px 14px', background: '#ffe9e7',
                  borderRadius: 8, fontSize: 13, color: '#c85a59',
                }}>
                  {saveError}
                </div>
              )}

              <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  type="button"
                  className="sa-btn sa-btn-primary"
                  onClick={handleSave}
                  disabled={saving || !dirty}
                  aria-busy={saving}
                >
                  {saving ? 'Saving…' : '💾 Save Template'}
                </button>
                <button
                  type="button"
                  className="sa-btn sa-btn-ghost"
                  onClick={handleReset}
                  disabled={saving}
                >
                  Reset to default
                </button>
                {!dirty && !saving && (
                  <span style={{ fontSize: 12, color: '#9aabb5' }}>✓ No unsaved changes</span>
                )}
              </div>
            </Panel>
          </div>
        )
      }
    </div>
  );
}

// ── Analytics Tab ─────────────────────────────────────────────────────────────

function AnalyticsTab() {
  const result = useAdminData(() => adminApi.whatsappAnalytics(), []);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button
          type="button"
          className="sa-btn sa-btn-primary"
          onClick={result.reload}
          disabled={result.loading}
          aria-busy={result.loading}
        >
          <RefreshIcon size={16} className={result.loading ? 'sa-spin' : undefined} />
          {result.loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <Async result={result} rows={6}>{(data) => (
        <>
          <section className="sa-grid kpis" aria-label="WhatsApp delivery metrics" style={{ marginBottom: 16 }}>
            <KpiCard label="Total Sent" value={fmtNum(data.sent)} note="Notifications dispatched to Meta API" />
            <KpiCard label="Delivered" value={fmtNum(data.delivered)} note="Confirmed as delivered to recipient" />
            <KpiCard label="Failed" value={fmtNum(data.failed)} note="Delivery failed or rejected by API" />
            <KpiCard label="Pending / Queued" value={fmtNum(data.pending ?? data.queued)} note="Awaiting delivery" />
            <KpiCard label="Students Opted In" value={fmtNum(data.opted_in)} note="Consented to receive notifications" />
            <KpiCard label="Students Opted Out" value={fmtNum(data.opted_out)} note="Declined or not yet opted in" />
          </section>

          {Array.isArray(data.by_type) && data.by_type.length > 0 && (
            <Panel title="Breakdown by notification type" style={{ marginBottom: 16 }}>
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      {['Type', 'Sent', 'Delivered', 'Failed', 'Pending'].map((h) => (
                        <th key={h} style={{
                          textAlign: 'left', padding: '10px 14px', fontSize: 11,
                          color: '#688097', fontWeight: 900, borderBottom: '1.5px solid #e0eaed',
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.by_type.map((row, i) => {
                      const cfg = TEMPLATE_CONFIGS[row.type];
                      return (
                        <tr key={row.type ?? i} style={{ borderBottom: '1px solid #edf2f3' }}>
                          <td style={{ padding: '10px 14px', fontSize: 13, color: '#153e67' }}>
                            {cfg ? `${cfg.icon} ${cfg.label}` : (row.type || '—')}
                          </td>
                          <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700 }}>{fmtNum(row.sent)}</td>
                          <td style={{ padding: '10px 14px', fontSize: 13, color: '#238650', fontWeight: 700 }}>{fmtNum(row.delivered)}</td>
                          <td style={{ padding: '10px 14px', fontSize: 13, color: '#c85a59', fontWeight: 700 }}>{fmtNum(row.failed)}</td>
                          <td style={{ padding: '10px 14px', fontSize: 13, color: '#a77818', fontWeight: 700 }}>{fmtNum(row.pending ?? row.queued)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}

          {data.last_updated && (
            <p className="sa-sub">Last updated: {fmtDateTime(data.last_updated)}</p>
          )}
        </>
      )}</Async>
    </>
  );
}

// ── Delivery Logs Tab ─────────────────────────────────────────────────────────

const LOG_STATUS_CLASS = {
  sent: 'active', delivered: 'active',
  failed: 'suspended', queued: 'pending',
  pending: 'pending', skipped: 'inactive',
};

function LogsTab() {
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const result = useAdminData(
    () => adminApi.whatsappLogs(page, pageSize),
    [page],
  );

  const logs = result.data?.logs || result.data?.items || [];
  const total = result.data?.total ?? logs.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <p className="sa-sub" style={{ margin: 0 }}>
          Showing {logs.length} of {fmtNum(total)} delivery records
        </p>
        <button
          type="button"
          className="sa-btn sa-btn-ghost sm"
          onClick={result.reload}
          disabled={result.loading}
          aria-busy={result.loading}
        >
          <RefreshIcon size={15} className={result.loading ? 'sa-spin' : undefined} />
          {result.loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <Async result={result} rows={5}>{() => (
        logs.length === 0
          ? <EmptyState title="No delivery records yet">Sent notifications will appear here.</EmptyState>
          : (
            <Panel>
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      {['Student', 'Type', 'Classroom', 'Stage', 'Status', 'Sent At', 'Error'].map((h) => (
                        <th key={h} style={{
                          textAlign: 'left', padding: '10px 14px', fontSize: 11,
                          color: '#688097', fontWeight: 900, borderBottom: '1.5px solid #e0eaed', whiteSpace: 'nowrap',
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, i) => {
                      const cfg = TEMPLATE_CONFIGS[log.trigger_type];
                      return (
                        <tr key={log.id ?? i} style={{ borderBottom: '1px solid #edf2f3' }}>
                          <td style={{ padding: '10px 14px', fontSize: 13, color: '#153e67', fontWeight: 700 }}>
                            {log.student_name || `#${log.student_id}`}
                          </td>
                          <td style={{ padding: '10px 14px', fontSize: 13, color: '#153e67', whiteSpace: 'nowrap' }}>
                            {cfg ? `${cfg.icon} ${cfg.label}` : (log.trigger_type || '—')}
                          </td>
                          <td style={{ padding: '10px 14px', fontSize: 13, color: '#688097' }}>
                            {log.classroom_name || '—'}
                          </td>
                          <td style={{ padding: '10px 14px', fontSize: 12, color: '#688097' }}>
                            {log.reminder_stage || '—'}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <span className={`sa-badge ${LOG_STATUS_CLASS[log.status] || 'inactive'}`}>
                              {log.status || '—'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px', fontSize: 12, color: '#688097', whiteSpace: 'nowrap' }}>
                            {fmtDateTime(log.sent_at)}
                          </td>
                          <td
                            style={{
                              padding: '10px 14px', fontSize: 11, color: '#c85a59',
                              maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}
                            title={log.error_detail || undefined}
                          >
                            {log.error_detail || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
          )
      )}</Async>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 20 }}>
          <button
            type="button"
            className="sa-btn sa-btn-ghost sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || result.loading}
          >
            ← Previous
          </button>
          <span style={{ fontSize: 13, color: '#688097' }}>Page {page} of {totalPages}</span>
          <button
            type="button"
            className="sa-btn sa-btn-ghost sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || result.loading}
          >
            Next →
          </button>
        </div>
      )}
    </>
  );
}

// ── Tab nav helper ────────────────────────────────────────────────────────────

const VIEWS = [
  { key: 'status',    path: '/admin/whatsapp',           label: '🔌 Integration Status' },
  { key: 'templates', path: '/admin/whatsapp/templates', label: '✏️ Message Templates' },
  { key: 'analytics', path: '/admin/whatsapp/analytics', label: '📊 Analytics' },
  { key: 'logs',      path: '/admin/whatsapp/logs',      label: '📋 Delivery Logs' },
];

// ── Page shell ────────────────────────────────────────────────────────────────

/**
 * SuperAdminWhatsApp — full WhatsApp Business API management page for super admins.
 * Rendered at /admin/whatsapp (and sub-paths).  `view` prop is injected by App.jsx.
 */
export default function SuperAdminWhatsApp({ user, onSignOut, view = 'status' }) {
  return (
    <AdminPage
      user={user}
      onSignOut={onSignOut}
      title="WhatsApp Integration"
      subtitle="Manage the WhatsApp Business API, edit notification message templates, and monitor delivery."
    >
      {/* ── Tab strip (links so the router handles active state) ── */}
      <nav aria-label="WhatsApp sections" style={{ display: 'flex', gap: 2, marginBottom: 24, borderBottom: '2px solid var(--sa-border, #e0eaed)', flexWrap: 'wrap' }}>
        {VIEWS.map((v) => (
          <a
            key={v.key}
            href={v.path}
            aria-current={view === v.key ? 'page' : undefined}
            style={{
              padding: '10px 18px', textDecoration: 'none', fontSize: 13,
              fontWeight: view === v.key ? 900 : 600,
              color: view === v.key ? 'var(--sa-teal, #147d81)' : 'var(--sa-muted, #688097)',
              borderBottom: `2px solid ${view === v.key ? 'var(--sa-teal, #19b7a7)' : 'transparent'}`,
              marginBottom: -2, whiteSpace: 'nowrap', display: 'inline-block',
            }}
          >
            {v.label}
          </a>
        ))}
      </nav>

      {view === 'status'    && <StatusTab />}
      {view === 'templates' && <TemplatesTab />}
      {view === 'analytics' && <AnalyticsTab />}
      {view === 'logs'      && <LogsTab />}
    </AdminPage>
  );
}
