import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ADMIN_NAV, adminInitials, findActive, isGroupActive } from './adminNav.js';
import { ChevronDownIcon, LogoutIcon } from './icons.jsx';

/** Vertical navigation with expandable groups. Collapsed: one icon per group (opens its first page), labels become tooltips. */
export default function SuperAdminSidebar({ pathname, search, adminName, onNavigate, onSignOut, collapsed, id }) {
  const active = findActive(pathname, search);
  const [open, setOpen] = useState({});
  const expanded = (item) => open[item.id] ?? isGroupActive(item, active);

  return (
    <aside className="sa-sidebar" id={id} aria-label="Super Admin navigation">
      <Link to="/admin" className="sa-brand" onClick={onNavigate} aria-label="GamifiED Super Admin home">
        <span className="sa-brand-mark" aria-hidden="true">G<span>E</span></span>
        <span className="sa-brand-text">Gamifi<span>ED</span></span>
      </Link>

      <nav className="sa-nav">
        <div className="sa-nav-label">Super Admin</div>
        {ADMIN_NAV.map((item) => {
          const groupActive = isGroupActive(item, active);
          if (!item.children) {
            return (
              <Link key={item.id} to={item.path} className="sa-link sa-tip" data-tip={item.label} aria-current={groupActive ? 'page' : undefined}
                aria-label={collapsed ? item.label : undefined} onClick={onNavigate}>
                <item.Icon /><span className="sa-link-text">{item.label}</span>
              </Link>
            );
          }
          if (collapsed) {
            return (
              <Link key={item.id} to={item.children[0].path} className="sa-link sa-tip" data-tip={item.label} aria-current={groupActive ? 'page' : undefined}
                aria-label={item.label} onClick={onNavigate}>
                <item.Icon /><span className="sa-link-text">{item.label}</span>
              </Link>
            );
          }
          const isOpen = expanded(item);
          return (
            <div key={item.id} className="sa-group">
              <button type="button" className={`sa-link${groupActive ? ' is-group-active' : ''}`} aria-expanded={isOpen} aria-controls={`sa-sub-${item.id}`}
                onClick={() => setOpen((o) => ({ ...o, [item.id]: !isOpen }))}>
                <item.Icon /><span className="sa-link-text" style={{ flex: 1 }}>{item.label}</span>
                <ChevronDownIcon size={16} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
              </button>
              {isOpen && (
                <div className="sa-sublinks" id={`sa-sub-${item.id}`}>
                  {item.children.map((child) => (
                    <Link key={child.path} to={child.path} className="sa-sublink" aria-current={active.path === child.path ? 'page' : undefined} onClick={onNavigate}>{child.label}</Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="sa-sidebar-foot">
        <div className="sa-profile sa-tip" data-tip={adminName}>
          <span className="sa-avatar" aria-hidden="true">{adminInitials(adminName)}</span>
          <span className="sa-profile-text"><strong>{adminName}</strong><small>Super Admin</small></span>
        </div>
        <button type="button" className="sa-link sa-tip is-danger" data-tip="Sign out" onClick={onSignOut} aria-label={collapsed ? 'Sign out' : undefined}>
          <LogoutIcon /><span className="sa-link-text">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
