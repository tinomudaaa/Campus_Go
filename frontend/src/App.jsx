import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import OperatorDashboard from './pages/OperatorDashboard';
import OperatorAdminDashboard from './pages/OperatorAdminDashboard';
import StudentSignUp from './pages/StudentSignUp';
import AcceptInvite from './pages/AcceptInvite';
import Settings from './pages/Settings';

function App() {
  const user = JSON.parse(localStorage.getItem('campusgo_user') || 'null');

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup/student" element={<StudentSignUp />} />
        <Route path="/invite/:token" element={<AcceptInvite />} />
        <Route path="/student" element={user?.role === 'student' ? <StudentDashboard /> : <Navigate to="/" />} />
        <Route path="/admin" element={user?.role === 'platform_admin' ? <AdminDashboard /> : <Navigate to="/" />} />
        <Route path="/operator" element={user?.role === 'operator_staff' ? <OperatorDashboard /> : <Navigate to="/" />} />
        <Route path="/operator-admin" element={user?.role === 'operator_admin' ? <OperatorAdminDashboard /> : <Navigate to="/" />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
