/**
 * PricingModal - Shows available subscription plans
 */
import { useEffect } from 'react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
} from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Crown, Building2, Check, Loader2 } from 'lucide-react';

interface PricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Map plan names to icons
const PLAN_ICONS: Record<string, typeof BookOpen> = {
  free: BookOpen,
  pro: Crown,
  business: Building2,
};

// Map feature keys to friendly labels
const FEATURE_LABELS: Record<string, string> = {
  max_cycles: 'Ciclos de estudo',
  max_workspaces: 'Workspaces',
  max_sessions_per_day: 'Sessões por dia',
  history_days: 'Dias de histórico',
  export_data: 'Exportar dados',
  shared_plans: 'Compartilhamentos',
};

// Format limit value for display
function formatLimitValue(feature: string, value: number): string {
  if (value === -1) return 'Ilimitado';
  if (feature === 'history_days') {
    if (value >= 365) return `${Math.floor(value / 365)} ano${value >= 730 ? 's' : ''}`;
    return `${value} dias`;
  }
  if (feature === 'export_data' || feature === 'shared_plans') {
    return value > 0 ? 'Sim' : 'Não';
  }
  return value.toString();
}

export function PricingModal({ open, onOpenChange }: PricingModalProps) {
  const { plans, fetchPlans, isLoading, currentPlan } = useSubscriptionStore();
  const { toast } = useToast();

  // Fetch plans when modal opens
  useEffect(() => {
    if (open && plans.length === 0) {
      fetchPlans();
    }
  }, [open, plans.length, fetchPlans]);

  const handleSelectPlan = (planName: string) => {
    if (planName === 'free') {
      onOpenChange(false);
      return;
    }

    toast({
      title: 'Em breve!',
      description: 'O pagamento online estará disponível em breve. Aguarde novidades!',
    });
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Escolha seu plano
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Desbloqueie mais recursos para potencializar seus estudos
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((plan) => {
                const Icon = PLAN_ICONS[plan.name] || BookOpen;
                const isCurrentPlan = currentPlan?.id === plan.id;
                const isHighlighted = plan.name === 'pro';

                return (
                  <Card
                    key={plan.id}
                    className={`relative ${
                      isHighlighted
                        ? 'border-primary shadow-lg ring-1 ring-primary'
                        : ''
                    } ${isCurrentPlan ? 'bg-primary/5' : ''}`}
                  >
                    {isHighlighted && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                          Mais popular
                        </span>
                      </div>
                    )}
                    <CardContent className="p-5 pt-6">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`p-2 rounded-lg ${
                            isHighlighted
                              ? 'bg-primary/10 text-primary'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-semibold">{plan.displayName}</h3>
                      </div>

                      {/* Price */}
                      <div className="mb-3">
                        <span className="text-2xl font-bold">
                          {plan.priceMonthly === 0
                            ? 'Grátis'
                            : `R$ ${plan.priceMonthly.toFixed(2).replace('.', ',')}`}
                        </span>
                        {plan.priceMonthly > 0 && (
                          <span className="text-muted-foreground text-sm">/mês</span>
                        )}
                      </div>

                      {/* Description */}
                      {plan.description && (
                        <p className="text-sm text-muted-foreground mb-4">
                          {plan.description}
                        </p>
                      )}

                      {/* Features */}
                      <ul className="space-y-2 mb-5">
                        {plan.limits.map((limit) => {
                          const label = FEATURE_LABELS[limit.feature] || limit.feature;
                          const value = formatLimitValue(limit.feature, limit.limitValue);

                          return (
                            <li
                              key={limit.id}
                              className="flex items-center gap-2 text-sm"
                            >
                              <Check className="h-4 w-4 text-green-500 shrink-0" />
                              <span>
                                {value === 'Sim' || value === 'Não'
                                  ? label
                                  : `${value} ${label.toLowerCase()}`}
                              </span>
                            </li>
                          );
                        })}
                      </ul>

                      {/* CTA Button */}
                      <Button
                        className="w-full"
                        variant={isHighlighted ? 'default' : 'outline'}
                        onClick={() => handleSelectPlan(plan.name)}
                        disabled={isCurrentPlan}
                      >
                        {isCurrentPlan
                          ? 'Plano atual'
                          : plan.name === 'free'
                            ? 'Plano atual'
                            : 'Selecionar'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

export default PricingModal;
