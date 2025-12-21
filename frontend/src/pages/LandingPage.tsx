import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Calendar,
  Target,
  BarChart3,
  Moon,
  Check,
  ChevronDown,
  BookOpen,
} from 'lucide-react';

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
        className="flex w-full items-center justify-between py-4 text-left font-medium hover:text-primary transition-colors"
      >
        {question}
        <ChevronDown
          className={`h-5 w-5 text-muted-foreground transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && (
        <p className="pb-4 text-muted-foreground">{answer}</p>
      )}
    </div>
  );
}

// Gradient colors for landing page preview (slate → sky → blue)
const previewGradientColors: Record<number, string> = {
  0: 'bg-card',
  1: 'bg-slate-100 dark:bg-slate-800',
  2: 'bg-sky-100 dark:bg-sky-900',
  3: 'bg-sky-200 dark:bg-sky-800',
  4: 'bg-blue-300 dark:bg-blue-700',
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

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 sm:gap-3">
        {days.map((d, i) => (
          <div
            key={i}
            className={`
              relative rounded-xl p-3 sm:p-4 transition-all shadow-md hover:shadow-lg border border-border
              ${d.isToday
                ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                : ''
              }
              ${previewGradientColors[d.intensity]}
            `}
          >
            {/* Day label */}
            <div className="text-[10px] sm:text-xs font-medium mb-1 text-muted-foreground">
              {d.label}
            </div>
            {/* Day number */}
            <div className={`text-lg sm:text-xl font-bold ${d.isToday ? 'text-primary' : ''}`}>
              {d.day}
            </div>
            {/* Session info */}
            {d.session ? (
              <div className="mt-2 text-[10px] sm:text-xs text-muted-foreground">
                <div className="font-medium">{d.session}</div>
                <div className="text-primary font-semibold">{d.time}</div>
              </div>
            ) : (
              <div className="mt-2 text-[10px] sm:text-xs text-muted-foreground/50">
                —
              </div>
            )}
          </div>
        ))}

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

  const benefits = [
    {
      icon: Calendar,
      title: 'Calendário Visual',
      description:
        'Visualize seu tempo de estudo em um calendário intuitivo com cores de intensidade.',
    },
    {
      icon: Target,
      title: 'Metas Semanais',
      description:
        'Defina metas de horas por semana e acompanhe seu progresso em tempo real.',
    },
    {
      icon: BarChart3,
      title: 'Análise de Padrões',
      description:
        'Entenda seus hábitos de estudo com estatísticas e gráficos detalhados.',
    },
    {
      icon: Moon,
      title: 'Modo Escuro',
      description:
        'Interface adaptável para estudar confortavelmente a qualquer hora do dia.',
    },
  ];

  const faqs = [
    {
      question: 'O Study Planner é gratuito?',
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
      price: 'R$ 0',
      period: 'para sempre',
      description: 'Perfeito para começar a organizar seus estudos.',
      features: [
        'Calendário visual com heatmap',
        'Até 6 disciplinas',
        'Metas semanais básicas',
        'Modo escuro',
        'Sincronização na nuvem',
      ],
      cta: 'Começar grátis',
      highlighted: false,
    },
    {
      name: 'Pro',
      price: 'R$ 5,90',
      period: '/mês',
      description: 'Para quem leva os estudos a sério.',
      features: [
        'Tudo do plano Gratuito',
        'Disciplinas ilimitadas',
        'Histórico completo de sessões',
        'Exportar relatórios em PDF',
        'Lembretes personalizados',
        'Suporte prioritário',
      ],
      cta: 'Assinar Pro',
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
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">Study Planner</span>
          </div>
          <Link to="/login">
            <Button variant="outline" size="sm">
              Entrar
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Organize seus estudos de forma{' '}
            <span className="text-primary">inteligente</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Acompanhe seu tempo de estudo, defina metas semanais e visualize seu
            progresso com um calendário intuitivo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login">
              <Button size="lg" className="w-full sm:w-auto">
                Começar grátis
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

      {/* Benefits Section */}
      <section id="features" className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-semibold text-center mb-12">
            Tudo que você precisa para estudar melhor
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="border-border">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <benefit.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">{benefit.title}</h3>
                      <p className="text-muted-foreground text-sm">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-muted/30">
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
            Comece grátis e evolua quando precisar de mais recursos.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map((plan, index) => (
              <Card
                key={index}
                className={`relative ${
                  plan.highlighted
                    ? 'border-primary shadow-lg shadow-primary/10'
                    : 'border-border'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                      Mais popular
                    </span>
                  </div>
                )}
                <CardContent className="p-8">
                  <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {plan.description}
                  </p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/login" className="block">
                    <Button
                      size="lg"
                      variant={plan.highlighted ? 'default' : 'outline'}
                      className="w-full"
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="font-medium">Study Planner</span>
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
              © 2024 Study Planner
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
