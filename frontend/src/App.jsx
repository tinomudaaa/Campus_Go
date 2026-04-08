import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import OperatorDashboard from './pages/OperatorDashboard';
import OperatorAdminDashboard from './pages/OperatorAdminDashboard';
import StudentSignUp from './pages/StudentSignUp';
import AcceptInvite from './pages/AcceptInvite';
import Settings from './pages/Settings';

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

function getValidUser() {
  try {
    const user = JSON.parse(localStorage.getItem('campusgo_user') || 'null');
    const loginTime = parseInt(localStorage.getItem('campusgo_login_time') || '0', 10);

    if (!user || !user.role) return null;

    // Check session expiry
    if (Date.now() - loginTime > SESSION_DURATION_MS) {
      localStorage.clear();
      return null;
    }

    return user;
  } catch {
    localStorage.clear();
    return null;
  }
}

// Protects a route — redirects to / if not logged in or wrong role
function ProtectedRoute({ children, allowedRole }) {
  const user = getValidUser();

  if (!user) return <Navigate to="/" replace />;
  if (allowedRole && user.role !== allowedRole) return <Navigate to="/" replace />;

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Login />} />
        <Route path="/signup/student" element={<StudentSignUp />} />
        <Route path="/invite/:token" element={<AcceptInvite />} />

        {/* Protected routes — each locked to one role */}
        <Route path="/student" element={
          <ProtectedRoute allowedRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute allowedRole="platform_admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/operator" element={
          <ProtectedRoute allowedRole="operator_staff">
            <OperatorDashboard />
          </ProtectedRoute>
        } />
        <Route path="/operator-admin" element={
          <ProtectedRoute allowedRole="operator_admin">
            <OperatorAdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />

        {/* Catch-all — redirect unknown URLs to login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
