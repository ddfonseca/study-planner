/**
 * SPA App Component - Used within Astro pages for protected routes
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

// Pages
import { LoginPage } from '@/views/LoginPage';
import { CalendarPage } from '@/views/CalendarPage';
import { DashboardPage } from '@/views/DashboardPage';
import { SubjectAnalyticsPage } from '@/views/SubjectAnalyticsPage';
import { SettingsPage } from '@/views/SettingsPage';
import { ScratchpadPage } from '@/views/ScratchpadPage';

// Toast notifications
import { Toaster } from '@/components/ui/toaster';

export function SpaApp() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes with Auth Layout */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

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
          <Route path="analytics" element={<SubjectAnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="scratchpad" element={<ScratchpadPage />} />
        </Route>

        {/* Redirect unknown routes to app */}
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default SpaApp;
