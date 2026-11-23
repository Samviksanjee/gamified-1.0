import { useNavigate } from 'react-router-dom';

export default function Sidebar({ activePage, onNavigate, draftCount = 0, isOpen, onClose }) {
  const navigate = useNavigate();

  const pages = [
    { id: 'dashboard',     icon: '▦',  label: 'Overview',              path: '/teacher' },
    { id: 'classes',       icon: '🏫', label: 'My classes',             path: '/classes' },
    { id: 'create',        icon: '✨', label: 'Create REPLAY',          path: '/create' },
    { id: 'drafts',        icon: '📝', label: 'AI drafts',              path: '/drafts', badge: draftCount },
    { id: 'analytics',     icon: '📈', label: 'Student progress',       path: '/analytics' },
    { id: 'notifications', icon: '📱', label: 'WhatsApp Notifications', path: '/notifications' },
  ];

  const quickAccess = [
    { id: 'join',      icon: '🔑', label: 'Student join page', path: '/join' },
    { id: 'resources', icon: '📚', label: 'Published REPLAYs', path: '/resources' },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    onNavigate?.(path);
    onClose?.(); // close drawer on mobile after navigation
  };

  const navBtnStyle = (id) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    textAlign: 'left',
    width: '100%',
    padding: '12px',
    borderRadius: 11,
    background: activePage === id ? 'linear-gradient(100deg,#e4f8f4,#eaf8fc)' : 'transparent',
    color: activePage === id ? '#153e67' : '#59748a',
    fontWeight: 800,
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    boxShadow: activePage === id ? 'inset 3px 0 #12a99f' : 'none',
    transition: '0.15s',
    minHeight: 44,
  });

  const sidebarContent = (
    <aside style={{
      background: '#fffefa',
      borderRight: '1px solid #e1ebed',
      padding: '16px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      width: 245,
      height: '100%',
      overflowY: 'auto',
      flexShrink: 0,
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px' }}>
        <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-1px', color: '#153e67' }}>
          Gamifi<span style={{ color: '#12a99f' }}>ED</span>
        </div>
        {/* Close button — only visible inside the mobile overlay */}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close menu"
            style={{
              background: 'none', border: 'none', fontSize: 22,
              cursor: 'pointer', color: '#688097', padding: 4,
              minWidth: 36, minHeight: 36, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}
          >×</button>
        )}
      </div>

      {/* Role badge */}
      <div style={{
        margin: '0 10px',
        background: '#e9f8f5', color: '#13867f',
        padding: '9px 11px', borderRadius: 10,
        fontSize: 11, fontWeight: 900,
        textTransform: 'uppercase', letterSpacing: '0.7px',
      }}>
        ✦ Teacher Studio
      </div>

      {/* Workspace nav */}
      <div>
        <div style={{ fontSize: 10, color: '#8ba0ad', fontWeight: 900, letterSpacing: '1.1px', padding: '0 12px', margin: '4px 0', textTransform: 'uppercase' }}>
          WORKSPACE
        </div>
        <nav style={{ display: 'grid', gap: 4 }}>
          {pages.map(page => (
            <button key={page.id} onClick={() => handleNavigation(page.path)} style={navBtnStyle(page.id)}>
              <span style={{ width: 23, textAlign: 'center', fontSize: 17 }}>{page.icon}</span>
              <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{page.label}</span>
                {page.badge > 0 && (
                  <span style={{ borderRadius: 999, padding: '3px 8px', fontSize: 10, fontWeight: 900, background: '#fff3d4', color: '#a77818', flexShrink: 0 }}>
                    {page.badge}
                  </span>
                )}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Quick access */}
      <div>
        <div style={{ fontSize: 10, color: '#8ba0ad', fontWeight: 900, letterSpacing: '1.1px', padding: '0 12px', margin: '4px 0', textTransform: 'uppercase' }}>
          QUICK ACCESS
        </div>
        <nav style={{ display: 'grid', gap: 4 }}>
          {quickAccess.map(item => (
            <button key={item.id} onClick={() => handleNavigation(item.path)} style={navBtnStyle(item.id)}>
              <span style={{ width: 23, textAlign: 'center', fontSize: 17 }}>{item.icon}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Bottom widget */}
      <div style={{ marginTop: 'auto', background: '#f0f9f7', border: '1px solid #d8efeb', borderRadius: 14, padding: 14 }}>
        <strong style={{ display: 'block', color: '#153e67', marginBottom: 5, fontSize: 13 }}>🌱 Small steps, big growth</strong>
        <p style={{ fontSize: 11, color: '#688097', lineHeight: 1.5, margin: '0 0 10px' }}>
          Spot a learning gap early and help every learner grow at their own pace.
        </p>
        <button
          onClick={() => handleNavigation('/create')}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 999,
            background: '#eaf7f7', color: '#147d81',
            border: '1px solid #cde9e7', fontWeight: 900,
            cursor: 'pointer', fontSize: 11, transition: '0.15s',
          }}
        >
          Create a REPLAY +
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* ── Desktop: always-visible sticky sidebar ─────────────────── */}
      <div className="sidebar-desktop" style={{ position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
        {sidebarContent}
      </div>

      {/* ── Mobile: slide-in overlay ────────────────────────────────── */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(10,30,50,0.45)',
              zIndex: 200, display: 'none',
            }}
            className="sidebar-overlay"
            aria-hidden="true"
          />
          {/* Drawer */}
          <div
            style={{
              position: 'fixed', top: 0, left: 0, bottom: 0,
              zIndex: 201, display: 'none',
              boxShadow: '4px 0 24px rgba(0,0,0,0.2)',
            }}
            className="sidebar-drawer"
          >
            {sidebarContent}
          </div>
        </>
      )}

      {/* ── Responsive visibility rules ────────────────────────────── */}
      <style>{`
        @media (max-width: 900px) {
          .sidebar-desktop { display: none !important; }
          .sidebar-overlay  { display: block !important; }
          .sidebar-drawer   { display: block !important; }
        }
        @media (min-width: 901px) {
          .sidebar-overlay { display: none !important; }
          .sidebar-drawer  { display: none !important; }
        }
      `}</style>
    </>
  );
}
