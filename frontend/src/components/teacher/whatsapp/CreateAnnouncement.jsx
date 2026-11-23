import { useState } from 'react';
import { api } from '../../../api.js';
import { useApp } from '../../../context/AppContext.jsx';

/**
 * CreateAnnouncement — lets a teacher pick a classroom, write a title + body,
 * preview the recipient count and WhatsApp message, then publish.
 * Calls POST /api/v1/teacher/notifications/announcements.
 */
export default function CreateAnnouncement({ classrooms }) {
  const { showToast } = useApp();
  const [form, setForm] = useState({ classroom_id: '', title: '', body: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const selectedClassroom = classrooms.find((c) => c.id === Number(form.classroom_id));
  const recipientCount = selectedClassroom?.students_count ?? 0;

  const messagePreview =
    form.title && form.body && selectedClassroom
      ? `Hello [Student Name]!\n\nYour teacher has posted a new announcement in GamifiEd.\n\nClassroom: ${selectedClassroom.name}\nTitle: ${form.title}\n\n${form.body}\n\n- Team GamifiEd`
      : '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.classroom_id) { setError('Please select a classroom.'); return; }
    if (!form.title.trim()) { setError('Please enter a title.'); return; }
    if (!form.body.trim()) { setError('Please enter the announcement body.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await api.notifications.createAnnouncement({
        classroom_id: Number(form.classroom_id),
        title: form.title.trim(),
        body: form.body.trim(),
      });
      showToast('✓ Announcement published and notifications queued!');
      setForm({ classroom_id: '', title: '', body: '' });
    } catch (err) {
      setError(err.message || 'Failed to publish announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 680 }}>
      {error && (
        <div role="alert" style={{ padding: 12, background: '#ffe0e0', color: '#c00', borderRadius: 8, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Classroom selector */}
        <div style={{ marginBottom: 16 }}>
          <label
            htmlFor="ann-classroom"
            style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#153e67', marginBottom: 6 }}
          >
            Classroom *
          </label>
          <select
            id="ann-classroom"
            value={form.classroom_id}
            onChange={(e) => setForm((f) => ({ ...f, classroom_id: e.target.value }))}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8,
              border: '1.5px solid #cde0e7', fontSize: 14, color: '#153e67', background: 'white',
            }}
          >
            <option value="">Select a classroom…</option>
            {classrooms.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — Grade {c.grade} · {c.subject} ({c.students_count ?? 0} students)
              </option>
            ))}
          </select>
        </div>

        {/* Recipient count preview */}
        {selectedClassroom && (
          <div style={{
            padding: '10px 14px', background: '#eaf7f7', borderRadius: 8,
            marginBottom: 16, fontSize: 13, color: '#147d81',
          }}>
            📱 This announcement will notify{' '}
            <strong>{recipientCount} student{recipientCount !== 1 ? 's' : ''}</strong>{' '}
            who have WhatsApp notifications enabled.
          </div>
        )}

        {/* Title */}
        <div style={{ marginBottom: 16 }}>
          <label
            htmlFor="ann-title"
            style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#153e67', marginBottom: 6 }}
          >
            Title *
          </label>
          <input
            id="ann-title"
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Important exam notice"
            maxLength={255}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8,
              border: '1.5px solid #cde0e7', fontSize: 14, boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Body */}
        <div style={{ marginBottom: 16 }}>
          <label
            htmlFor="ann-body"
            style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#153e67', marginBottom: 6 }}
          >
            Announcement Body *
          </label>
          <textarea
            id="ann-body"
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            placeholder="Write your announcement here…"
            rows={5}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8,
              border: '1.5px solid #cde0e7', fontSize: 14, resize: 'vertical',
              fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Message preview */}
        {messagePreview && (
          <div style={{ marginBottom: 20 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: '#688097', marginBottom: 8,
              textTransform: 'uppercase', letterSpacing: '0.6px',
            }}>
              WhatsApp Message Preview
            </div>
            <div style={{
              background: '#f0f7f0', border: '1px solid #c5e0c5', borderRadius: 12,
              padding: '14px 16px', fontSize: 13, lineHeight: 1.7, color: '#2d4a2d',
              whiteSpace: 'pre-wrap',
            }}>
              {messagePreview}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '12px 24px',
            background: submitting ? '#a0cbc8' : 'linear-gradient(100deg, #19b7a7, #079c98)',
            color: 'white', border: 'none', borderRadius: 999,
            fontWeight: 900, fontSize: 14,
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? 'Publishing…' : '📢 Publish Announcement'}
        </button>
      </form>
    </div>
  );
}
