export default function Topbar({ crumb, user, onSignOut, onNotification, onMenuToggle }) {
  return (
    <header style={{
      height: 64,
      background: 'rgba(255,254,250,0.95)',
      borderBottom: '1px solid #e3ecee',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      gap: 12,
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(8px)',
      /* Never overflow horizontally */
      overflow: 'hidden',
    }}>
      {/* ── Hamburger (mobile only) ── */}
      <button
        onClick={onMenuToggle}
        aria-label="Open navigation menu"
        className="topbar-hamburger"
        style={{
          display: 'none', /* shown via media query below */
          background: 'none',
          border: '1px solid #dce8ed',
          borderRadius: 10,
          width: 40, height: 40,
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: 20,
          color: '#153e67',
          flexShrink: 0,
        }}
      >
        ☰
      </button>

      {/* ── Breadcrumb ── */}
      <div style={{
        fontSize: 12, color: '#688097', fontWeight: 800,
        flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        minWidth: 0,
      }}>
        {crumb || 'Teacher Studio'}
      </div>

      {/* ── Right-side actions ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {/* Notifications */}
        <button
          title="Notifications"
          onClick={() => onNotification?.()}
          style={{
            width: 38, height: 38, minWidth: 38,
            border: '1px solid #dce8ed',
            background: 'white',
            borderRadius: 12,
            color: '#153e67',
            cursor: 'pointer',
            fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: '0.15s',
          }}
        >
          🔔
        </button>

        {/* Avatar + name (hide name on very small screens) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 36, height: 36, minWidth: 36,
            display: 'grid', placeItems: 'center',
            borderRadius: '50%',
            background: '#ffe3b5',
            fontSize: 20,
            border: '2px solid white',
          }} title="Teacher profile">
            👩🏻‍🏫
          </div>
          <div className="topbar-name" style={{ lineHeight: 1.3 }}>
            <strong style={{ display: 'block', color: '#153e67', fontSize: 12, whiteSpace: 'nowrap' }}>
              {user?.name || 'Teacher'}
            </strong>
            <small style={{ fontSize: 10, color: '#688097' }}>Teacher</small>
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={onSignOut}
          style={{
            padding: '8px 14px',
            borderRadius: 999,
            background: '#eaf7f7',
            color: '#147d81',
            border: '1px solid #cde9e7',
            fontWeight: 900,
            cursor: 'pointer',
            fontSize: 12,
            transition: '0.15s',
            whiteSpace: 'nowrap',
          }}
        >
          Sign out
        </button>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .topbar-hamburger { display: flex !important; }
        }
        @media (max-width: 520px) {
          .topbar-name { display: none; }
        }
      `}</style>
    </header>
  );
}
