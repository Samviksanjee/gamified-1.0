import { adminInitials, findActive } from './adminNav.js';
import { ChevronsLeftIcon, ChevronsRightIcon, LogoutIcon, MenuIcon } from './icons.jsx';

/** Top bar: page title/breadcrumb on the left, admin identity + sign out on the right. */
export default function SuperAdminHeader({ pathname, search, adminName, collapsed, drawerOpen, sidebarId, onToggleCollapse, onOpenDrawer, onSignOut }) {
  const page = findActive(pathname, search);
  return (
    <header className="sa-header">
      <div className="sa-header-left">
        <button type="button" className="sa-icon-btn sa-only-mobile" onClick={onOpenDrawer}
          aria-label="Open navigation menu" aria-expanded={drawerOpen} aria-controls={sidebarId}>
          <MenuIcon />
        </button>
        <button type="button" className="sa-icon-btn sa-only-desktop" onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!collapsed} aria-controls={sidebarId}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? <ChevronsRightIcon /> : <ChevronsLeftIcon />}
        </button>
        <div className="sa-header-title">
          <div className="sa-crumb">Super Admin{page.groupLabel ? ` / ${page.groupLabel}` : ""} / <b>{page.label}</b></div>
          <h2>{page.label}</h2>
        </div>
      </div>

      <div className="sa-header-right">
        <div className="sa-header-user">
          <span className="sa-avatar" aria-hidden="true">{adminInitials(adminName)}</span>
          <span className="sa-header-user-text">
            <strong>{adminName}</strong>
            <small>Super Admin</small>
          </span>
        </div>
        <button type="button" className="sa-btn sa-btn-ghost sa-header-signout" onClick={onSignOut} aria-label="Sign out">
          <LogoutIcon size={18} /><span>Sign out</span>
        </button>
      </div>
    </header>
  );
}
