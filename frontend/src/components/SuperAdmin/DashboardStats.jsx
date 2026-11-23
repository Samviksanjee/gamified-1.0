import { ActivitiesIcon, AttemptsIcon, ClassroomIcon, MailIcon, StudentsIcon, TeachersIcon, TopicsIcon, UsersIcon } from './icons.jsx';

/** Which API field feeds which card. Values always come from the backend payload. */
export const STAT_DEFINITIONS = [
  { key: 'total_users', label: 'Total Users', Icon: UsersIcon },
  { key: 'total_teachers', label: 'Teachers', Icon: TeachersIcon },
  { key: 'total_students', label: 'Students', Icon: StudentsIcon },
  { key: 'total_classrooms', label: 'Classrooms', Icon: ClassroomIcon },
  { key: 'total_topics', label: 'Topics', Icon: TopicsIcon },
  { key: 'total_activities', label: 'Activities', Icon: ActivitiesIcon },
  { key: 'total_attempts', label: 'Quiz Attempts', Icon: AttemptsIcon },
  { key: 'pending_invitations', label: 'Pending Invitations', Icon: MailIcon },
];

export function StatCard({ Icon, value, label, loading }) {
  if (loading) {
    return (
      <article className="sa-stat is-loading" aria-hidden="true">
        <span className="sa-stat-icon sa-skeleton" />
        <span className="sa-stat-body" style={{ flex: 1 }}>
          <span className="sa-skeleton" style={{ display: 'block', height: 26, width: '55%' }} />
          <span className="sa-skeleton" style={{ display: 'block', height: 12, width: '80%', marginTop: 10 }} />
        </span>
      </article>
    );
  }
  return (
    <article className="sa-stat">
      <span className="sa-stat-icon"><Icon size={22} /></span>
      <span className="sa-stat-body">
        <span className="sa-stat-value">{value}</span>
        <span className="sa-stat-label">{label}</span>
      </span>
    </article>
  );
}

export default function DashboardStats({ stats, loading }) {
  return (
    <section className="sa-section" aria-label="Overview metrics" aria-busy={loading || undefined}>
      <div className="sa-stats">
        {STAT_DEFINITIONS.map(({ key, label, Icon }) => (
          <StatCard key={key} Icon={Icon} label={label} loading={loading && !stats} value={stats?.[key] || 0} />
        ))}
      </div>
    </section>
  );
}
