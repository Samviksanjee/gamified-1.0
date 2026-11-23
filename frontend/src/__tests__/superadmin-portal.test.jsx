import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { adminApi } from '../api.js';
import { AppProvider } from '../context/AppContext';
import { ADMIN_NAV, NAV_LINKS, adminInitials, findActive } from '../components/SuperAdmin/adminNav.js';
import InviteTeacherForm, { passwordStrength, validateInvite } from '../components/SuperAdmin/InviteTeacherForm.jsx';
import { BarChart, DonutChart, LineChart } from '../components/SuperAdmin/charts.jsx';
import { DataTable, DateRangeFilter, rangeParams } from '../components/SuperAdmin/ui.jsx';
import ChangePasswordForm from '../components/ChangePasswordForm.jsx';
import FirstLoginPasswordPage from '../pages/FirstLoginPasswordPage.jsx';
import SuperAdminComparison from '../pages/SuperAdmin/SuperAdminComparison.jsx';
import SuperAdminTeachers from '../pages/SuperAdmin/SuperAdminTeachers.jsx';

vi.mock('../api.js', async () => {
  const actual = await vi.importActual('../api.js');
  return { ...actual, adminApi: { ...actual.adminApi, inviteTeacher: vi.fn(), changePassword: vi.fn(), filters: vi.fn(), compare: vi.fn(), teachers: vi.fn(), suspendTeacher: vi.fn() } };
});

const user = { name: 'Yash Kumar', role: 'super_admin' };
beforeEach(() => { localStorage.clear(); Object.values(adminApi).forEach((f) => f.mockReset?.()); });
afterEach(() => cleanup());

/* ── navigation ─────────────────────────────────────────────── */
test('the sidebar has the nine requested groups', () => {
  expect(ADMIN_NAV.map((g) => g.label)).toEqual(['Dashboard', 'Teacher Management', 'Student Management', 'Classroom Management', 'Performance Analytics',
    'Activity Management', 'Reports & Exports', 'Audit Logs', 'WhatsApp', 'Settings']);
});

test('findActive picks the longest matching path and honours the status query', () => {
  expect(findActive('/admin').label).toBe('Dashboard');
  expect(findActive('/admin/students/enrollment').label).toBe('Student Enrollment');
  expect(findActive('/admin/students/42').label).toBe('All Students');
  expect(findActive('/admin/analytics/compare').label).toBe('Classroom Comparison');
  expect(findActive('/admin/teachers', '?status=suspended').label).toBe('Suspended Teachers');
  expect(findActive('/admin/teachers').label).toBe('All Teachers');
  expect(findActive('/admin/unknown').label).toBe(NAV_LINKS[0].label);
});

test('adminInitials handles one name, two names and none', () => {
  expect(adminInitials('Yash Kumar')).toBe('YK');
  expect(adminInitials('Yash')).toBe('YA');
  expect(adminInitials('')).toBe('SA');
});

/* ── invite form ────────────────────────────────────────────── */
test('passwordStrength grows with variety and never exceeds Weak when too short', () => {
  expect(passwordStrength('Ab1!')).toBeLessThanOrEqual(1);
  expect(passwordStrength('abcdefgh')).toBe(1);
  expect(passwordStrength('Abcdefg1')).toBe(3);
  expect(passwordStrength('Abcdefg1!')).toBe(4);
});

test('validateInvite reports each problem', () => {
  expect(validateInvite({ name: '', email: 'bad', password: 'short', confirm: 'x' })).toEqual({
    name: expect.any(String), email: expect.any(String), password: expect.any(String), confirm: expect.any(String) });
  expect(validateInvite({ name: 'A', email: 'a@example.com', password: 'Abcdefg1!', confirm: 'Abcdefg1!' })).toEqual({});
});

const fill = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

test('the invite form blocks mismatching passwords and does not call the API', async () => {
  render(<InviteTeacherForm />);
  fill('Full name', 'Priya Nair'); fill('Email address', 'priya@example.com'); fill('Temporary password', 'Abcdefg1!'); fill('Confirm password', 'different');
  fireEvent.click(screen.getByRole('button', { name: 'Create teacher' }));
  expect(await screen.findByText('The two passwords do not match.')).toBeInTheDocument();
  expect(adminApi.inviteTeacher).not.toHaveBeenCalled();
});

