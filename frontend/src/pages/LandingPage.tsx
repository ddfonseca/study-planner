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
    { day: 16, label: 'Seg', intensity: 3, session: 'Mat', time: '1h30' },
    { day: 17, label: 'Ter', intensity: 2, session: 'Fís', time: '45m' },
    { day: 18, label: 'Qua', intensity: 0, session: '', time: '' },
    { day: 19, label: 'Qui', intensity: 4, session: 'Quím', time: '2h', isToday: true },
    { day: 20, label: 'Sex', intensity: 1, session: 'Mat', time: '30m' },
    { day: 21, label: 'Sáb', intensity: 0, session: '', time: '' },
    { day: 22, label: 'Dom', intensity: 0, session: '', time: '' },
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
              60% de 10h
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
      question: 'O Horas Líquidas é gratuito?',
      answer:
        'Sim, oferecemos um plano gratuito com recursos essenciais para organizar seus estudos. Para funcionalidades avançadas como matérias ilimitadas e estatísticas detalhadas, temos o plano Pro.',
    },
    {
      question: 'Meus dados ficam salvos na nuvem?',
      answer:
        'Sim, seus dados são sincronizados automaticamente na nuvem. Você pode acessar suas sessões de estudo de qualquer dispositivo.',
    },
    {
      question: 'Posso usar no celular?',
      answer:
        'Sim, a interface é totalmente responsiva e funciona perfeitamente em smartphones, tablets e computadores.',
    },
    {
      question: 'Como defino minhas metas semanais?',
      answer:
        'Nas configurações do aplicativo, você pode definir quantas horas deseja estudar por semana. O calendário mostrará seu progresso em relação a essa meta.',
    },
  ];

  const plans = [
    {
      name: 'Gratuito',
      icon: BookOpen,
      price: 'R$ 0',
      period: 'para sempre',
      description: 'Perfeito para começar a organizar seus estudos.',
      features: [
        'Calendário visual com heatmap',
        '1 ciclo de estudo',
        '2 workspaces',
        'Até 20 sessões por dia',
        '30 dias de histórico',
        'Metas semanais',
        'Modo escuro',
      ],
      cta: 'Começar grátis',
      highlighted: false,
    },
    {
      name: 'Pro Vitalício',
      icon: Crown,
      price: 'R$ 19,90',
      period: 'pagamento único',
      description: 'Acesso vitalício a todos os recursos premium.',
      features: [
        'Tudo do plano Gratuito',
        '10 ciclos de estudo',
        '10 workspaces',
        'Sessões ilimitadas',
        '1 ano de histórico',
        'Exportar dados',
        'Compartilhar com 5 pessoas',
        'Acesso para sempre',
      ],
      cta: 'Comprar acesso vitalício',
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
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">Horas Líquidas</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Link to="/login">
              <Button variant="outline" size="sm">
                Entrar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Controle quanto tempo você{' '}
            <span className="text-primary">realmente</span> estuda
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Não quanto tempo passa na cadeira. Registre sessões de foco, visualize
            padrões em um calendário heatmap e atinja suas metas semanais.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login">
              <Button size="lg" className="w-full sm:w-auto">
                Começar a medir meu foco
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              onClick={scrollToFeatures}
              className="w-full sm:w-auto"
            >
              Saiba mais
            </Button>
          </div>
        </div>
      </section>

      {/* Calendar Preview Section */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-semibold text-center mb-8">
            Visualize seu progresso
          </h2>
          <CalendarPreview />
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-8 border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-center text-muted-foreground text-sm">
            Usado por estudantes de <span className="font-medium text-foreground">medicina</span>, <span className="font-medium text-foreground">direito</span> e <span className="font-medium text-foreground">concursos públicos</span>
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-semibold text-center mb-4">
            Tudo que você precisa para estudar melhor
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Não é sobre estudar mais. É sobre estudar com clareza.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Feature 1 - Calendário Heatmap */}
            <Card className="relative overflow-hidden border-border group hover:border-accent/50 transition-all">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#c17a5c] to-amber-500" />
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#c17a5c]/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-6 w-6 text-[#c17a5c]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Calendário Heatmap</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Visualize seu esforço dia a dia com cores de intensidade. Identifique padrões e entenda seus hábitos de estudo.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feature 2 - Foco Real */}
            <Card className="relative overflow-hidden border-border group hover:border-accent/50 transition-all">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <Focus className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Foco Real</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Meça tempo de concentração, não tempo sentado. Num mundo de distrações, saber seu foco real é um superpoder.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feature 3 - Metas Semanais */}
            <Card className="relative overflow-hidden border-border group hover:border-accent/50 transition-all">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500" />
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <Target className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Metas Semanais</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Defina objetivos e acompanhe seu progresso em tempo real. Consistência de 1h por dia vale mais que 7h no domingo.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feature 4 - Histórico e Padrões */}
            <Card className="relative overflow-hidden border-border group hover:border-accent/50 transition-all">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-amber-500" />
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Histórico e Padrões</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Acompanhe sua evolução semana a semana. Compare com você mesmo e supere seu eu de ontem.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h3 className="text-xl md:text-2xl font-semibold mb-4">
            Pronto para estudar com mais clareza?
          </h3>
          <p className="text-muted-foreground mb-6">
            Comece gratuitamente e veja a diferença de medir seu foco real.
          </p>
          <Link to="/login">
            <Button size="lg">
              Começar grátis agora
            </Button>
          </Link>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-semibold text-center mb-12">
            Perguntas frequentes
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
      <section id="pricing" className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-semibold text-center mb-4">
            Escolha seu plano
          </h2>
          <p className="text-muted-foreground text-center mb-12">
            Comece grátis ou desbloqueie tudo com um único pagamento.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        Recomendado
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
      <footer className="py-8 border-t border-border">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <span className="font-medium">Horas Líquidas</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link to="/terms" className="hover:text-foreground transition-colors">
                Termos de Uso
              </Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">
                Política de Privacidade
              </Link>
            </div>
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Horas Líquidas
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
