/**
 * Small inline SVG icon set for the Super Admin console (no icon dependency).
 * Every icon is decorative by default (aria-hidden); pair it with visible text or an aria-label on the control.
 */
const base = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, focusable: 'false' };

const make = (paths) => function Icon({ size, ...props }) {
  return <svg {...base} {...(size ? { width: size, height: size } : {})} {...props}>{paths}</svg>;
};

export const DashboardIcon = make(<><rect x="3" y="3" width="7.5" height="7.5" rx="1.8" /><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.8" /><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.8" /><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.8" /></>);
export const TeachersIcon = make(<><circle cx="12" cy="8" r="3.6" /><path d="M4.5 20c.6-3.8 3.6-6 7.5-6s6.9 2.2 7.5 6" /></>);
export const StudentsIcon = make(<><path d="M2.5 9.5 12 5l9.5 4.5L12 14 2.5 9.5Z" /><path d="M6.5 11.8V16c0 1.3 2.5 2.5 5.5 2.5s5.5-1.2 5.5-2.5v-4.2" /></>);
export const UsersIcon = make(<><circle cx="9" cy="8.5" r="3.2" /><path d="M2.8 19.5c.5-3.3 3-5.2 6.2-5.2s5.7 1.9 6.2 5.2" /><path d="M16 5.6a3.2 3.2 0 0 1 0 5.8" /><path d="M18 14.6c1.8.6 3 2.2 3.3 4.9" /></>);
export const ClassroomIcon = make(<><path d="M3 21V9l9-5.5L21 9v12" /><path d="M9 21v-6h6v6" /><path d="M3 21h18" /></>);
export const TopicsIcon = make(<><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" /><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" /></>);
export const ActivitiesIcon = make(<><path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12L13 2Z" /></>);
export const AttemptsIcon = make(<><circle cx="12" cy="12" r="9" /><path d="m8.5 12.3 2.4 2.4 4.6-5" /></>);
export const MailIcon = make(<><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m3.5 7 8.5 6.2L20.5 7" /></>);
export const MailPlusIcon = make(<><path d="M12 19H5.5A2.5 2.5 0 0 1 3 16.5v-9A2.5 2.5 0 0 1 5.5 5h13A2.5 2.5 0 0 1 21 7.5V12" /><path d="m3.5 7 8.5 6 8.5-6" /><path d="M18 15v6M15 18h6" /></>);
export const LogIcon = make(<><rect x="5" y="3" width="14" height="18" rx="2.5" /><path d="M9 8h6M9 12h6M9 16h3.5" /></>);
export const LogoutIcon = make(<><path d="M9 21H5.5A2.5 2.5 0 0 1 3 18.5v-13A2.5 2.5 0 0 1 5.5 3H9" /><path d="m16 16.5 4.5-4.5L16 7.5" /><path d="M20.5 12H9" /></>);
export const MenuIcon = make(<><path d="M4 6.5h16M4 12h16M4 17.5h16" /></>);
export const CloseIcon = make(<><path d="m6 6 12 12M18 6 6 18" /></>);
export const ChevronsLeftIcon = make(<><path d="m11 17-5-5 5-5" /><path d="m18 17-5-5 5-5" /></>);
export const ChevronsRightIcon = make(<><path d="m13 17 5-5-5-5" /><path d="m6 17 5-5-5-5" /></>);
export const RefreshIcon = make(<><path d="M20.5 12a8.5 8.5 0 1 1-2.5-6" /><path d="M20.5 3.5V8H16" /></>);
export const ShieldIcon = make(<><path d="M12 3 4.5 6v5.5c0 4.6 3.1 8.2 7.5 9.5 4.4-1.3 7.5-4.9 7.5-9.5V6L12 3Z" /><path d="m9 12 2.2 2.2L15.5 10" /></>);
export const ChartIcon = make(<><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>);
export const SettingsIcon = make(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></>);
export const DownloadIcon = make(<><path d="M12 3v12M7 11l5 5 5-5M4 20h16" /></>);
export const ChevronDownIcon = make(<><path d="m6 9 6 6 6-6" /></>);
export const PlusIcon = make(<><path d="M12 5v14M5 12h14" /></>);
export const SearchIcon = make(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>);
export const PercentIcon = make(<><path d="M19 5 5 19" /><circle cx="7" cy="7" r="2.5" /><circle cx="17" cy="17" r="2.5" /></>);
export const ClockIcon = make(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>);
export const BanIcon = make(<><circle cx="12" cy="12" r="9" /><path d="m5.6 5.6 12.8 12.8" /></>);
export const MessageIcon = make(<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></>);
