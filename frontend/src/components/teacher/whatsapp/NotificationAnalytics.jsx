import { useState, useEffect } from 'react';
import { api } from '../../../api.js';

/**
 * NotificationAnalytics — delivery KPI counts for the teacher's classrooms.
 * Shows sent / delivered / failed / pending, plus opt-in / opt-out student counts.
 * Calls GET /api/v1/teacher/notifications/analytics
 */
const KPI_CONFIG = [
  { key: 'sent',         label: 'Sent',       emoji: '📤', bg: '#eaf7f7',  fg: '#13867f' },
  { key: 'delivered',    label: 'Delivered',  emoji: '✅', bg: '#e5f8eb',  fg: '#238650' },
  { key: 'failed',       label: 'Failed',     emoji: '❌', bg: '#ffe9e7',  fg: '#c85a59' },
  { key: 'pending',      label: 'Pending',    emoji: '⏳', bg: '#fff7dc',  fg: '#a77818' },
  { key: 'opted_in',     label: 'Opted In',   emoji: '📱', bg: '#e9f0ff',  fg: '#2563b4' },
  { key: 'opted_out',    label: 'Opted Out',  emoji: '🔕', bg: '#f5f5f5',  fg: '#688097' },
];

export default function NotificationAnalytics() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api.notifications.analytics()
      .then((d) => setData(d))
      .catch((err) => setError(err.message || 'Failed to load analytics.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p style={{ color: '#688097', textAlign: 'center', padding: '32px 0' }}>Loading analytics…</p>;
  }

  if (error) {
    return (
      <div role="alert" style={{ padding: 12, background: '#ffe0e0', color: '#c00', borderRadius: 8 }}>
        {error}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: 14,
        marginBottom: 24,
      }}>
        {KPI_CONFIG.map(({ key, label, emoji, bg, fg }) => {
          const val = data[key] ?? data.counts?.[key] ?? 0;
          return (
            <div key={key} style={{
              background: bg,
              borderRadius: 14,
              padding: '18px 16px',
              textAlign: 'center',
              border: '1px solid transparent',
            }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{emoji}</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: fg, lineHeight: 1 }}>
                {typeof val === 'number' ? val.toLocaleString() : val ?? '—'}
              </div>
              <div style={{ fontSize: 11, color: fg, opacity: 0.8, marginTop: 4, fontWeight: 700 }}>
                {label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Delivery rate bar */}
      {(data.sent ?? 0) > 0 && (
        <div style={{
          background: 'white', border: '1px solid #e0eaed', borderRadius: 14, padding: '18px 20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
            <span style={{ fontWeight: 700, color: '#153e67' }}>Delivery rate</span>
            <span style={{ fontWeight: 900, color: '#153e67' }}>
              {Math.round(((data.delivered ?? 0) / (data.sent ?? 1)) * 100)}%
            </span>
          </div>
          <div style={{ background: '#e6eff1', height: 10, borderRadius: 20, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.round(((data.delivered ?? 0) / (data.sent ?? 1)) * 100)}%`,
              background: 'linear-gradient(90deg, #16b4a5, #3bb5d8)',
              borderRadius: 20,
              transition: 'width .4s',
            }} />
          </div>
        </div>
      )}

      {/* Empty state when no data yet */}
      {(data.sent ?? 0) === 0 && (
        <div style={{
          textAlign: 'center', padding: '32px 20px',
          background: '#f7fafc', borderRadius: 12, border: '1px dashed #cde0e7',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <p style={{ color: '#688097', margin: 0 }}>
            No notifications sent yet — analytics will appear after the first delivery.
          </p>
        </div>
      )}
    </div>
  );
}
