import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../api.js';

/**
 * NotificationHistory — paginated table of sent notifications for the teacher.
 * Columns: type, classroom, recipients, delivered, failed, scheduled_at, sent_at, status
 * Calls GET /api/v1/teacher/notifications/history
 */
const STATUS_STYLE = {
  sent:    { bg: '#e5f8eb', fg: '#238650' },
  queued:  { bg: '#fff7dc', fg: '#a77818' },
  failed:  { bg: '#ffe9e7', fg: '#c85a59' },
  skipped: { bg: '#f0f4f6', fg: '#688097' },
};

const TYPE_LABEL = {
  announcement:        '📢 Announcement',
  game_published:      '🎮 Game Published',
  assignment:          '📋 Assignment',
  assignment_reminder: '⏰ Assignment Reminder',
  event:               '📅 Event',
  event_reminder:      '🔔 Event Reminder',
  custom_reminder:     '✉️ Custom Reminder',
};

function fmt(isoStr) {
  if (!isoStr) return '—';
  try {
    return new Date(isoStr).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return isoStr; }
}

export default function NotificationHistory() {
  const [logs, setLogs]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const pageSize = 20;

  const load = useCallback(async (p) => {
    setLoading(true);
    setError('');
    try {
      const data = await api.notifications.history(p, pageSize);
      setLogs(data.logs ?? data.items ?? data.results ?? []);
      setTotal(data.total ?? data.count ?? 0);
    } catch (err) {
      setError(err.message || 'Failed to load notification history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(page); }, [page, load]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      {error && (
        <div role="alert" style={{ padding: 12, background: '#ffe0e0', color: '#c00', borderRadius: 8, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: '#688097', textAlign: 'center', padding: '32px 0' }}>Loading history…</p>
      ) : logs.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '40px 20px',
          background: '#f7fafc', borderRadius: 12, border: '1px dashed #cde0e7',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <p style={{ color: '#688097', margin: 0 }}>No notifications sent yet.</p>
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720, fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e0eaed', background: '#f7fafc' }}>
                  {['Type', 'Classroom', 'Recipients', 'Delivered', 'Failed', 'Scheduled At', 'Sent At', 'Status'].map((h) => (
                    <th key={h} style={{
                      padding: '10px 12px', textAlign: 'left',
                      fontSize: 10, fontWeight: 900, color: '#7890a0',
                      textTransform: 'uppercase', letterSpacing: '0.6px',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((row, idx) => {
                  const statusKey = (row.status || 'queued').toLowerCase();
                  const st = STATUS_STYLE[statusKey] || STATUS_STYLE.queued;
                  return (
                    <tr key={row.id ?? idx} style={{ borderBottom: '1px solid #edf2f3' }}>
                      <td style={{ padding: '11px 12px', color: '#153e67', fontWeight: 700 }}>
                        {TYPE_LABEL[row.trigger_type] || row.trigger_type || '—'}
                        {row.reminder_stage && (
                          <div style={{ fontSize: 11, color: '#688097', marginTop: 2 }}>
                            {row.reminder_stage}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '11px 12px', color: '#153e67' }}>
                        {row.classroom_name || row.classroom_id || '—'}
                      </td>
                      <td style={{ padding: '11px 12px', color: '#153e67', textAlign: 'center' }}>
                        {row.recipients ?? row.recipient_count ?? '—'}
                      </td>
                      <td style={{ padding: '11px 12px', color: '#238650', textAlign: 'center', fontWeight: 700 }}>
                        {row.delivered ?? '—'}
                      </td>
                      <td style={{ padding: '11px 12px', color: '#c85a59', textAlign: 'center', fontWeight: 700 }}>
                        {row.failed ?? '—'}
                      </td>
                      <td style={{ padding: '11px 12px', color: '#688097', fontSize: 12 }}>
                        {fmt(row.scheduled_at)}
                      </td>
                      <td style={{ padding: '11px 12px', color: '#688097', fontSize: 12 }}>
                        {fmt(row.sent_at)}
                      </td>
                      <td style={{ padding: '11px 12px' }}>
                        <span style={{
                          display: 'inline-block', padding: '3px 10px',
                          borderRadius: 999, fontSize: 11, fontWeight: 900,
                          background: st.bg, color: st.fg,
                          textTransform: 'capitalize',
                        }}>
                          {statusKey}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginTop: 16, flexWrap: 'wrap', gap: 8,
          }}>
            <span style={{ fontSize: 12, color: '#688097' }}>
              Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{
                  padding: '8px 16px', borderRadius: 999, border: '1px solid #cde0e7',
                  background: page <= 1 ? '#f0f4f6' : 'white',
                  color: page <= 1 ? '#9aabb5' : '#153e67',
                  fontWeight: 900, fontSize: 12, cursor: page <= 1 ? 'not-allowed' : 'pointer',
                }}
              >
                ← Prev
              </button>
              <span style={{ padding: '8px 12px', fontSize: 12, color: '#153e67', fontWeight: 700 }}>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                style={{
                  padding: '8px 16px', borderRadius: 999, border: '1px solid #cde0e7',
                  background: page >= totalPages ? '#f0f4f6' : 'white',
                  color: page >= totalPages ? '#9aabb5' : '#153e67',
                  fontWeight: 900, fontSize: 12, cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                }}
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