test('the invite form shows strength, toggles visibility and sends the payload', async () => {
  adminApi.inviteTeacher.mockResolvedValue({ email: 'priya@example.com' });
  const onCreated = vi.fn();
  const notify = vi.fn();
  render(<InviteTeacherForm onCreated={onCreated} notify={notify} />);
  fill('Full name', ' Priya Nair '); fill('Email address', 'priya@example.com'); fill('Temporary password', 'Abcdefg1!'); fill('Confirm password', 'Abcdefg1!');
  expect(screen.getByText('Password strength: Strong')).toBeInTheDocument();
  expect(screen.getByLabelText('Temporary password')).toHaveAttribute('type', 'password');
  fireEvent.click(screen.getByLabelText('Show passwords'));
  expect(screen.getByLabelText('Temporary password')).toHaveAttribute('type', 'text');
  fireEvent.click(screen.getByRole('button', { name: 'Create teacher' }));
  await waitFor(() => expect(onCreated).toHaveBeenCalled());
  expect(adminApi.inviteTeacher).toHaveBeenCalledWith({ name: 'Priya Nair', email: 'priya@example.com', temporary_password: 'Abcdefg1!', confirm_password: 'Abcdefg1!' });
  expect(notify).toHaveBeenCalledWith(expect.stringContaining('priya@example.com'));
  expect(screen.getByLabelText('Temporary password')).toHaveValue('');   // the password is cleared after submit
});

test('a duplicate e-mail error from the server is shown on the e-mail field', async () => {
  adminApi.inviteTeacher.mockRejectedValue(new Error('An account with this email already exists.'));
  render(<InviteTeacherForm />);
  fill('Full name', 'Priya'); fill('Email address', 'priya@example.com'); fill('Temporary password', 'Abcdefg1!'); fill('Confirm password', 'Abcdefg1!');
  fireEvent.click(screen.getByRole('button', { name: 'Create teacher' }));
  expect(await screen.findByText(/already exists/)).toBeInTheDocument();
});

/* ── first login ────────────────────────────────────────────── */
test('first login: mismatching new passwords are rejected locally', async () => {
  render(<ChangePasswordForm />);
  fireEvent.change(screen.getByLabelText(/Current/), { target: { value: 'Temp1234!' } });
  fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'Brandnew1!' } });
  fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'Other1234!' } });
  fireEvent.click(screen.getByRole('button', { name: 'Update password' }));
  expect(await screen.findAllByText(/do not match/)).not.toHaveLength(0);
  expect(adminApi.changePassword).not.toHaveBeenCalled();
});

test('first login gate: a successful change reports completion', async () => {
  adminApi.changePassword.mockResolvedValue({});
  const onChanged = vi.fn();
  render(<FirstLoginPasswordPage user={{ name: 'Priya' }} onChanged={onChanged} onSignOut={vi.fn()} />);
  fireEvent.change(screen.getByLabelText(/Current/), { target: { value: 'Temp1234!' } });
  fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'Brandnew1!' } });
  fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'Brandnew1!' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save and continue' }));
  await waitFor(() => expect(onChanged).toHaveBeenCalled());
  expect(adminApi.changePassword).toHaveBeenCalledWith('Temp1234!', 'Brandnew1!');
});

test('first login gate: a server error is shown and the gate stays', async () => {
  adminApi.changePassword.mockRejectedValue(new Error('Current password is incorrect.'));
  const onChanged = vi.fn();
  render(<FirstLoginPasswordPage user={{ name: 'Priya' }} onChanged={onChanged} onSignOut={vi.fn()} />);
  fireEvent.change(screen.getByLabelText(/Current/), { target: { value: 'wrong-one' } });
  fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'Brandnew1!' } });
  fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'Brandnew1!' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save and continue' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Current password is incorrect.');
  expect(onChanged).not.toHaveBeenCalled();
});

/* ── table, filters, charts ─────────────────────────────────── */
test('DataTable sorts through the header button, renders rows and pages', () => {
  const onSort = vi.fn(); const onPage = vi.fn();
  render(<DataTable caption="Demo" rows={[{ id: 1, n: 'Ann' }, { id: 2, n: 'Bob' }]} sort={{ key: 'n', order: 'asc' }} onSort={onSort} onPage={onPage}
    meta={{ page: 2, page_size: 2, total: 6, pages: 3 }} columns={[{ key: 'n', label: 'Name', sortKey: 'n' }]} />);
  expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveAttribute('aria-sort', 'ascending');
  fireEvent.click(screen.getByRole('button', { name: /Name/ }));
  expect(onSort).toHaveBeenCalledWith('n');
  expect(screen.getByText('Showing 3–4 of 6')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(onPage).toHaveBeenCalledWith(3);
});

test('DataTable shows an empty state, not blank rows', () => {
  render(<DataTable caption="Demo" rows={[]} columns={[{ key: 'n', label: 'Name' }]} empty="Nothing to show" />);
  expect(screen.getByText('Nothing to show')).toBeInTheDocument();
});

test('a custom date range with the end before the start is flagged and falls back to 30 days', () => {
  const onChange = vi.fn();
  render(<DateRangeFilter value={{ range: 'custom', start: '2026-10-10', end: '2026-10-01' }} onChange={onChange} />);
  expect(screen.getByRole('alert')).toHaveTextContent('End date must be after the start date.');
  expect(rangeParams({ range: 'custom', start: '2026-10-10', end: '2026-10-01' })).toEqual({ range: '30d' });
  expect(rangeParams({ range: 'custom', start: '2026-10-01', end: '2026-10-10' })).toEqual({ range: 'custom', start: '2026-10-01', end: '2026-10-10' });
  fireEvent.click(screen.getByRole('button', { name: 'Last 7 days' }));
  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ range: '7d' }));
});

