/**
 * Main App Layout with Header and Navigation
 */
import { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useFeatureBadgesStore } from '@/store/featureBadgesStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, BarChart3, Settings, LogOut, Clock, Moon, Sun, FileText, Users } from 'lucide-react';
import { WorkspaceSelector } from '@/components/workspace';
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
    if (location.pathname === '/app/dashboard' && isFeatureNew('dashboard')) {
      markFeatureSeen('dashboard');
    }
  }, [location.pathname, isFeatureNew, markFeatureSeen]);

  const toggleTheme = () => setIsDark(!isDark);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/app/calendar', icon: Calendar, label: 'Calendário', badgeKey: null, tourId: null },
    { to: '/app/scratchpad', icon: FileText, label: 'Notas', badgeKey: null, tourId: null },
    { to: '/app/dashboard', icon: BarChart3, label: 'Dashboard', badgeKey: 'dashboard' as const, tourId: 'nav-dashboard' },
    { to: '/app/settings', icon: Settings, label: 'Configurações', badgeKey: null, tourId: null },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Offline Banner */}
      <OfflineBanner />

      {/* Header */}
      <header className="bg-container border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/app/calendar" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Clock className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold text-foreground hidden sm:inline">
                Horas Líquidas
              </span>
            </Link>

            {/* Workspace Selector */}
            <WorkspaceSelector />

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(({ to, icon: Icon, label, badgeKey, tourId }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
                    ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`
                  }
                  {...(tourId && { 'data-tour': tourId })}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {badgeKey && isFeatureNew(badgeKey) && (
                    <Badge variant="default" className="ml-1 px-1.5 py-0 text-[10px] bg-primary/90">
                      Novo
                    </Badge>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-2">
              {/* Community Button */}
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="text-muted-foreground hover:text-foreground"
                aria-label="Entrar na comunidade"
                title="Entrar na comunidade - Peça ajuda, sugira features, troque ideias"
              >
                <a href="https://t.me/+g27TaGZfnYIzZTUx" target="_blank" rel="noopener noreferrer">
                  <Users className="h-5 w-5" aria-hidden="true" />
                </a>
              </Button>

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-muted-foreground hover:text-foreground"
                aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
              >
                {isDark ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
              </Button>

              {user && (
                <div className="hidden sm:flex items-center gap-2">
                  {user.image && (
                    <img
                      src={user.image}
                      alt={user.name || 'User'}
                      className="h-8 w-8 rounded-full"
                    />
                  )}
                  <span className="text-sm text-muted-foreground">
                    {user.name || user.email}
                  </span>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                disabled={isLoading}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Sair da conta"
              >
                <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
                Sair
              </Button>
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
