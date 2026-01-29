/**
 * Main App Component with Router Configuration
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

// Pages
import { LandingPage } from '@/views/LandingPage';
import { LoginPage } from '@/views/LoginPage';
import { CalendarPage } from '@/views/CalendarPage';
import { DashboardPage } from '@/views/DashboardPage';
import { SubjectAnalyticsPage } from '@/views/SubjectAnalyticsPage';
import { SettingsPage } from '@/views/SettingsPage';
import { ScratchpadPage } from '@/views/ScratchpadPage';
import { AllocationPage } from '@/views/AllocationPage';
import { SubjectsPage } from '@/views/SubjectsPage';
import { TermsPage } from '@/views/TermsPage';
import { PrivacyPage } from '@/views/PrivacyPage';

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
          <Route path="analytics" element={<SubjectAnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="scratchpad" element={<ScratchpadPage />} />
          <Route path="allocation" element={<AllocationPage />} />
          <Route path="subjects" element={<SubjectsPage />} />
        </Route>

        {/* Landing page */}
        <Route path="/" element={<LandingPage />} />

        {/* 404 - Redirect to app */}
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
