import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Calendar,
  Target,
  Moon,
  Sun,
  ChevronDown,
  BookOpen,
  TrendingUp,
  Focus,
  Check,
  Crown,
  Clock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// FAQ Item component
function FAQItem({
  question,
  answer,
  isOpen,
  onClick,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={onClick}
        className="flex w-full items-center justify-between py-4 text-left font-medium hover:text-accent transition-colors duration-150"
      >
        {question}
        <ChevronDown
          className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ease-in-out ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`grid transition-all duration-200 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <p className="pb-4 text-muted-foreground">{answer}</p>
        </div>
      </div>
    </div>
  );
}

// Gradient colors for landing page preview (warm tones: stone → amber → terracotta)
const previewGradientColors: Record<number, string> = {
  0: 'bg-card',
  1: 'bg-stone-100 dark:bg-stone-800',
  2: 'bg-amber-100 dark:bg-amber-900/50',
  3: 'bg-amber-200 dark:bg-amber-800/60',
  4: 'bg-[#c17a5c] dark:bg-[#c17a5c]',
};

// Calendar Preview component with gradient heatmap style
function CalendarPreview() {
  const days = [
    { day: 16, label: 'Mon', intensity: 3, session: 'API', time: '1h30' },
    { day: 17, label: 'Tue', intensity: 2, session: 'Review', time: '45m' },
    { day: 18, label: 'Wed', intensity: 0, session: '', time: '' },
    { day: 19, label: 'Thu', intensity: 4, session: 'Feature', time: '2h', isToday: true },
    { day: 20, label: 'Fri', intensity: 1, session: 'Bugfix', time: '30m' },
    { day: 21, label: 'Sat', intensity: 0, session: '', time: '' },
    { day: 22, label: 'Sun', intensity: 0, session: '', time: '' },
  ];

  // High intensity needs better text contrast - level 4 (terracotta) needs white text
  const getTextClass = (intensity: number, isToday: boolean) => {
    if (intensity === 4) return 'text-white';
    if (isToday) return 'text-primary';
    if (intensity >= 3) return 'text-foreground';
    return 'text-muted-foreground';
  };

  // Check if intensity needs light text (terracotta background)
  const needsLightText = (intensity: number) => intensity === 4;

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 sm:gap-3">
        {days.map((d, i) => {
          const isHighIntensity = d.intensity >= 3;
          const lightText = needsLightText(d.intensity);

          return (
            <div
              key={i}
              className={`
                relative rounded-xl p-3 sm:p-4 transition-all border border-border/30
                ${d.isToday
                  ? 'ring-2 ring-accent ring-offset-2 ring-offset-background'
                  : ''
                }
                ${previewGradientColors[d.intensity]}
              `}
            >
              {/* Day label */}
              <div className={`text-[10px] sm:text-xs font-medium mb-1 ${lightText ? 'text-white/80' : isHighIntensity ? 'text-foreground/70' : 'text-muted-foreground'}`}>
                {d.label}
              </div>
              {/* Day number */}
              <div className={`text-lg sm:text-xl font-bold ${getTextClass(d.intensity, !!d.isToday)}`}>
                {d.day}
              </div>
              {/* Session info */}
              {d.session ? (
                <div className={`mt-2 text-[10px] sm:text-xs ${lightText ? 'text-white/90' : isHighIntensity ? 'text-foreground/80' : 'text-muted-foreground'}`}>
                  <div className="font-medium">{d.session}</div>
                  <div className={`font-semibold ${lightText ? 'text-white' : isHighIntensity ? 'text-foreground' : 'text-primary'}`}>{d.time}</div>
                </div>
              ) : (
                <div className={`mt-2 text-[10px] sm:text-xs ${lightText ? 'text-white/50' : isHighIntensity ? 'text-foreground/50' : 'text-muted-foreground/50'}`}>
                  —
                </div>
              )}
            </div>
          );
        })}

        {/* Total card */}
        <div className="rounded-xl p-3 sm:p-4 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 shadow-md">
          <div className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-1">Total</div>
          <div className="text-lg sm:text-xl font-bold text-primary">5h 45m</div>
          <div className="mt-2">
            {/* Progress bar */}
            <div className="h-1.5 bg-primary/20 rounded-full overflow-hidden">
              <div className="h-full w-[60%] bg-primary rounded-full" />
            </div>
            <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              60% of 10h goal
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const faqs = [
    {
      question: 'Is ShipHours only for individual engineers?',
      answer:
        'Yes, ShipHours is designed for individual contributors who want to take ownership of their time and focus.',
    },
    {
      question: 'How is this different from a time tracker for billing?',
      answer:
        'ShipHours is for personal productivity, not billing. It helps you understand your focus patterns, not report hours to clients.',
    },
    {
      question: 'Does it integrate with my tools?',
      answer:
        'Not yet — ShipHours is intentionally simple. Just open it and log your sessions.',
    },
    {
      question: 'What are Tasks and Projects?',
      answer:
        'Tasks are what you work on (Bug fix, Code review, Feature dev). Projects group related tasks together (Backend API, Mobile App).',
    },
  ];

  const plans = [
    {
      name: 'Free',
      icon: BookOpen,
      price: '$0',
      period: 'forever',
      description: 'Everything you need to start tracking your focus.',
      features: [
        'Visual heatmap calendar',
        '1 study cycle',
        '2 workspaces',
        'Up to 20 sessions per day',
        '30 days of history',
        'Weekly goals',
        'Dark mode',
      ],
      cta: 'Start for free',
      highlighted: false,
    },
    {
      name: 'Pro Lifetime',
      icon: Crown,
      price: '$19',
      period: 'one-time payment',
      description: 'Lifetime access to all premium features.',
      features: [
        'Everything in Free',
        '10 study cycles',
        '10 workspaces',
        'Unlimited sessions',
        '1 year of history',
        'Export data',
        'Share with 5 people',
        'Access forever',
      ],
      cta: 'Get lifetime access',
      highlighted: true,
    },
  ];

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <span className="font-semibold text-base sm:text-lg">ShipHours</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-foreground"
            >
              {isDark ? <Sun className="h-4 w-4 sm:h-5 sm:w-5" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5" />}
            </Button>
            <Link to="/login">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-10 sm:py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 sm:mb-6">
            Track your real productive hours,{' '}
            <span className="text-primary">not just time at a desk</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-8 px-2">
            ShipHours helps software engineers measure deep work, build focus habits,
            and stay intentional about where their time goes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
            <Link to="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-sm sm:text-base">
                Start tracking for free
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              onClick={scrollToFeatures}
              className="w-full sm:w-auto text-sm sm:text-base"
            >
              Learn more
            </Button>
          </div>
        </div>
      </section>

      {/* Calendar Preview Section */}
      <section className="py-8 sm:py-12 md:py-16 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-center mb-6 sm:mb-8">
            Visualize your progress
          </h2>
          <CalendarPreview />
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-8 border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-center text-muted-foreground text-sm">
            Used by <span className="font-medium text-foreground">engineers worldwide</span>
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-center mb-3 sm:mb-4">
            Everything you need to work with more intention
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground text-center mb-8 sm:mb-12 max-w-2xl mx-auto px-2">
            It's not about working more. It's about working with clarity.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Feature 1 - Heatmap Calendar */}
            <Card className="relative overflow-hidden border-border group hover:border-accent/50 transition-all">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#c17a5c] to-amber-500" />
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#c17a5c]/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-6 w-6 text-[#c17a5c]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Visualize your effort day by day</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      See your work patterns at a glance with a heatmap calendar. Know your productive days.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feature 2 - Deep Work */}
            <Card className="relative overflow-hidden border-border group hover:border-accent/50 transition-all">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <Focus className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Measure deep work, not seat time</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Track focused work sessions separately from meetings and context-switching. Know your real output.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feature 3 - Weekly Goals */}
            <Card className="relative overflow-hidden border-border group hover:border-accent/50 transition-all">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500" />
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <Target className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Set targets and stay on track</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Define weekly hour goals, track progress in real time, and build consistency over sprints.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feature 4 - Patterns Over Time */}
            <Card className="relative overflow-hidden border-border group hover:border-accent/50 transition-all">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-amber-500" />
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Understand your patterns over time</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      See which tasks and projects consume your time. Use data to improve your work habits.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 sm:py-12 md:py-16 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h3 className="text-lg sm:text-xl md:text-2xl font-semibold mb-3 sm:mb-4">
            Ready to take ownership of your time?
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 px-2">
            Start for free and see the difference of measuring your real focus.
          </p>
          <Link to="/login">
            <Button size="lg" className="text-sm sm:text-base">
              Start tracking for free
            </Button>
          </Link>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 sm:py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-center mb-8 sm:mb-12">
            Frequently asked questions
          </h2>
          <Card>
            <CardContent className="p-6">
              {faqs.map((faq, index) => (
                <FAQItem
                  key={index}
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openFAQ === index}
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                />
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 sm:py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-center mb-3 sm:mb-4">
            Choose your plan
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground text-center mb-8 sm:mb-12">
            Start free or unlock everything with a single payment.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {plans.map((plan, index) => {
              const IconComponent = plan.icon;
              const isPro = plan.highlighted;
              return (
                <Card
                  key={index}
                  className={`relative ${
                    isPro
                      ? 'border-primary shadow-lg shadow-primary/10 ring-2 ring-primary'
                      : 'border-border'
                  }`}
                >
                  {isPro && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary hover:bg-primary/90 text-white">
                        Recommended
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-6 pt-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-lg ${
                        isPro ? 'bg-primary/10' : 'bg-muted'
                      }`}>
                        <IconComponent className={`h-5 w-5 ${
                          isPro ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                      </div>
                      <h3 className="text-xl font-semibold">{plan.name}</h3>
                    </div>
                    <p className="text-muted-foreground text-sm mb-4">
                      {plan.description}
                    </p>
                    <div className="mb-6">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground text-sm ml-1">{plan.period}</span>
                    </div>
                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Check className={`h-4 w-4 flex-shrink-0 ${isPro ? 'text-primary' : 'text-green-500'}`} />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link to="/login" className="block">
                      <Button
                        size="lg"
                        variant={isPro ? 'default' : 'outline'}
                        className="w-full"
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer className="py-6 sm:py-8 border-t border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <span className="font-medium text-sm sm:text-base">ShipHours</span>
            </div>
            <div className="flex gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
              <Link to="/terms" className="hover:text-foreground transition-colors">
                Terms of Use
              </Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              © {new Date().getFullYear()} ShipHours
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
