import { useEffect, useState } from 'react';
import { api } from '../api.js';
import TeacherLayout from '../components/TeacherLayout';
import PageHeader from '../components/PageHeader';
import CreateAnnouncement from '../components/teacher/whatsapp/CreateAnnouncement';
import ScheduleReminder from '../components/teacher/whatsapp/ScheduleReminder';
import NotificationHistory from '../components/teacher/whatsapp/NotificationHistory';
import NotificationAnalytics from '../components/teacher/whatsapp/NotificationAnalytics';

const TABS = [
  { id: 'announce', label: '📢 Announce',   title: 'Create Announcement' },
  { id: 'reminder', label: '⏰ Reminder',    title: 'Schedule Reminder' },
  { id: 'history',  label: '📋 History',    title: 'Notification History' },
  { id: 'analytics',label: '📊 Analytics',  title: 'Analytics' },
];

export default function TeacherNotificationsPage({ user, onSignOut }) {
  const [activeTab, setActiveTab]   = useState('announce');
  const [classrooms, setClassrooms] = useState([]);
  const [loadingCls, setLoadingCls] = useState(true);

  useEffect(() => {
    api.classrooms()
      .then((data) => setClassrooms(Array.isArray(data) ? data : data?.classrooms ?? []))
      .catch(() => setClassrooms([]))
      .finally(() => setLoadingCls(false));
  }, []);

  const activeLabel = TABS.find((t) => t.id === activeTab)?.title ?? '';

  const tabBtnStyle = (id) => ({
    padding: '10px 18px',
    borderRadius: 999,
    border: 'none',
    fontWeight: 900,
    fontSize: 13,
    cursor: 'pointer',
    background: activeTab === id
      ? 'linear-gradient(100deg, #19b7a7, #079c98)'
      : '#f0f7f7',
    color: activeTab === id ? 'white' : '#153e67',
    transition: '0.15s',
    whiteSpace: 'nowrap',
  });

  return (
    <TeacherLayout
      crumb="Teacher Studio / WhatsApp Notifications"
      activePage="notifications"
      user={user}
      onSignOut={onSignOut}
    >
      <PageHeader
        eyebrow="WHATSAPP NOTIFICATIONS"
        title="Reach your students instantly 📱"
        subtitle="Publish announcements, schedule reminders, and track delivery — all via WhatsApp."
      />

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 8, flexWrap: 'wrap',
        marginBottom: 24, padding: '4px 0',
      }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={tabBtnStyle(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div style={{
        background: 'white', border: '1px solid #e0eaed',
        borderRadius: 16, padding: 'clamp(18px, 3vw, 28px)',
      }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 16, color: '#153e67', fontWeight: 900 }}>
          {activeLabel}
        </h2>

        {activeTab === 'announce' && (
          loadingCls ? (
            <p style={{ color: '#688097' }}>Loading classrooms…</p>
          ) : (
            <CreateAnnouncement classrooms={classrooms} />
          )
        )}

        {activeTab === 'reminder' && (
          loadingCls ? (
            <p style={{ color: '#688097' }}>Loading classrooms…</p>
          ) : (
            <ScheduleReminder classrooms={classrooms} />
          )
        )}

        {activeTab === 'history' && <NotificationHistory />}

        {activeTab === 'analytics' && <NotificationAnalytics />}
      </div>
    </TeacherLayout>
  );
}
