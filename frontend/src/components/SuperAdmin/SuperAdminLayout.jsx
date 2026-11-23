import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SuperAdminSidebar from './SuperAdminSidebar.jsx';
import SuperAdminHeader from './SuperAdminHeader.jsx';
import '../../styles/superadmin-shell.css';

const COLLAPSE_KEY = 'superadmin_sidebar_collapsed';
const SIDEBAR_ID = 'superadmin-sidebar';

const initialCollapsed = () => {
  try {
    const saved = localStorage.getItem(COLLAPSE_KEY);
    if (saved !== null) return saved === '1';
  } catch { /* storage unavailable */ }
  return typeof window !== 'undefined' && window.innerWidth <= 1100;   // tablets start with the compact sidebar
};

/**
 * The one Super Admin application shell: [ sidebar | header + page content ].
 * Every Super Admin page renders inside this component, so alignment is identical everywhere.
 */
export default function SuperAdminLayout({ user, onSignOut, children }) {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const adminName = user?.name || 'Super Admin';

  const toggleCollapse = () => setCollapsed((value) => {
    try { localStorage.setItem(COLLAPSE_KEY, value ? '0' : '1'); } catch { /* ignore */ }
    return !value;
  });
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  // Behaviour unchanged from the previous nav: clear the token, notify the app, go to the admin entry page.
  const signOut = () => {
    localStorage.removeItem('gamified_token');
    onSignOut?.();
    navigate('/admin/setup');
  };

  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  // While the mobile drawer is open: no background scrolling, and Escape closes it.
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event) => { if (event.key === 'Escape') setDrawerOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', onKey); };
  }, [drawerOpen]);

  return (
    <div className={`sa-shell${collapsed ? ' is-collapsed' : ''}${drawerOpen ? ' is-drawer-open' : ''}`} data-testid="superadmin-shell">
      <SuperAdminSidebar id={SIDEBAR_ID} pathname={pathname} search={search} adminName={adminName} collapsed={collapsed} onNavigate={closeDrawer} onSignOut={signOut} />
      <div className="sa-scrim" onClick={closeDrawer} aria-hidden="true" />
      <div className="sa-body">
        <SuperAdminHeader pathname={pathname} search={search} adminName={adminName} collapsed={collapsed} drawerOpen={drawerOpen} sidebarId={SIDEBAR_ID}
          onToggleCollapse={toggleCollapse} onOpenDrawer={() => setDrawerOpen(true)} onSignOut={signOut} />
        <main className="sa-main" id="superadmin-main">
          <div className="sa-content">{children}</div>
        </main>
      </div>
    </div>
  );
}
