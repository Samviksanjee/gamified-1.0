import { useApp } from '../../context/AppContext';
import AdminPage from '../../components/SuperAdmin/AdminPage.jsx';
import ChangePasswordForm from '../../components/ChangePasswordForm.jsx';
import { Panel } from '../../components/SuperAdmin/ui.jsx';

export default function SuperAdminSettings({ user, onSignOut }) {
  const { showToast } = useApp();
  return (
    <AdminPage user={user} onSignOut={onSignOut} title="Settings" subtitle="Your administrator account">
      <div className="sa-grid two" style={{ alignItems: 'start' }}>
        <Panel title="Profile">
          <dl style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '8px 16px', margin: 0 }}>
            <dt>Name</dt><dd style={{ margin: 0 }}>{user?.name || '—'}</dd>
            <dt>Email</dt><dd style={{ margin: 0 }}>{user?.email || '—'}</dd>
            <dt>Role</dt><dd style={{ margin: 0 }}>Super Admin</dd>
          </dl>
        </Panel>
        <Panel title="Change password" subtitle="You will stay signed in on this device.">
          <ChangePasswordForm onDone={() => showToast('✓ Password updated')} />
        </Panel>
      </div>
    </AdminPage>
  );
}
