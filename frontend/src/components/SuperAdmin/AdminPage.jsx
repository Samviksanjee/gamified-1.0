import SuperAdminLayout from './SuperAdminLayout.jsx';
import AdminPageHeader from './AdminPageHeader.jsx';

/** Every Super Admin page: shell + title row. `actions` sit at the right of the title (stacked on mobile). */
export default function AdminPage({ user, onSignOut, title, subtitle, actions, children }) {
  return (
    <SuperAdminLayout user={user} onSignOut={onSignOut}>
      <AdminPageHeader title={title} subtitle={subtitle} action={actions} />
      {children}
    </SuperAdminLayout>
  );
}
