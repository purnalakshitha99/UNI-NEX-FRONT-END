import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import HomePage from './components/HomePage';
import AuthPage from './components/AuthPage';
import UserDashboard from './components/UserDashboard';
import UserProfile from './components/UserProfile';
import VerificationPending from './components/VerificationPending';
import VerificationSuccess from './components/VerificationSuccess';
import AuthService from './services/authService';
import AdminDashboard from './components/AdminDashboard';
import AdminUsers from './components/AdminUsers';
import AdminEvents from './components/AdminEvents';
import AdminAnnouncements from './components/AdminAnnouncements';
import AdminSettings from './components/AdminSettings';
import AdminPaymentSlips from './components/AdminPaymentSlips';
import AdminEventBookings from './components/AdminEventBookings';
import AdminAttendance from './components/AdminAttendance';
import CreateEventPage from './components/Createeventpage';
import MyEventsPage from './components/MyEventsPage';
import EventsPage from './components/EventsPage';
import EventPaymentPage from './components/EventPaymentPage';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const user = AuthService.getCurrentUser();
  
  if (!user) {
    // Not logged in - redirect to auth
    return <Navigate to="/auth" />;
  }
  
  // Role check for admin routes
  if (adminOnly && user.user?.role !== 'admin') {
    return <Navigate to="/" />;
  }
  
  // All good - show the protected component
  return children;
};

function App() {
  const [user, setUser] = React.useState(AuthService.getCurrentUser());

  // Listen for auth changes globally
  React.useEffect(() => {
    const handleAuthChange = () => {
      setUser(AuthService.getCurrentUser());
    };
    window.addEventListener('authChange', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    return () => {
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:eventId/payment" element={<EventPaymentPage />} />
        
        {/* Verification Routes */}
        <Route path="/verification-pending" element={<VerificationPending />} />
        <Route path="/verify-email/:token" element={<VerificationSuccess />} />
        
        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-event"
          element={
            <ProtectedRoute>
              <CreateEventPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-events"
          element={
            <ProtectedRoute>
              <MyEventsPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/events"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminEvents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/announcements"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminAnnouncements />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/payment-slips"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminPaymentSlips />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/event-bookings"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminEventBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/attendance"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminAttendance />
            </ProtectedRoute>
          }
        />
        
        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;