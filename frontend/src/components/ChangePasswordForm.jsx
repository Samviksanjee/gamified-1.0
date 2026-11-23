import { useState } from 'react';
import { adminApi } from '../api.js';
import { passwordStrength } from './SuperAdmin/InviteTeacherForm.jsx';

/** Shared by the first-login gate and the Settings page. Calls POST /auth/change-password. */
export default function ChangePasswordForm({ onDone, submitLabel = 'Update password' }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const strength = { label: ['Too short', 'Weak', 'Fair', 'Good', 'Strong'][passwordStrength(next)] };
  const mismatch = confirm && confirm !== next;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!current) return setError('Enter your current password.');
    if (next.length < 8) return setError('The new password must be at least 8 characters.');
    if (next !== confirm) return setError('The new passwords do not match.');
    if (next === current) return setError('Choose a password different from the current one.');
    setBusy(true);
    try {
      await adminApi.changePassword(current, next);
      setCurrent(''); setNext(''); setConfirm('');
      onDone?.();
    } catch (err) { setError(err.message || 'The password could not be changed.'); } finally { setBusy(false); }
  };

  const type = show ? 'text' : 'password';
  return (
    <form onSubmit={submit} noValidate style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
      <label className="sa-field">Current (temporary) password
        <input type={type} value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
      </label>
      <label className="sa-field">New password
        <input type={type} value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" aria-describedby="cp-strength" />
      </label>
      <div id="cp-strength" className="sa-kpi-note" aria-live="polite">{next ? `Strength: ${strength.label}` : 'Use at least 8 characters with letters and numbers.'}</div>
      <label className="sa-field">Confirm new password
        <input type={type} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" aria-invalid={!!mismatch} />
      </label>
      {mismatch && <div className="sa-kpi-note" role="alert">Passwords do not match.</div>}
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> Show passwords</label>
      {error && <div className="sa-alert" role="alert">{error}</div>}
      <button type="submit" className="sa-btn sa-btn-primary" disabled={busy}>{busy ? 'Saving…' : submitLabel}</button>
    </form>
  );
}
