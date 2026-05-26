import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Lenis from 'lenis';
import { useAuthStore } from './store/authStore';
import { ProtectedRoute } from './routes/ProtectedRoute';

import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import Dashboard from './pages/dashboard/Dashboard';
import AIMentor from './pages/dashboard/AIMentor';
import FocusMode from './pages/dashboard/FocusMode';
import Tests from './pages/dashboard/Tests';
import TestTake from './pages/dashboard/TestTake';
import Code from './pages/dashboard/Code';
import CodeProblem from './pages/dashboard/CodeProblem';
import Planner from './pages/dashboard/Planner';
import Career from './pages/dashboard/Career';
import CareerDetail from './pages/dashboard/CareerDetail';
import Feed from './pages/dashboard/Feed';
import ProfileSetup from './pages/auth/ProfileSetup';
import ProfessionalProfile from './pages/dashboard/ProfessionalProfile';
import Notifications from './pages/dashboard/Notifications';
import Messages from './pages/dashboard/Messages';
import Jobs from './pages/dashboard/Jobs';
import JobDetail from './pages/dashboard/JobDetail';
import JobApplications from './pages/dashboard/JobApplications';
import MyApplications from './pages/dashboard/MyApplications';
import MyPostedJobs from './pages/dashboard/MyPostedJobs';
import Onboarding from './pages/onboarding/Onboarding';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProblems from './pages/admin/AdminProblems';
import AdminProblemForm from './pages/admin/AdminProblemForm';
import AdminUsers from './pages/admin/AdminUsers';
import AdminReports from './pages/admin/AdminReports';
import { AdminRoute } from './components/auth/AdminRoute';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherClassrooms from './pages/teacher/TeacherClassrooms';
import TeacherNewClassroom from './pages/teacher/TeacherNewClassroom';
import TeacherClassroomDetail from './pages/teacher/TeacherClassroomDetail';
import ClassroomHub from './pages/dashboard/classroom/ClassroomHub';
import ClassroomDetail from './pages/dashboard/classroom/ClassroomDetail';
import { TeacherRoute } from './components/auth/TeacherRoute';
import NotFound from './pages/NotFound';

function App() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/ai"
        element={
          <ProtectedRoute>
            <AIMentor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/focus"
        element={
          <ProtectedRoute>
            <FocusMode />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/tests"
        element={
          <ProtectedRoute>
            <Tests />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/tests/:id"
        element={
          <ProtectedRoute>
            <TestTake />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/code"
        element={
          <ProtectedRoute>
            <Code />
          </ProtectedRoute>
        }
      />
      <Route
       path="/profile-setup"
        element={
          <ProtectedRoute>
            <ProfileSetup />
           </ProtectedRoute>
          }
         />
      <Route
        path="/dashboard/code/:slug"
        element={
          <ProtectedRoute>
            <CodeProblem />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/planner"
        element={
          <ProtectedRoute>
            <Planner />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/career"
        element={
          <ProtectedRoute>
            <Career />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/career/:slug"
        element={
          <ProtectedRoute>
            <CareerDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/feed"
        element={
          <ProtectedRoute>
            <Feed />
          </ProtectedRoute>
        }
      />
      {/* Onboarding */}
      <Route
        path="/onboarding"
        element={<ProtectedRoute><Onboarding /></ProtectedRoute>}
      />

      <Route
        path="/dashboard/profile"
        element={<ProtectedRoute><ProfessionalProfile /></ProtectedRoute>}
      />
      <Route
        path="/dashboard/profile/:userId"
        element={<ProtectedRoute><ProfessionalProfile /></ProtectedRoute>}
      />
      <Route
        path="/dashboard/notifications"
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        }
      />

      {/* Messages */}
      <Route path="/dashboard/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
      <Route path="/dashboard/messages/:userId" element={<ProtectedRoute><Messages /></ProtectedRoute>} />

      {/* Classroom (student-facing, but teachers can use it too) */}
      <Route path="/dashboard/classroom" element={<ProtectedRoute><ClassroomHub /></ProtectedRoute>} />
      <Route path="/dashboard/classroom/:id" element={<ProtectedRoute><ClassroomDetail /></ProtectedRoute>} />

      {/* Jobs */}
      <Route path="/dashboard/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
      <Route path="/dashboard/jobs/me/posted" element={<ProtectedRoute><MyPostedJobs /></ProtectedRoute>} />
      <Route path="/dashboard/jobs/me/applications" element={<ProtectedRoute><MyApplications /></ProtectedRoute>} />
      <Route path="/dashboard/jobs/:id" element={<ProtectedRoute><JobDetail /></ProtectedRoute>} />
      <Route path="/dashboard/jobs/:id/applications" element={<ProtectedRoute><JobApplications /></ProtectedRoute>} />

      {/* Admin routes — gated by ADMIN role */}
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/problems" element={<AdminRoute><AdminProblems /></AdminRoute>} />
      <Route path="/admin/problems/new" element={<AdminRoute><AdminProblemForm /></AdminRoute>} />
      <Route path="/admin/problems/:slug" element={<AdminRoute><AdminProblemForm /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
      <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />

      {/* Teacher routes — gated by TEACHER or ADMIN role */}
      <Route path="/teacher" element={<TeacherRoute><TeacherDashboard /></TeacherRoute>} />
      <Route path="/teacher/classrooms" element={<TeacherRoute><TeacherClassrooms /></TeacherRoute>} />
      <Route path="/teacher/classrooms/new" element={<TeacherRoute><TeacherNewClassroom /></TeacherRoute>} />
      <Route path="/teacher/classrooms/:id" element={<TeacherRoute><TeacherClassroomDetail /></TeacherRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
