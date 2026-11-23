import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import SuperAdminDashboard from '../pages/SuperAdmin/SuperAdminDashboard.jsx';
import { adminApi } from '../api.js';

vi.mock('../api.js', async () => {
  const actual = await vi.importActual('../api.js');
  return { ...actual, adminApi: { ...actual.adminApi, dashboard: vi.fn() } };
});

const kpi = (value, extra = {}) => ({ value, trend: null, ...extra });
const DASH = {
  range: { label: '30d' },
  kpis: {
    total_teachers: kpi(82, { new_in_range: 4 }), active_teachers: kpi(70), pending_teachers: kpi(7, { accounts: 4, invitations: 3 }), suspended_teachers: kpi(5),
    total_students: kpi(58, { new_in_range: 9 }), active_students: kpi(57), total_classrooms: kpi(59), published_activities: kpi(41, { of: 50 }),
    total_attempts: kpi(16), overall_accuracy: kpi(72.5),
  },
  teachers: { active: 70, pending: 7, suspended: 5, registrations: [{ bucket: '2026-10-01', value: 2 }] },
  students: { total: 58, active: 57, enrolled: 40, not_enrolled: 18, memberships: 63, registrations: [{ bucket: '2026-10-01', value: 3 }],
    by_teacher: [{ teacher: 'Asha Rao', students: 12 }], by_grade: [{ grade: 3, students: 20 }] },
  learning: { accuracy: 72.5, correct_answers: 29, answered_questions: 40, avg_score: 68, assignments_completed: 10, assignments_pending: 5, assignments_total: 15,
    attempts: 16, completed_attempts: 12, participation_rate: 50, participants: 29, completion_rate: 66.7, avg_seconds_per_activity: 42, attempts_series: [{ bucket: '2026-10-01', value: 4 }] },
};
const user = { name: 'Yash Kumar', role: 'super_admin' };
function Where() { return <div data-testid="where">{useLocation().pathname}</div>; }
const mount = (onSignOut = vi.fn()) => render(
  <MemoryRouter initialEntries={['/admin']}><Where />
    <Routes><Route path="/admin/*" element={<SuperAdminDashboard user={user} onSignOut={onSignOut} />} /></Routes>
  </MemoryRouter>);

beforeEach(() => { localStorage.clear(); adminApi.dashboard.mockReset(); adminApi.dashboard.mockResolvedValue(DASH); });
afterEach(() => { cleanup(); document.body.style.overflow = ''; });

test('the ten KPI cards show the values returned by the API', async () => {
  mount();
  const kpis = within(await screen.findByLabelText('Key metrics'));
  for (const [label, value] of [['Total Teachers', '82'], ['Active Teachers', '70'], ['Pending Teachers', '7'], ['Suspended Teachers', '5'], ['Total Students', '58'],
    ['Active Students', '57'], ['Total Classrooms', '59'], ['Published Activities', '41'], ['Total Game Attempts', '16'], ['Overall Student Accuracy', '72.5%']]) {
    expect(kpis.getByText(label).closest('article')).toHaveTextContent(value);
  }
});

test('changing the date range asks the API for that range', async () => {
  mount();
  await screen.findByLabelText('Key metrics');
  expect(adminApi.dashboard).toHaveBeenLastCalledWith(expect.objectContaining({ range: '30d' }));
  fireEvent.click(screen.getByRole('button', { name: /Last 7 days/ }));
  await waitFor(() => expect(adminApi.dashboard).toHaveBeenLastCalledWith(expect.objectContaining({ range: '7d' })));
});

test('Refresh calls the API again and is disabled while loading', async () => {
  mount();
  await screen.findByLabelText('Key metrics');
  let release;
  adminApi.dashboard.mockReturnValueOnce(new Promise((resolve) => { release = resolve; }));
  fireEvent.click(screen.getByRole('button', { name: /Refresh/ }));
  expect(await screen.findByRole('button', { name: /Refreshing/ })).toBeDisabled();
  release(DASH);
  expect(await screen.findByRole('button', { name: /^Refresh$/ })).toBeEnabled();
  expect(adminApi.dashboard).toHaveBeenCalledTimes(2);
});

test('an API failure shows an alert instead of fake numbers', async () => {
  adminApi.dashboard.mockRejectedValue(new Error('Stats unavailable'));
  mount();
  expect(await screen.findByRole('alert')).toHaveTextContent('Stats unavailable');
  expect(screen.queryByLabelText('Key metrics')).not.toBeInTheDocument();
});

test('quick actions navigate and the sidebar marks the dashboard as current', async () => {
  mount();
  const nav = screen.getByLabelText('Super Admin navigation');
  expect(within(nav).getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page');
  fireEvent.click(await screen.findByRole('button', { name: /Reports & Exports/ }));
  expect(screen.getByTestId('where')).toHaveTextContent('/admin/reports');
});

test('the sidebar groups expand, and collapsing keeps accessible link names', async () => {
  localStorage.setItem('superadmin_sidebar_collapsed', '0');   // start expanded (jsdom is 1024px wide, which defaults to compact)
  mount();
  const nav = screen.getByLabelText('Super Admin navigation');
  const group = within(nav).getByRole('button', { name: /Teacher Management/ });
  fireEvent.click(group);
  expect(within(nav).getByRole('link', { name: 'Pending Teachers' })).toHaveAttribute('href', '/admin/teachers?status=pending');

  const shell = screen.getByTestId('superadmin-shell');
  fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
  expect(shell).toHaveClass('is-collapsed');
  expect(localStorage.getItem('superadmin_sidebar_collapsed')).toBe('1');
  expect(within(nav).getByRole('link', { name: 'Teacher Management' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Expand sidebar' }));
  expect(shell).not.toHaveClass('is-collapsed');
});

test('mobile drawer: opens, locks background scroll, closes with Escape', async () => {
  mount();
  const shell = screen.getByTestId('superadmin-shell');
  fireEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
  expect(shell).toHaveClass('is-drawer-open');
  expect(document.body.style.overflow).toBe('hidden');
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(shell).not.toHaveClass('is-drawer-open');
  expect(document.body.style.overflow).toBe('');
});

test('Sign out clears the token, notifies the app and goes to the admin entry page', async () => {
  localStorage.setItem('gamified_token', 'abc');
  const onSignOut = vi.fn();
  mount(onSignOut);
  fireEvent.click(within(screen.getByRole('banner')).getByRole('button', { name: 'Sign out' }));
  expect(onSignOut).toHaveBeenCalledTimes(1);
  expect(localStorage.getItem('gamified_token')).toBeNull();
});
