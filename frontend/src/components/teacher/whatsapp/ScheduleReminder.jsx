import { useState, useEffect } from 'react';
import { api } from '../../../api.js';
import { useApp } from '../../../context/AppContext.jsx';

/**
 * ScheduleReminder — teacher creates a custom reminder with classroom/recipient
 * selection, IST date-time picker, and immediate-vs-scheduled toggle.
 * Calls POST /api/v1/teacher/notifications/reminders.
 */
export default function ScheduleReminder({ classrooms }) {
  const { showToast } = useApp();
  const [form, setForm] = useState({
    title: '',
    content: '',
    classroom_id: '',
    recipient_type: 'all',   // 'all' | 'specific'
    student_ids: [],
    schedule_type: 'immediate', // 'immediate' | 'scheduled'
    scheduled_at: '',
  });
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const selectedClassroom = classrooms.find((c) => c.id === Number(form.classroom_id));

  // Load students when classroom + "specific" recipients is selected
  useEffect(() => {
    if (!form.classroom_id || form.recipient_type !== 'specific') return;
    setLoadingStudents(true);
    api.classroomStudents(Number(form.classroom_id))
      .then((data) => setStudents(Array.isArray(data) ? data : data?.students || []))
      .catch(() => setStudents([]))
      .finally(() => setLoadingStudents(false));
  }, [form.classroom_id, form.recipient_type]);

  const toggleStudent = (id) => {
    setForm((f) => ({
      ...f,
      student_ids: f.student_ids.includes(id)
        ? f.student_ids.filter((s) => s !== id)
        : [...f.student_ids, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.classroom_id) { setError('Please select a classroom.'); return; }
    if (!form.title.trim()) { setError('Please enter a title.'); return; }
    if (!form.content.trim()) { setError('Please enter the reminder content.'); return; }
    if (form.schedule_type === 'scheduled' && !form.scheduled_at) {
      setError('Please select a date and time for the scheduled reminder.');
      return;
    }
    if (form.recipient_type === 'specific' && form.student_ids.length === 0) {
      setError('Please select at least one student.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.notifications.scheduleReminder({
        classroom_id: Number(form.classroom_id),
        title: form.title.trim(),
        content: form.content.trim(),
        recipient_type: form.recipient_type,
        student_ids: form.recipient_type === 'specific' ? form.student_ids : [],
        schedule_type: form.schedule_type,
        scheduled_at: form.schedule_type === 'scheduled' ? form.scheduled_at : null,
      });
      showToast(
        form.schedule_type === 'immediate'
          ? '✓ Reminder sent immediately!'
          : '✓ Reminder scheduled!'
      );
      setForm({
        title: '', content: '', classroom_id: '',
        recipient_type: 'all', student_ids: [],
        schedule_type: 'immediate', scheduled_at: '',
      });
    } catch (err) {
      setError(err.message || 'Failed to schedule reminder.');
    } finally {
      setSubmitting(false);
    }
  };

  const fieldStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1.5px solid #cde0e7', fontSize: 14, boxSizing: 'border-box',
  };
  const labelStyle = {
    display: 'block', fontSize: 13, fontWeight: 700, color: '#153e67', marginBottom: 6,
  };

  return (
    <div style={{ maxWidth: 680 }}>
      {error && (
        <div role="alert" style={{ padding: 12, background: '#ffe0e0', color: '#c00', borderRadius: 8, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Title */}
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="rem-title" style={labelStyle}>Reminder Title *</label>
          <input
            id="rem-title"
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Assignment due tomorrow"
            maxLength={255}
            style={fieldStyle}
          />
        </div>

        {/* Content */}
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="rem-content" style={labelStyle}>Reminder Content *</label>
          <textarea
            id="rem-content"
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            placeholder="Write your reminder here…"
            rows={4}
            style={{ ...fieldStyle, resize: 'vertical', fontFamily: 'inherit' }}
          />
        </div>

        {/* Classroom */}
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="rem-classroom" style={labelStyle}>Classroom *</label>
          <select
            id="rem-classroom"
            value={form.classroom_id}
            onChange={(e) => setForm((f) => ({ ...f, classroom_id: e.target.value, student_ids: [] }))}
            style={{ ...fieldStyle, color: '#153e67', background: 'white' }}
          >
            <option value="">Select a classroom…</option>
            {classrooms.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — Grade {c.grade} · {c.subject}
              </option>
            ))}
          </select>
        </div>

        {/* Recipient selector */}
        {form.classroom_id && (
          <div style={{ marginBottom: 16 }}>
            <div style={labelStyle}>Recipients</div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {[
                { value: 'all', label: `All students in ${selectedClassroom?.name || 'classroom'}` },
                { value: 'specific', label: 'Specific students' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}
                >
                  <input
                    type="radio"
                    name="recipient_type"
                    value={opt.value}
                    checked={form.recipient_type === opt.value}
                    onChange={() => setForm((f) => ({ ...f, recipient_type: opt.value, student_ids: [] }))}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Specific student picker */}
        {form.classroom_id && form.recipient_type === 'specific' && (
          <div style={{
            marginBottom: 16, padding: 12, background: '#f7fafc',
            borderRadius: 8, border: '1px solid #e0eaed', maxHeight: 200, overflowY: 'auto',
          }}>
            {loadingStudents ? (
              <p style={{ color: '#688097', fontSize: 13, margin: 0 }}>Loading students…</p>
            ) : students.length === 0 ? (
              <p style={{ color: '#688097', fontSize: 13, margin: 0 }}>No students found in this classroom.</p>
            ) : (
              students.map((s) => (
                <label
                  key={s.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', cursor: 'pointer', fontSize: 13 }}
                >
                  <input
                    type="checkbox"
                    checked={form.student_ids.includes(s.id)}
                    onChange={() => toggleStudent(s.id)}
                  />
                  {s.name}
                </label>
              ))
            )}
          </div>
        )}

        {/* Immediate vs scheduled toggle */}
        <div style={{ marginBottom: 16 }}>
          <div style={labelStyle}>Delivery</div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {[
              { value: 'immediate', label: '⚡ Send immediately' },
              { value: 'scheduled', label: '🕐 Schedule for later' },
            ].map((opt) => (
              <label
                key={opt.value}
                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}
              >
                <input
                  type="radio"
                  name="schedule_type"
                  value={opt.value}
                  checked={form.schedule_type === opt.value}
                  onChange={() => setForm((f) => ({ ...f, schedule_type: opt.value, scheduled_at: '' }))}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {/* Date/time picker (IST) */}
        {form.schedule_type === 'scheduled' && (
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="rem-scheduled-at" style={labelStyle}>
              Date & Time{' '}
              <span style={{ fontWeight: 400, color: '#688097' }}>(enter in IST — Asia/Kolkata, UTC+5:30)</span>
            </label>
            <input
              id="rem-scheduled-at"
              type="datetime-local"
              value={form.scheduled_at}
              onChange={(e) => setForm((f) => ({ ...f, scheduled_at: e.target.value }))}
              min={new Date().toISOString().slice(0, 16)}
              style={{ padding: '10px 12px', borderRadius: 8, border: '1.5px solid #cde0e7', fontSize: 14 }}
            />
            <p style={{ fontSize: 11, color: '#9aabb5', marginTop: 4 }}>
              Enter the time in Indian Standard Time (IST, UTC+5:30).
            </p>
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
          {submitting
            ? 'Sending…'
            : form.schedule_type === 'immediate'
            ? '⚡ Send Reminder Now'
            : '🕐 Schedule Reminder'}
        </button>
      </form>
    </div>
  );
}
