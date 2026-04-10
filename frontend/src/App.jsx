import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import PublicLayout from './layouts/PublicLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Apply from './pages/Apply';
import Attendance from './pages/Attendance';
import Admissions from './pages/Admissions';
import AcademicManagement from './pages/AcademicManagement';
import QuizCreator from './pages/QuizCreator';
import QuizManager from './pages/QuizManager';
import StudentQuizDashboard from './pages/StudentQuizDashboard';
import QuizAttemptPage from './pages/QuizAttemptPage';
import QuizResultPage from './pages/QuizResultPage';
import StudentRiskAnalysis from './pages/StudentRiskAnalysis';
import Profile from './pages/Profile';
import MarksEntry from './pages/MarksEntry';
import StudentManagement from './pages/StudentManagement';
import AttendanceControlCenter from './pages/AttendanceControlCenter';
import AdminAttendance from './pages/AdminAttendance';
import FacultyManagement from './pages/FacultyManagement';
import AdminMarksControl from './pages/AdminMarksControl';
import StudentMarks from './pages/StudentMarks';
import OverallMarksView from './pages/OverallMarksView';
import Home from './pages/public/Home';
import About from './pages/public/About';
import Contact from './pages/public/Contact';
import Courses from './pages/public/Courses';
import Register from './pages/public/Register';
import RegisterFaculty from './pages/public/RegisterFaculty';
import Legal from './pages/public/Legal';
import ForgotPassword from './pages/public/ForgotPassword';
import ResetPassword from './pages/public/ResetPassword';
import ScrollToTop from './components/ScrollToTop';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './theme/ThemeProvider';

// Higher Order Component for Protected Routes
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();
  
  if (loading) return (
    <div className="h-screen bg-background flex items-center justify-center text-textSecondary">
      <div className="animate-spin text-4xl">⏳</div>
    </div>
  );

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  if (allowedRoles && !allowedRoles.includes(user?.role?.toLowerCase())) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Route for redirecting already logged-in users away from login
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <Router>
        <ScrollToTop />
        <AuthProvider>
          <Routes>
            
            {/* Main Public Website */}
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<Home />} />
              <Route path="about" element={<About />} />
              <Route path="courses" element={<Courses />} />
              <Route path="contact" element={<Contact />} />
              <Route path="register" element={<Register />} />
              <Route path="legal" element={<Legal />} />
            </Route>

            {/* Authentication & Onboarding Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              }
            />
            <Route
              path="/reset-password/:token"
              element={
                <PublicRoute>
                  <ResetPassword />
                </PublicRoute>
              }
            />
            <Route
              path="/apply"
              element={
                <PublicRoute>
                  <Apply />
                </PublicRoute>
              }
            />

            <Route
              path="/register-faculty"
              element={
                <PublicRoute>
                  <RegisterFaculty />
                </PublicRoute>
              }
            />

            {/* Protected Dashboard Layout Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="admissions" element={<Admissions />} />
              <Route path="academic" element={<AcademicManagement />} />
              <Route path="quiz-creator" element={<ProtectedRoute allowedRoles={['faculty', 'admin', 'supadmin']}><QuizCreator /></ProtectedRoute>} />
              <Route path="quiz-library" element={<ProtectedRoute allowedRoles={['faculty', 'admin', 'supadmin']}><QuizManager /></ProtectedRoute>} />
              <Route path="assessments" element={<ProtectedRoute allowedRoles={['student']}><StudentQuizDashboard /></ProtectedRoute>} />
              <Route path="ai-risk" element={<div className="text-rose-500 p-8 text-2xl font-semibold">AI Risk Engine Module</div>} />
              <Route path="profile" element={<Profile />} />
              <Route path="profile/:id" element={<Profile />} />
              <Route path="admin/students" element={<StudentManagement />} />
              <Route path="admin/faculty" element={<ProtectedRoute allowedRoles={['admin', 'supadmin']}><FacultyManagement /></ProtectedRoute>} />
              <Route path="admin/student-risk/:id" element={<StudentRiskAnalysis />} />
              <Route path="admin/attendance-control" element={<ProtectedRoute allowedRoles={['admin', 'supadmin']}><AttendanceControlCenter /></ProtectedRoute>} />
              <Route path="admin/attendance" element={<ProtectedRoute allowedRoles={['admin', 'supadmin']}><AdminAttendance /></ProtectedRoute>} />
              <Route path="admin/marks-governance" element={<ProtectedRoute allowedRoles={['admin', 'supadmin']}><AdminMarksControl /></ProtectedRoute>} />
              <Route path="marks-entry" element={<ProtectedRoute allowedRoles={['faculty']}><MarksEntry /></ProtectedRoute>} />
              <Route path="overall-marks/:subject_id" element={<ProtectedRoute allowedRoles={['admin', 'supadmin', 'faculty']}><OverallMarksView /></ProtectedRoute>} />
              <Route path="my-marks" element={<ProtectedRoute allowedRoles={['student']}><StudentMarks /></ProtectedRoute>} />
            </Route>

            {/* Standalone Protected Routes (No Layout / Full Screen) */}
            <Route
              path="/quiz/:id/attempt"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <QuizAttemptPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quiz/:id/result"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <QuizResultPage />
                </ProtectedRoute>
              }
            />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
