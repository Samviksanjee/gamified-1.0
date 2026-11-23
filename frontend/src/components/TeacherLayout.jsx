import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function TeacherLayout({ children, crumb, activePage, user, onSignOut }) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      maxWidth: 1600,
      margin: 'auto',
      background: 'linear-gradient(135deg,#f2f9f8,#fffaf0)',
      position: 'relative',
    }}>
      {/* Sidebar — passes open/close state for mobile drawer */}
      <Sidebar
        activePage={activePage}
        onNavigate={(path) => navigate(path)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content column */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        <Topbar
          crumb={crumb}
          user={user}
          onSignOut={onSignOut}
          onMenuToggle={() => setSidebarOpen(o => !o)}
        />

        <main style={{
          padding: 'clamp(16px, 2.5vw, 28px) clamp(14px, 2.5vw, 30px) 48px',
          flex: 1,
          width: '100%',
          maxWidth: 1450,
          margin: '0 auto',
          boxSizing: 'border-box',
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}
