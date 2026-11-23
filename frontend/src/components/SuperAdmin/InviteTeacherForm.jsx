import { useId, useState } from 'react';
import { adminApi } from '../../api.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 0-4: length, mixed case, a digit, a symbol. Only a hint for the admin; the server enforces the real rules. */
export function passwordStrength(password) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (password.length < 8) score = Math.min(score, 1);
  return score;
}
const LEVELS = [['Too short', '#e26d6d'], ['Weak', '#e26d6d'], ['Fair', '#f59e0b'], ['Good', '#84cc16'], ['Strong', '#22c55e']];

export function validateInvite({ name, email, password, confirm }) {
  const errors = {};
  if (!name.trim()) errors.name = 'Full name is required.';
  if (!email.trim()) errors.email = 'Email address is required.';
  else if (!EMAIL.test(email.trim())) errors.email = 'Enter a valid email address, for example teacher@school.com.';
  if (!password) errors.password = 'A temporary password is required.';
  else if (password.length < 8) errors.password = 'The password must be at least 8 characters.';
  if (!confirm) errors.confirm = 'Please confirm the password.';
  else if (confirm !== password) errors.confirm = 'The two passwords do not match.';
  return errors;
}

/**
 * Creates a teacher with a temporary password. The teacher must choose their own password at first login.
 * The password only travels to the server over the API call; it is never stored, logged or shown again.
 */
export default function InviteTeacherForm({ onCreated, onCancel, notify }) {
  const uid = useId();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const strength = passwordStrength(form.password);
  const set = (key) => (e) => { setForm((f) => ({ ...f, [key]: e.target.value })); setErrors((x) => ({ ...x, [key]: undefined })); setFormError(''); };

  const submit = async (e) => {
    e.preventDefault();
    const found = validateInvite(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true); setFormError('');
    try {
      const response = await adminApi.inviteTeacher({ name: form.name.trim(), email: form.email.trim(), temporary_password: form.password, confirm_password: form.confirm });
      setForm({ name: '', email: '', password: '', confirm: '' });
      notify?.(`✓ Teacher account created for ${response.email}. They must change the password at first login.`);
      onCreated?.(response);
    } catch (err) {
      const message = err.message || 'Could not create the teacher.';
      if (/already/i.test(message)) setErrors({ email: message }); else setFormError(message);
    } finally { setBusy(false); }
  };

  const field = (key, label, type, extra = {}) => (
    <div className={`sa-field${errors[key] ? ' invalid' : ''}`}>
      <label htmlFor={`${uid}-${key}`}>{label}</label>
      <input id={`${uid}-${key}`} type={type} value={form[key]} onChange={set(key)} disabled={busy} required aria-invalid={Boolean(errors[key])}
        aria-describedby={errors[key] ? `${uid}-${key}-err` : undefined} {...extra} />
      {errors[key] && <span className="sa-err" id={`${uid}-${key}-err`} role="alert">{errors[key]}</span>}
    </div>
  );

  return (
    <form onSubmit={submit} noValidate style={{ display: 'grid', gap: 14 }} aria-label="Invite teacher">
      {field('name', 'Full name', 'text', { autoComplete: 'off', placeholder: 'Priya Nair' })}
      {field('email', 'Email address', 'email', { autoComplete: 'off', placeholder: 'teacher@school.com' })}
      <div>
        {field('password', 'Temporary password', show ? 'text' : 'password', { autoComplete: 'new-password' })}
        <div className="sa-strength" aria-hidden="true">{[1, 2, 3, 4].map((n) => <span key={n} style={{ background: form.password && strength >= n ? LEVELS[strength][1] : undefined }} />)}</div>
        <div className="sa-kpi-note" role="status" aria-live="polite" style={{ marginTop: 4 }}>
          {form.password ? `Password strength: ${LEVELS[strength][0]}` : 'At least 8 characters. Mix letters, numbers and symbols for a stronger password.'}
        </div>
      </div>
      {field('confirm', 'Confirm password', show ? 'text' : 'password', { autoComplete: 'new-password' })}
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, fontWeight: 700, color: '#4f6a80' }}>
        <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> Show passwords
      </label>
      <p className="sa-kpi-note" style={{ margin: 0 }}>The teacher signs in with this temporary password and is asked to choose their own straight away. Share it securely; it is not shown again.</p>
      {formError && <div className="sa-alert" role="alert" style={{ margin: 0 }}><span aria-hidden="true">⚠️</span><div>{formError}</div></div>}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        {onCancel && <button type="button" className="sa-btn sa-btn-ghost" onClick={onCancel} disabled={busy}>Cancel</button>}
        <button type="submit" className="sa-btn sa-btn-primary" disabled={busy} aria-busy={busy}>{busy ? 'Creating…' : 'Create teacher'}</button>
      </div>
    </form>
  );
}