test('charts describe their data for assistive tech and show an empty state with no data', () => {
  const { unmount } = render(<><BarChart title="Accuracy" unit="%" data={[{ label: 'A', value: 80 }, { label: 'B', value: null }]} />
    <DonutChart title="Teachers" data={[{ label: 'Active', value: 3 }, { label: 'Pending', value: 1 }]} /></>);
  expect(screen.getByRole('img', { name: /Accuracy\. A: 80%; B: no data/ })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: /Teachers\. Active: 3; Pending: 1/ })).toBeInTheDocument();
  unmount();
  render(<><BarChart title="x" data={[]} /><LineChart title="y" rows={[]} series={[{ key: 'v', label: 'V' }]} /></>);
  expect(screen.getAllByText('No data for this period.')).toHaveLength(2);
});

/* ── pages ──────────────────────────────────────────────────── */
const COMPARE = {
  min_sample: 3, mixed_grades: true, notes: ['These classrooms are from different grades, so compare with care.'], trend: [], engagement: [],
  highlights: { accuracy: { strongest: 1, weakest: 2 } },
  classrooms: [
    { classroom_id: 1, classroom: 'Class 3A', teacher: 'Asha', grade: 3, subject: 'Maths', enrolled_students: 10, participating_students: 8, low_sample: false, activities_assigned: 4,
      assignments_total: 40, assignments_completed: 30, attempts: 50, avg_score: 80, accuracy: 85, answered_questions: 200, completion_rate: 75, participation_rate: 80, avg_attempts_per_student: 6, avg_seconds_per_activity: 30 },
    { classroom_id: 2, classroom: 'Class 5B', teacher: 'Ravi', grade: 5, subject: 'Maths', enrolled_students: 4, participating_students: 2, low_sample: true, activities_assigned: 2,
      assignments_total: 8, assignments_completed: 2, attempts: 5, avg_score: 40, accuracy: 30, answered_questions: 12, completion_rate: 25, participation_rate: 50, avg_attempts_per_student: 2, avg_seconds_per_activity: null },
  ],
};

test('classroom comparison shows the mixed-grade warning, sample sizes and the small-sample badge', async () => {
  adminApi.filters.mockResolvedValue({ teachers: [], grades: [3, 5], subjects: ['Maths'], classrooms: [{ id: 1, name: 'Class 3A', grade: 3, subject: 'Maths', teacher_id: 1 }] });
  adminApi.compare.mockResolvedValue(COMPARE);
  render(<MemoryRouter><SuperAdminComparison user={user} onSignOut={vi.fn()} /></MemoryRouter>);
  expect(await screen.findByRole('note')).toHaveTextContent('different grades');
  const table = screen.getByRole('region', { name: 'Classroom comparison' });
  expect(within(table).getByText('small sample')).toBeInTheDocument();
  expect(within(table).getByText('n = 200 answers')).toBeInTheDocument();
  expect(within(table).getByText(/strongest/)).toBeInTheDocument();
  expect(within(table).getByText(/weakest/)).toBeInTheDocument();
  expect(within(table).getByText('—', { selector: 'td' })).toBeInTheDocument();   // missing time is a dash, not 0
});

test('suspending a teacher needs confirmation, then calls the API and reloads', async () => {
  const row = { id: 7, name: 'Asha Rao', email: 'asha@example.com', status: 'active', created_at: '2026-01-01T00:00:00', classrooms: 2, students: 9, activities_created: 3, activities_published: 2, last_login_at: null };
  adminApi.teachers.mockResolvedValue({ items: [row], page: 1, page_size: 25, total: 1, pages: 1, pending_invitations: [] });
  adminApi.suspendTeacher.mockResolvedValue({});
  render(<AppProvider><MemoryRouter initialEntries={['/admin/teachers']}><Routes><Route path="/admin/teachers" element={<SuperAdminTeachers user={user} onSignOut={vi.fn()} />} /></Routes></MemoryRouter></AppProvider>);
  fireEvent.click(await screen.findByRole('button', { name: 'Suspend' }));
  expect(adminApi.suspendTeacher).not.toHaveBeenCalled();
  expect(await screen.findByText('Suspend this teacher?')).toBeInTheDocument();
  const buttons = screen.getAllByRole('button', { name: 'Suspend' });
  fireEvent.click(buttons[buttons.length - 1]);
  await waitFor(() => expect(adminApi.suspendTeacher).toHaveBeenCalledWith(7));
  await waitFor(() => expect(adminApi.teachers).toHaveBeenCalledTimes(2));
});
