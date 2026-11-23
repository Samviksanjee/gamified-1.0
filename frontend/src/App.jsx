import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { api, auth } from './api.js';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import StudentHome from './pages/StudentHome';
import MyLearning from './pages/MyLearning';
import Resources from './pages/Resources';
import JoinClassroom from './pages/JoinClassroom';
import TeacherHome from './pages/TeacherHome';
import ClassesPage from './pages/ClassesPage';
import CreateActivityPage from './pages/CreateActivityPage';
import DraftsPage from './pages/DraftsPage';
import StudentProgressPage from './pages/StudentProgressPage';
import ResourcesPage from './pages/ResourcesPage';
import StudentJoinPage from './pages/StudentJoinPage';
import TopicPage from './pages/TopicPage';
import ReviewPage from './pages/ReviewPage';
import PlayPage from './pages/PlayPage';
import DetailedReportPage from './pages/DetailedReportPage';
import PuzzlePlayer from './games/puzzle/PuzzlePlayer.jsx';
import CrosswordPlayer from './games/crossword/CrosswordPlayer.jsx';
import PuzzleResultsPage from './pages/PuzzleResultsPage.jsx';
import CrosswordResultsPage from './pages/CrosswordResultsPage.jsx';
import TeacherNotificationsPage from './pages/TeacherNotificationsPage.jsx';
import StudentNotificationSettings from './pages/StudentNotificationSettings.jsx';
import {
  SuperAdminSetup,
  SuperAdminDashboard,
  SuperAdminTeachers,
  SuperAdminInvitations,
  SuperAdminAuditLogs,
  SuperAdminTeacherDetail,
  SuperAdminStudents,
  SuperAdminStudentDetail,
  SuperAdminEnrollment,
  SuperAdminClassrooms,
  SuperAdminClassroomDetail,
  SuperAdminComparison,
  SuperAdminAnalytics,
  SuperAdminActivities,
  SuperAdminGames,
  SuperAdminReports,
  SuperAdminSettings,
  SuperAdminWhatsApp,
} from './pages/SuperAdmin';
import FirstLoginPasswordPage from './pages/FirstLoginPasswordPage';
import AcceptInvitation from './pages/AcceptInvitation';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { AppProvider } from './context/AppContext';
import ToastContainer from './components/ToastContainer';
import StudentDashboard from './pages/StudentDashboard';
import StudentLayout from './components/StudentLayout';
import './styles/globals.css';

