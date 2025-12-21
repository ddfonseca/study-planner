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

// Calendar SVG Preview component
function CalendarPreview() {
  const days = [
    { day: 16, label: 'Seg', intensity: 3, session: 'Mat 1h30' },
    { day: 17, label: 'Ter', intensity: 2, session: 'Fís 45m' },
    { day: 18, label: 'Qua', intensity: 0, session: '' },
    { day: 19, label: 'Qui', intensity: 4, session: 'Quím 2h', isToday: true },
    { day: 20, label: 'Sex', intensity: 1, session: 'Mat 30m' },
    { day: 21, label: 'Sáb', intensity: 0, session: '' },
    { day: 22, label: 'Dom', intensity: 0, session: '' },
  ];

  const getIntensityColor = (intensity: number) => {
    const colors = [
      'fill-card',
      'fill-green-200 dark:fill-green-900',
      'fill-green-300 dark:fill-green-800',
      'fill-green-400 dark:fill-green-700',
      'fill-green-500 dark:fill-green-600',
    ];
    return colors[intensity] || colors[0];
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <svg
        viewBox="0 0 720 180"
        className="w-full h-auto"
        role="img"
        aria-label="Preview do calendário de estudos"
      >
        {/* Background */}
        <rect
          x="0"
          y="0"
          width="720"
          height="180"
          rx="12"
          className="fill-card stroke-border"
          strokeWidth="1"
        />

        {/* Header row */}
        {days.map((d, i) => (
          <text
            key={`header-${i}`}
            x={50 + i * 85}
            y="30"
            className="fill-muted-foreground text-[12px]"
            textAnchor="middle"
          >
            {d.label}
          </text>
        ))}
        <text
          x="660"
          y="30"
          className="fill-muted-foreground text-[12px]"
          textAnchor="middle"
        >
          Total
        </text>

        {/* Day cells */}
        {days.map((d, i) => (
          <g key={`cell-${i}`}>
            {/* Cell background */}
            <rect
              x={10 + i * 85}
              y="45"
              width="75"
              height="120"
              rx="8"
              className={`${getIntensityColor(d.intensity)} ${
                d.isToday ? 'stroke-primary stroke-2' : 'stroke-border'
              }`}
              strokeWidth={d.isToday ? 2 : 1}
            />
            {/* Day number */}
            <text
              x={22 + i * 85}
              y="65"
              className={`text-[14px] ${
                d.isToday ? 'fill-primary font-bold' : 'fill-foreground'
              }`}
            >
              {d.day}
            </text>
            {/* Session */}
            {d.session && (
              <text
                x={47 + i * 85}
                y="110"
                className="fill-foreground text-[11px]"
                textAnchor="middle"
              >
                {d.session}
              </text>
            )}
          </g>
        ))}

        {/* Total column */}
        <rect
          x="605"
          y="45"
          width="105"
          height="120"
          rx="8"
          className="fill-card stroke-border"
          strokeWidth="1"
        />
        <text
          x="660"
          y="80"
          className="fill-foreground text-[18px] font-semibold"
          textAnchor="middle"
        >
          5h 45m
        </text>
        {/* Progress bar background */}
        <rect
          x="620"
          y="100"
          width="80"
          height="8"
          rx="4"
          className="fill-muted"
        />
        {/* Progress bar fill */}
        <rect
          x="620"
          y="100"
          width="48"
          height="8"
          rx="4"
          className="fill-green-500"
        />
        <text
          x="660"
          y="130"
          className="fill-muted-foreground text-[11px]"
          textAnchor="middle"
        >
          60% da meta
        </text>
        <text
          x="660"
          y="150"
          className="fill-muted-foreground text-[10px]"
          textAnchor="middle"
        >
          Meta: 10h
        </text>
      </svg>
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
        'Sim, o Study Planner é completamente gratuito e sem anúncios. Todas as funcionalidades estão disponíveis para todos os usuários.',
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

  const features = [
    'Calendário visual com heatmap',
    'Metas semanais personalizáveis',
    'Dashboard com estatísticas',
    'Modo escuro',
    'Sincronização na nuvem',
    'Acesso em qualquer dispositivo',
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
      <section className="py-16 md:py-24">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">
            Gratuito para sempre
          </h2>
          <p className="text-muted-foreground mb-8">
            Sem custos ocultos. Sem anúncios. Apenas foco nos seus estudos.
          </p>
          <Card className="border-primary/50">
            <CardContent className="p-8">
              <div className="text-4xl font-bold mb-2">R$ 0</div>
              <div className="text-muted-foreground mb-6">para sempre</div>
              <ul className="text-left space-y-3 mb-8">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link to="/login" className="block">
                <Button size="lg" className="w-full">
                  Criar conta grátis
                </Button>
              </Link>
            </CardContent>
          </Card>
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
