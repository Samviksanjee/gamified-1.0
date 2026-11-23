import ChangePasswordForm from '../components/ChangePasswordForm.jsx';

/** Shown instead of the app while an account still uses an administrator-issued temporary password. */
export default function FirstLoginPasswordPage({ user, onChanged, onSignOut }) {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16, background: '#f6f8fb' }}>
      <section aria-labelledby="first-login-title" style={{ background: '#fff', borderRadius: 16, padding: 28, width: 'min(480px, 100%)', boxShadow: '0 8px 30px rgba(20,40,80,.08)' }}>
        <h1 id="first-login-title" style={{ marginTop: 0, fontSize: 24 }}>Set your own password</h1>
        <p style={{ color: '#5b6577' }}>
          Welcome{user?.name ? `, ${user.name}` : ''}. Your account was created with a temporary password. Choose a new one to continue.
        </p>
        <ChangePasswordForm submitLabel="Save and continue" onDone={onChanged} />
        <button type="button" onClick={onSignOut} className="sa-btn sa-btn-ghost" style={{ marginTop: 12 }}>Sign out</button>
      </section>
    </main>
  );
}
