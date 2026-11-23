import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

/**
 * StudentLayout — persistent shell that wraps all student routes.
 * Stays mounted on every navigation → no full-page remounts.
 * Uses NavLink so active states are driven by the router, not hardcoded booleans.
 */
export default function StudentLayout({ user, onSignOut }) {
  const navigate   = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close drawer whenever the route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const navLinks = [
    { label: 'Home',          to: '/'               },
    { label: 'My Learning',   to: '/learning'        },
    { label: 'Resources',     to: '/resources'       },
    { label: 'Dashboard',     to: '/dashboard'       },
    { label: 'Join Class',    to: '/join-classroom'  },
    { label: 'Notifications', to: '/notifications'   },
  ];

  // NavLink className helper — active when path matches exactly for '/', otherwise prefix-match
  const linkClass = ({ isActive }) => isActive ? 'sl-navlink active' : 'sl-navlink';

  return (
    <div className="app">
      {/* ── Topbar ───────────────────────────────────────────────── */}
      <header className="topbar">
        {/* Brand */}
        <button
          className="brand sl-brand-btn"
          onClick={() => navigate('/')}
          aria-label="Go to home"
        >
          Gamifi<span>ED</span>
        </button>

        {/* Desktop nav — hidden on mobile via CSS */}
        <nav className="nav sl-desktop-nav" aria-label="Student navigation">
          {navLinks.map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={linkClass}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Right side: avatar + sign out + hamburger */}
        <div className="sl-topbar-right">
          <div className="sl-avatar" aria-hidden="true">
            {(user?.name?.[0] || 'S').toUpperCase()}
          </div>
          <span className="sl-username">{user?.name}</span>
          <button className="btn btn-soft sl-signout-btn" onClick={onSignOut}>
            Sign out
          </button>
          {/* Hamburger — visible on mobile only */}
          <button
            className="menu-toggle"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {/* ── Mobile drawer overlay ─────────────────────────────────── */}
      {menuOpen && (
        <div
          className="sl-overlay"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile drawer ─────────────────────────────────────────── */}
      <nav
        className={`sl-drawer${menuOpen ? ' open' : ''}`}
        aria-label="Mobile navigation"
      >
        <div className="sl-drawer-header">
          <span className="brand">Gamifi<span>ED</span></span>
          <button
            className="menu-toggle"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <div className="sl-drawer-user">
          <div className="sl-avatar sl-avatar-lg" aria-hidden="true">
            {(user?.name?.[0] || 'S').toUpperCase()}
          </div>
          <div>
            <div className="sl-drawer-name">{user?.name}</div>
            <div className="sl-drawer-role">Student</div>
          </div>
        </div>

        <div className="sl-drawer-links">
          {navLinks.map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `sl-drawer-link${isActive ? ' active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </NavLink>
          ))}
        </div>

        <button className="btn btn-soft sl-drawer-signout" onClick={onSignOut}>
          Sign out
        </button>
      </nav>

      {/* ── Page content rendered by nested routes ────────────────── */}
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
