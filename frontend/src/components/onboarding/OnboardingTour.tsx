/**
 * Onboarding Tour - Guided tour using React Joyride
 */
import { useState, useEffect } from 'react';
import Joyride, { STATUS } from 'react-joyride';
import type { CallBackProps, Step, TooltipRenderProps } from 'react-joyride';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const desktopSteps: Step[] = [
  {
    target: '[data-tour="calendar-grid"]',
    content: 'Clique em qualquer dia para registrar suas sessões de estudo.',
    title: '📅 Calendário',
    placement: 'bottom',
    disableBeacon: true,
    spotlightClicks: true,
  },
  {
    target: '[data-tour="study-timer"]',
    content:
      'Use o cronômetro para medir seu tempo de estudo em tempo real. Ele continua rodando mesmo se você fechar a aba!',
    title: '⏱️ Timer',
    placement: 'left',
  },
  {
    target: '[data-tour="cycle-card"]',
    content:
      'Organize suas matérias em ciclos para estudar de forma equilibrada. O sistema sugere qual matéria estudar em seguida.',
    title: '🔄 Ciclos de Estudo',
    placement: 'left',
  },
  {
    target: '[data-tour="nav-dashboard"]',
    content:
      'Acompanhe seu progresso com gráficos e estatísticas detalhadas do seu tempo de estudo.',
    title: '📊 Dashboard',
    placement: 'bottom',
  },
];

// Mobile shows fewer steps since timer/cycle are in separate tabs
const mobileSteps: Step[] = [
  {
    target: '[data-tour="mobile-day-view"]',
    content: 'Navegue entre os dias e registre suas sessões de estudo.',
    title: '📅 Calendário',
    placement: 'bottom',
    disableBeacon: true,
    spotlightClicks: true,
  },
  {
    target: '[data-tour="mobile-nav"]',
    content:
      'Use a barra inferior para alternar entre calendário, ciclos, progresso e timer.',
    title: '📱 Navegação',
    placement: 'top',
  },
];

function CustomTooltip({
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  tooltipProps,
  isLastStep,
  size,
}: TooltipRenderProps) {
  return (
    <div
      {...tooltipProps}
      className="bg-popover text-popover-foreground rounded-lg shadow-lg border p-4 max-w-sm z-[10001]"
    >
      <button
        {...closeProps}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Fechar tour"
      >
        <X className="h-4 w-4" />
      </button>

      {step.title && (
        <h3 className="font-semibold text-lg mb-2 pr-6">{step.title}</h3>
      )}

      <p className="text-sm text-muted-foreground mb-4">{step.content}</p>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {index + 1} de {size}
        </span>

        <div className="flex gap-2">
          {index > 0 && (
            <Button variant="ghost" size="sm" {...backProps}>
              Voltar
            </Button>
          )}
          <Button size="sm" {...primaryProps}>
            {isLastStep ? 'Concluir' : 'Próximo'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function OnboardingTour() {
  const {
    hasCompletedTour,
    setHasCompletedTour,
    shouldStartTour,
    setShouldStartTour,
  } = useOnboardingStore();

  const isMobile = useIsMobile();
  const [runTour, setRunTour] = useState(false);

  // Select steps based on device
  const steps = isMobile ? mobileSteps : desktopSteps;

  // Start tour when triggered from WelcomeOverlay
  useEffect(() => {
    if (shouldStartTour && !hasCompletedTour) {
      // Delay to ensure UI is rendered
      const timer = setTimeout(() => {
        setRunTour(true);
        setShouldStartTour(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [shouldStartTour, hasCompletedTour, setShouldStartTour]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRunTour(false);
      setHasCompletedTour(true);
    }
  };

  if (hasCompletedTour) return null;

  return (
    <Joyride
      steps={steps}
      run={runTour}
      continuous
      showSkipButton
      showProgress
      disableOverlayClose
      spotlightClicks
      callback={handleJoyrideCallback}
      tooltipComponent={CustomTooltip}
      locale={{
        back: 'Voltar',
        close: 'Fechar',
        last: 'Concluir',
        next: 'Próximo',
        skip: 'Pular tour',
      }}
      styles={{
        options: {
          primaryColor: 'hsl(var(--primary))',
          zIndex: 10000,
        },
        spotlight: {
          borderRadius: 8,
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
      }}
      floaterProps={{
        disableAnimation: true,
      }}
    />
  );
}

export default OnboardingTour;
