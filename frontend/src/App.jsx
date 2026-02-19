import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import OperatorDashboard from './pages/OperatorDashboard';
import StudentSignUp from './pages/StudentSignUp';
import OperatorSignUp from './pages/OperatorSignUp';

function App() {
  const user = JSON.parse(localStorage.getItem('campusgo_user') || 'null');

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup/student" element={<StudentSignUp />} />
        <Route path="/signup/operator" element={<OperatorSignUp />} />
        <Route path="/student" element={user?.role === 'student' ? <StudentDashboard /> : <Navigate to="/" />} />
        <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} />
        <Route path="/operator" element={user?.role === 'operator' ? <OperatorDashboard /> : <Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;