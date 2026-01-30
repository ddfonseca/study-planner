/**
 * Main App Layout with Header and Navigation
 */
import { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useFeatureBadgesStore } from '@/store/featureBadgesStore';
import { Badge } from '@/components/ui/badge';
import { Calendar, BarChart3, Settings, Clock, FileText, Calculator, BookOpen } from 'lucide-react';
import { WorkspaceSelector } from '@/components/workspace';
import { UserMenu } from '@/components/layout/UserMenu';
import { WelcomeOverlay, OnboardingTour } from '@/components/onboarding';
import { OfflineBanner } from '@/components/ui/offline-banner';
import { ShortcutsHelpFAB, ShortcutsModal } from '@/components/keyboard';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export function AppLayout() {
  const { user, logout, isLoading } = useAuthStore();
  const { fetchCurrentSubscription } = useSubscriptionStore();
  const { isFeatureNew, markFeatureSeen } = useFeatureBadgesStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { isHelpOpen, setIsHelpOpen, pendingKey } = useKeyboardShortcuts();
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage or system preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    // Apply dark mode class to document
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Fetch subscription data when authenticated
  useEffect(() => {
    if (user) {
      fetchCurrentSubscription();
    }
  }, [user, fetchCurrentSubscription]);

  // Mark features as seen when user visits them
  useEffect(() => {
    const pathToFeature: Record<string, 'dashboard' | 'subjects' | 'allocation' | 'scratchpad'> = {
      '/app/dashboard': 'dashboard',
      '/app/subjects': 'subjects',
      '/app/allocation': 'allocation',
      '/app/scratchpad': 'scratchpad',
    };
    const feature = pathToFeature[location.pathname];
    if (feature && isFeatureNew(feature)) {
      markFeatureSeen(feature);
    }
  }, [location.pathname, isFeatureNew, markFeatureSeen]);

  const toggleTheme = () => setIsDark(!isDark);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/app/calendar', icon: Calendar, label: 'Calendário', badgeKey: null, tourId: null },
    { to: '/app/scratchpad', icon: FileText, label: 'Notas', badgeKey: 'scratchpad' as const, tourId: 'nav-scratchpad' },
    { to: '/app/dashboard', icon: BarChart3, label: 'Dashboard', badgeKey: 'dashboard' as const, tourId: 'nav-dashboard' },
    { to: '/app/subjects', icon: BookOpen, label: 'Tópicos', badgeKey: 'subjects' as const, tourId: 'nav-subjects' },
    { to: '/app/allocation', icon: Calculator, label: 'Alocação', badgeKey: 'allocation' as const, tourId: 'nav-allocation' },
    { to: '/app/settings', icon: Settings, label: 'Configurações', badgeKey: null, tourId: null },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Offline Banner */}
      <OfflineBanner />

      {/* Header */}
      <header className="bg-container border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            {/* Logo */}
            <Link to="/app/calendar" className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0">
              <Clock className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold text-foreground hidden sm:inline">
                Horas Líquidas
              </span>
            </Link>

            {/* Navigation - Desktop */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(({ to, icon: Icon, label, badgeKey, tourId }) => (
                <NavLink
                  key={to}
                  to={to}
                  title={label}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-2 lg:px-3 py-2 rounded-md text-sm font-medium transition-colors relative
                    ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`
                  }
                  {...(tourId && { 'data-tour': tourId })}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden lg:inline">{label}</span>
                  {badgeKey && isFeatureNew(badgeKey) && (
                    <Badge variant="default" className="hidden lg:inline-flex ml-1 px-1.5 py-0 text-[10px] bg-primary/90">
                      Novo
                    </Badge>
                  )}
                  {badgeKey && isFeatureNew(badgeKey) && (
                    <span className="lg:hidden absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full" />
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Right side: Workspace + User Menu */}
            <div className="flex items-center gap-2">
              <WorkspaceSelector />
              <UserMenu
                user={user}
                isDark={isDark}
                onToggleTheme={toggleTheme}
                onLogout={handleLogout}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden border-t border-border">
          <div className="flex justify-around py-2">
            {navItems.map(({ to, icon: Icon, label, badgeKey }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium transition-colors relative
                  ${
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`
                }
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {badgeKey && isFeatureNew(badgeKey) && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                  )}
                </div>
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Welcome Overlay for new users */}
      <WelcomeOverlay />

      {/* Onboarding Tour */}
      <OnboardingTour />

      {/* Keyboard Shortcuts FAB and Modal */}
      <ShortcutsHelpFAB
        onClick={() => setIsHelpOpen(true)}
        pendingKey={pendingKey}
      />
      <ShortcutsModal
        open={isHelpOpen}
        onOpenChange={setIsHelpOpen}
      />
    </div>
  );
}

export default AppLayout;
