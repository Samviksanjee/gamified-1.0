import {
  ActivitiesIcon, ChartIcon, ClassroomIcon, DashboardIcon, LogIcon, MailIcon, MailPlusIcon, MessageIcon, SettingsIcon, StudentsIcon, TeachersIcon, DownloadIcon,
} from './icons.jsx';

/**
 * Single source of truth for the Super Admin navigation: the sidebar, the header title and the breadcrumbs all read it.
 * `children` entries are links; a `path` may include a query string (the Teachers page reads ?status=).
 */
export const ADMIN_NAV = [
  { id: 'dashboard', label: 'Dashboard', path: '/admin', Icon: DashboardIcon },
  { id: 'teachers', label: 'Teacher Management', Icon: TeachersIcon, children: [
    { label: 'All Teachers', path: '/admin/teachers' },
    { label: 'Active Teachers', path: '/admin/teachers?status=active' },
    { label: 'Pending Teachers', path: '/admin/teachers?status=pending' },
    { label: 'Suspended Teachers', path: '/admin/teachers?status=suspended' },
    { label: 'Invitations', path: '/admin/invitations' },
  ] },
  { id: 'students', label: 'Student Management', Icon: StudentsIcon, children: [
    { label: 'All Students', path: '/admin/students' },
    { label: 'Student Enrollment', path: '/admin/students/enrollment' },
  ] },
  { id: 'classrooms', label: 'Classroom Management', Icon: ClassroomIcon, children: [{ label: 'All Classrooms', path: '/admin/classrooms' }] },
  { id: 'performance', label: 'Performance Analytics', Icon: ChartIcon, children: [
    { label: 'Overall Performance', path: '/admin/analytics' },
    { label: 'Classroom Comparison', path: '/admin/analytics/compare' },
    { label: 'Teacher Performance', path: '/admin/analytics/teachers' },
    { label: 'Student Performance', path: '/admin/analytics/students' },
  ] },
  { id: 'activities', label: 'Activity Management', Icon: ActivitiesIcon, children: [
    { label: 'All Activities', path: '/admin/activities' },
    { label: 'Game Analytics', path: '/admin/activities/games' },
  ] },
  { id: 'reports', label: 'Reports & Exports', path: '/admin/reports', Icon: DownloadIcon },
  { id: 'audit-logs', label: 'Audit Logs', path: '/admin/audit-logs', Icon: LogIcon },
  { id: 'whatsapp', label: 'WhatsApp', Icon: MessageIcon, children: [
    { label: 'Integration Status', path: '/admin/whatsapp' },
    { label: 'Message Templates', path: '/admin/whatsapp/templates' },
    { label: 'Analytics', path: '/admin/whatsapp/analytics' },
    { label: 'Delivery Logs', path: '/admin/whatsapp/logs' },
  ] },
  { id: 'settings', label: 'Settings', path: '/admin/settings', Icon: SettingsIcon },
];

const base = (path) => path.split('?')[0];

/** Every link, flattened, with its group. */
export const NAV_LINKS = ADMIN_NAV.flatMap((item) => (item.children
  ? item.children.map((child) => ({ ...child, group: item, groupLabel: item.label }))
  : [{ label: item.label, path: item.path, group: item, groupLabel: null }]));

/** Which link is current. Query-string links win when the query matches; otherwise the longest matching path prefix wins. */
export function findActive(pathname, search = '') {
  const here = pathname.replace(/\/+$/, '') || '/admin';
  const status = new URLSearchParams(search).get('status');
  const exactWithQuery = NAV_LINKS.find((l) => l.path.includes('?') && base(l.path) === here && l.path.endsWith(`status=${status}`));
  if (exactWithQuery) return exactWithQuery;
  const candidates = NAV_LINKS.filter((l) => !l.path.includes('?') && (here === base(l.path) || (base(l.path) !== '/admin' && here.startsWith(`${base(l.path)}/`))));
  candidates.sort((a, b) => base(b.path).length - base(a.path).length);
  return candidates[0] || NAV_LINKS[0];
}

export const isGroupActive = (group, active) => Boolean(active && active.group.id === group.id);

export function adminInitials(name) {
  const parts = String(name || 'Super Admin').trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2)).toUpperCase();
}
