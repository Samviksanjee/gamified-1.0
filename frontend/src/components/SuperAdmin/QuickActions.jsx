import { useNavigate } from 'react-router-dom';
import { LogIcon, MailIcon, MailPlusIcon, TeachersIcon } from './icons.jsx';

// Same routes as before: Invite Teacher and View Invitations both open the invitations page.
const ACTIONS = [
  { label: 'Invite Teacher', hint: 'Send a sign-up invitation', path: '/admin/invitations', Icon: MailPlusIcon },
  { label: 'View Teachers', hint: 'Manage teacher accounts', path: '/admin/teachers', Icon: TeachersIcon },
  { label: 'View Invitations', hint: 'Pending and expired', path: '/admin/invitations', Icon: MailIcon },
  { label: 'Audit Logs', hint: 'System activity history', path: '/admin/audit-logs', Icon: LogIcon },
];

export default function QuickActions() {
  const navigate = useNavigate();
  return (
    <section className="sa-section" aria-labelledby="sa-quick-actions">
      <h2 className="sa-section-title" id="sa-quick-actions">Quick Actions</h2>
      <div className="sa-actions">
        {ACTIONS.map(({ label, hint, path, Icon }) => (
          <button key={label} type="button" className="sa-action" onClick={() => navigate(path)}>
            <span className="sa-action-icon"><Icon size={20} /></span>
            <span>{label}<small>{hint}</small></span>
          </button>
        ))}
      </div>
    </section>
  );
}
