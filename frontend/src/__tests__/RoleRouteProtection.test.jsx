/**
 * RoleRouteProtection.test.jsx
 *
 * Verifies that role-based access control is enforced at the route level:
 * - Teacher routes redirect students to "/"
 * - Student preference route is not accessible to teachers
 *   (teacher gets TeacherNotificationsPage, not StudentNotificationSettings)
 * - Admin routes require super_admin role (ProtectedAdminRoute)
 */
import { render, screen, waitFor } from '@testing-library/react';
import { vi, expect, test, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Route, Routes, Navigate } from 'react-router-dom';
import ProtectedAdminRoute from '../components/ProtectedAdminRoute.jsx';

// ---------------------------------------------------------------------------
// Minimal stub pages so we don't need to render the full page tree
// ---------------------------------------------------------------------------
const AdminDashboard = () => <div data-testid="admin-dashboard">Admin Dashboard</div>;
const TeacherClassrooms = () => <div data-testid="teacher-classrooms">Teacher Classrooms</div>;
const StudentPrefs = () => <div data-testid="student-prefs">Student Notification Settings</div>;
const TeacherNotifs = () => <div data-testid="teacher-notifs">Teacher Notifications</div>;

// ---------------------------------------------------------------------------
// ProtectedAdminRoute tests
// ---------------------------------------------------------------------------

test('super_admin can access protected admin route', () => {
  const superAdmin = { id: 1, role: 'super_admin', name: 'Super Admin' };

  render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route
          path="/admin"
          element={
            <ProtectedAdminRoute
              component={AdminDashboard}
              user={superAdmin}
              onSignOut={() => {}}
            />
          }
        />
        <Route path="/admin/setup" element={<div data-testid="setup-page">Setup</div>} />
      </Routes>
    </MemoryRouter>,
  );

  expect(screen.getByTestId('admin-dashboard')).toBeTruthy();
  expect(screen.queryByTestId('setup-page')).toBeNull();
});

test('teacher role is redirected from admin route to /admin/setup', () => {
  const teacher = { id: 2, role: 'teacher', name: 'Teacher' };

  render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route
          path="/admin"
          element={
            <ProtectedAdminRoute
              component={AdminDashboard}
              user={teacher}
              onSignOut={() => {}}
            />
          }
        />
        <Route path="/admin/setup" element={<div data-testid="setup-page">Setup</div>} />
      </Routes>
    </MemoryRouter>,
  );

  // Teacher should NOT see the admin dashboard
  expect(screen.queryByTestId('admin-dashboard')).toBeNull();
  // Should be redirected to setup page
  expect(screen.getByTestId('setup-page')).toBeTruthy();
});

test('student role is redirected from admin route to /admin/setup', () => {
  const student = { id: 3, role: 'student', name: 'Student' };

  render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route
          path="/admin"
          element={
            <ProtectedAdminRoute
              component={AdminDashboard}
              user={student}
              onSignOut={() => {}}
            />
          }
        />
        <Route path="/admin/setup" element={<div data-testid="setup-page">Setup</div>} />
      </Routes>
    </MemoryRouter>,
  );

  expect(screen.queryByTestId('admin-dashboard')).toBeNull();
  expect(screen.getByTestId('setup-page')).toBeTruthy();
});

test('unauthenticated user (no user) is redirected from admin route', () => {
  render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route
          path="/admin"
          element={
            <ProtectedAdminRoute
              component={AdminDashboard}
              user={null}
              onSignOut={() => {}}
            />
          }
        />
        <Route path="/admin/setup" element={<div data-testid="setup-page">Setup</div>} />
      </Routes>
    </MemoryRouter>,
  );

  expect(screen.queryByTestId('admin-dashboard')).toBeNull();
  expect(screen.getByTestId('setup-page')).toBeTruthy();
});

// ---------------------------------------------------------------------------
// Role-based conditional rendering tests (simulating App.jsx behavior)
// ---------------------------------------------------------------------------

/**
 * Helper: renders a simplified role-based router that mirrors App.jsx logic.
 * Teacher sees teacher routes, student sees student routes,
 * anything else gets redirected to "/".
 */
function renderRoleRouter(user, initialPath = '/') {
  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';

  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        {isTeacher && (
          <>
            <Route path="/" element={<div data-testid="teacher-home">Teacher Home</div>} />
            <Route path="/classes" element={<TeacherClassrooms />} />
            <Route path="/notifications" element={<TeacherNotifs />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
        {isStudent && (
          <>
            <Route path="/" element={<div data-testid="student-home">Student Home</div>} />
            <Route path="/notifications" element={<StudentPrefs />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
        {!isTeacher && !isStudent && (
          <Route path="*" element={<Navigate to="/" replace />} />
        )}
      </Routes>
    </MemoryRouter>,
  );
}

test('student navigating to teacher-only /classes route is redirected to home', () => {
  const student = { id: 1, role: 'student' };
  renderRoleRouter(student, '/classes');

  // Student should NOT see teacher classrooms
  expect(screen.queryByTestId('teacher-classrooms')).toBeNull();
  // Should redirect to student home
  expect(screen.getByTestId('student-home')).toBeTruthy();
});

test('teacher navigating to /notifications sees teacher notifications (not student prefs)', () => {
  const teacher = { id: 2, role: 'teacher' };
  renderRoleRouter(teacher, '/notifications');

  expect(screen.getByTestId('teacher-notifs')).toBeTruthy();
  expect(screen.queryByTestId('student-prefs')).toBeNull();
});

test('student navigating to /notifications sees student preference page', () => {
  const student = { id: 1, role: 'student' };
  renderRoleRouter(student, '/notifications');

  expect(screen.getByTestId('student-prefs')).toBeTruthy();
  expect(screen.queryByTestId('teacher-notifs')).toBeNull();
});

test('teacher navigating to unknown route redirected to home', () => {
  const teacher = { id: 2, role: 'teacher' };
  renderRoleRouter(teacher, '/admin/super-secret');

  // The teacher's "*" fallback redirects to "/"
  expect(screen.getByTestId('teacher-home')).toBeTruthy();
});
