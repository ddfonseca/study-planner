/**
 * Welcome Overlay - Shown to new users on first visit
 */
import { useState } from 'react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogFooter,
} from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { useOnboardingStore } from '@/store/onboardingStore';
import { Calendar, BarChart3, Clock, ArrowRight, Sparkles } from 'lucide-react';

interface FeatureItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureItem({ icon, title, description }: FeatureItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center text-accent-foreground">
        {icon}
      </div>
      <div>
        <h3 className="font-medium text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function WelcomeOverlay() {
  const { hasSeenWelcome, setHasSeenWelcome, setShouldStartTour } = useOnboardingStore();
  const [open, setOpen] = useState(!hasSeenWelcome);

  const handleClose = () => {
    setHasSeenWelcome(true);
    setOpen(false);
  };

  const handleStart = () => {
    setShouldStartTour(true);
    handleClose();
  };

  if (hasSeenWelcome) {
    return null;
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        handleClose();
      }
    }}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <ResponsiveDialogTitle className="text-xl">
            Bem-vindo ao Horas Líquidas!
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Acompanhe seu tempo de estudo de forma simples e eficiente.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="space-y-4 py-4">
          <FeatureItem
            icon={<Calendar className="h-5 w-5" />}
            title="Calendário de Estudos"
            description="Registre suas sessões de estudo diárias com facilidade."
          />
          <FeatureItem
            icon={<Clock className="h-5 w-5" />}
            title="Ciclos de Estudo"
            description="Organize suas matérias em ciclos para estudar de forma equilibrada."
          />
          <FeatureItem
            icon={<BarChart3 className="h-5 w-5" />}
            title="Dashboard de Progresso"
            description="Visualize seu progresso com gráficos e estatísticas detalhadas."
          />
        </div>

        <ResponsiveDialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="ghost" onClick={handleClose} className="w-full sm:w-auto">
            Pular
          </Button>
          <Button onClick={handleStart} className="w-full sm:flex-1">
            Começar
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

export default WelcomeOverlay;
