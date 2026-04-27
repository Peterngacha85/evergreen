import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Layouts & Guards
import DashboardLayout from './components/layout/DashboardLayout';
import { ProtectedRoute, LeaderRoute, SuperAdminRoute } from './components/common/ProtectedRoute';

// Auth
import MemberLoginPage from './pages/auth/MemberLoginPage';
import LeaderLoginPage from './pages/auth/LeaderLoginPage';
import SuperAdminLoginPage from './pages/auth/SuperAdminLoginPage';

// Member Pages
import MemberDashboard from './pages/member/MemberDashboard';
import MemberContributions from './pages/member/MemberContributions';
import EventsPage from './pages/member/EventsPage';
import OfficialsPage from './pages/member/OfficialsPage';
import MemberClaimsPage from './pages/member/MemberClaimsPage';
import MemberRulesPage from './pages/member/MemberRulesPage';

// Leader Pages
import LeaderDashboard from './pages/leader/LeaderDashboard';
import ChangeRequestsPage from './pages/leader/ChangeRequestsPage';
import LeaderMembersPage from './pages/leader/LeaderMembersPage';
import LeaderContributionsPage from './pages/leader/LeaderContributionsPage';
import LeaderEventsPage from './pages/leader/LeaderEventsPage';
import LeaderClaimsPage from './pages/leader/LeaderClaimsPage';
import ManageLeadersPage from './pages/leader/ManageLeadersPage';
import LeaderRulesPage from './pages/leader/LeaderRulesPage';
import LeaderUnpaidPage from './pages/leader/LeaderUnpaidPage';
import MissionVisionPage from './pages/common/MissionVisionPage';
import FundsAvailablePage from './pages/common/FundsAvailablePage';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: '#111827', color: '#fff' } }} />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<MemberLoginPage />} />
          <Route path="/leader/login" element={<LeaderLoginPage />} />
          <Route path="/superadmin/login" element={<SuperAdminLoginPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Member Protected Routes */}
          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<MemberDashboard />} />
            <Route path="/contributions" element={<MemberContributions />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/officials" element={<OfficialsPage />} />
            <Route path="/claims" element={<MemberClaimsPage />} />
            <Route path="/rules" element={<MemberRulesPage />} />
            <Route path="/funds" element={<FundsAvailablePage />} />
          </Route>

          {/* Leader/SuperAdmin Protected Routes */}
          <Route element={<LeaderRoute><DashboardLayout /></LeaderRoute>}>
            <Route path="/leader/dashboard" element={<LeaderDashboard />} />
            <Route path="/leader/change-requests" element={<ChangeRequestsPage />} />
            
            {/* Full CRUD Leader Pages */}
            <Route path="/leader/members" element={<LeaderMembersPage />} />
            <Route path="/leader/contributions" element={<LeaderContributionsPage />} />
            <Route path="/leader/events" element={<LeaderEventsPage />} />
            <Route path="/leader/claims" element={<LeaderClaimsPage />} />
            
            {/* Officials view and Super Admin management */}
            <Route path="/leader/officials" element={<OfficialsPage />} />
            <Route path="/leader/rules" element={<LeaderRulesPage />} />
            <Route path="/leader/unpaid" element={<LeaderUnpaidPage />} />
            <Route path="/mission-vision" element={<MissionVisionPage />} />
            <Route path="/leader/funds" element={<FundsAvailablePage />} />
            <Route path="/leader/manage-leaders" element={<SuperAdminRoute><ManageLeadersPage /></SuperAdminRoute>} />
          </Route>
          
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
