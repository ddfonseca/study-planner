/**
 * Main App Component with Router Configuration
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

// Pages
import { LoginPage } from '@/pages/LoginPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { TermsPage } from '@/pages/TermsPage';
import { PrivacyPage } from '@/pages/PrivacyPage';

// Toast notifications
import { Toaster } from '@/components/ui/toaster';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes with Auth Layout */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* Public legal pages */}
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />

        {/* Protected routes with App Layout */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="calendar" replace />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Redirect root to app or login */}
        <Route path="/" element={<Navigate to="/app" replace />} />

        {/* 404 - Redirect to app */}
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