function AppContent({ user, setUser, ready }) {
  const handleSignOut = () => {
    auth.set(null);
    setUser(null);
  };

  if (!ready) {
    return (
      <div className="app">
        <div style={{ display: 'grid', placeItems: 'center', height: '100vh' }}>
          <p role="status">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login onAuth={(data) => {
          auth.set(data.token);
          setUser(data.user);
        }} />} />
        <Route path="/admin/setup" element={<SuperAdminSetup />} />
        <Route path="/accept-invitation" element={<AcceptInvitation />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Accounts created with an administrator-issued temporary password must choose their own before using the app.
  if (user.must_change_password) {
    return (
      <FirstLoginPasswordPage
        user={user}
        onSignOut={handleSignOut}
        onChanged={() => setUser((u) => ({ ...u, must_change_password: false }))}
      />
    );
  }

  // Super Admin routes
  if (user.role === 'super_admin') {
    const guard = (Page, extra = {}) => (
      <ProtectedAdminRoute component={Page} user={user} onSignOut={handleSignOut} {...extra} />
    );
    return (
      <Routes>
        <Route path="/admin/setup" element={<SuperAdminSetup />} />
        <Route path="/admin" element={guard(SuperAdminDashboard)} />
        <Route path="/admin/dashboard" element={guard(SuperAdminDashboard)} />
        <Route path="/admin/teachers" element={guard(SuperAdminTeachers)} />
        <Route path="/admin/teachers/:teacherId" element={guard(SuperAdminTeacherDetail)} />
        <Route path="/admin/invitations" element={guard(SuperAdminInvitations)} />
        <Route path="/admin/students" element={guard(SuperAdminStudents)} />
        <Route path="/admin/students/enrollment" element={guard(SuperAdminEnrollment)} />
        <Route path="/admin/students/:studentId" element={guard(SuperAdminStudentDetail)} />
        <Route path="/admin/classrooms" element={guard(SuperAdminClassrooms)} />
        <Route path="/admin/classrooms/:classroomId" element={guard(SuperAdminClassroomDetail)} />
        <Route path="/admin/analytics" element={guard(SuperAdminAnalytics, { view: 'overall' })} />
        <Route path="/admin/analytics/compare" element={guard(SuperAdminComparison)} />
        <Route path="/admin/analytics/teachers" element={guard(SuperAdminAnalytics, { view: 'teachers' })} />
        <Route path="/admin/analytics/students" element={guard(SuperAdminAnalytics, { view: 'students' })} />
        <Route path="/admin/activities" element={guard(SuperAdminActivities)} />
        <Route path="/admin/activities/games" element={guard(SuperAdminGames)} />
        <Route path="/admin/reports" element={guard(SuperAdminReports)} />
        <Route path="/admin/audit-logs" element={guard(SuperAdminAuditLogs)} />
        <Route path="/admin/settings" element={guard(SuperAdminSettings)} />
        <Route path="/admin/whatsapp" element={guard(SuperAdminWhatsApp, { view: 'status' })} />
        <Route path="/admin/whatsapp/templates" element={guard(SuperAdminWhatsApp, { view: 'templates' })} />
        <Route path="/admin/whatsapp/analytics" element={guard(SuperAdminWhatsApp, { view: 'analytics' })} />
        <Route path="/admin/whatsapp/logs" element={guard(SuperAdminWhatsApp, { view: 'logs' })} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      {user.role === 'teacher' ? (
        <>
          <Route path="/" element={<TeacherHome user={user} onSignOut={handleSignOut} />} />
          <Route path="/teacher" element={<TeacherHome user={user} onSignOut={handleSignOut} />} />
          <Route path="/classes" element={<ClassesPage user={user} onSignOut={handleSignOut} />} />
          <Route path="/create" element={<CreateActivityPage user={user} onSignOut={handleSignOut} />} />
          <Route path="/drafts" element={<DraftsPage user={user} onSignOut={handleSignOut} />} />
          <Route path="/analytics" element={<StudentProgressPage user={user} onSignOut={handleSignOut} />} />
          <Route path="/resources" element={<ResourcesPage user={user} onSignOut={handleSignOut} />} />
          <Route path="/topics/:topicId" element={<TopicPage user={user} onSignOut={handleSignOut} />} />
          <Route path="/review/:activityId" element={<ReviewPage user={user} onSignOut={handleSignOut} />} />
          <Route path="/preview/:activityId" element={<ReviewPage user={user} onSignOut={handleSignOut} />} />
          <Route path="/reports/:topicId" element={<DetailedReportPage user={user} onSignOut={handleSignOut} />} />
          <Route path="/puzzle-results/:activityId" element={<PuzzleResultsPage user={user} onSignOut={handleSignOut} />} />
          <Route path="/crossword-results/:activityId" element={<CrosswordResultsPage user={user} onSignOut={handleSignOut} />} />
          <Route path="/notifications" element={<TeacherNotificationsPage user={user} onSignOut={handleSignOut} />} />
          {/* Teacher test-play: renders CrosswordPlayer in preview mode */}
          <Route path="/play/crossword/:activityId" element={<CrosswordPlayer />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      ) : (
        <>
          {/* Student routes — all share the StudentLayout shell */}
          <Route element={<StudentLayout user={user} onSignOut={handleSignOut} />}>
            <Route path="/"               element={<StudentHome user={user} onSignOut={handleSignOut} />} />
            <Route path="/home"           element={<StudentHome user={user} onSignOut={handleSignOut} />} />
            <Route path="/learning"       element={<MyLearning user={user} onSignOut={handleSignOut} />} />
            <Route path="/resources"      element={<Resources user={user} onSignOut={handleSignOut} />} />
            <Route path="/dashboard"      element={<StudentDashboard user={user} onSignOut={handleSignOut} />} />
            <Route path="/join-classroom" element={<JoinClassroom user={user} onSignOut={handleSignOut} />} />
            <Route path="/join"           element={<StudentJoinPage user={user} onSignOut={handleSignOut} />} />
            <Route path="/notifications"  element={<StudentNotificationSettings user={user} onSignOut={handleSignOut} />} />
          </Route>
          {/* Play / game routes — full-screen, no student nav bar */}
          <Route path="/play/a/:activityId"      element={<PlayPage user={user} onSignOut={handleSignOut} />} />
          <Route path="/play/r/:objectiveId"     element={<PlayPage user={user} onSignOut={handleSignOut} />} />
          <Route path="/play/t/:topicId"         element={<PlayPage user={user} onSignOut={handleSignOut} />} />
          <Route path="/play/puzzle/:activityId" element={<PuzzlePlayer />} />
          <Route path="/play/crossword/:activityId" element={<CrosswordPlayer />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}
    </Routes>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!auth.token) {
      setReady(true);
      return;
    }
    api
      .me()
      .then(setUser)
      .catch(() => auth.set(null))
      .finally(() => setReady(true));
  }, []);

  return (
    <AppProvider>
      <ToastProvider>
        <ConfirmProvider>
          <BrowserRouter>
            <AppContent user={user} setUser={setUser} ready={ready} />
            <ToastContainer />
          </BrowserRouter>
        </ConfirmProvider>
      </ToastProvider>
    </AppProvider>
  );
}
