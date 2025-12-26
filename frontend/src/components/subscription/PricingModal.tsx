/**
 * PricingModal - Shows available subscription plans
 */
import { useEffect, useState } from 'react';
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
import { subscriptionApi } from '@/lib/api/subscription';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Crown, Check, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Map plan names to icons
const PLAN_ICONS: Record<string, typeof BookOpen> = {
  free: BookOpen,
  pro: Crown,
  pro_annual: Crown,
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
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribingPlanId, setSubscribingPlanId] = useState<string | null>(null);

  // Fetch plans when modal opens
  useEffect(() => {
    if (open && plans.length === 0) {
      fetchPlans();
    }
  }, [open, plans.length, fetchPlans]);

  const handleSelectPlan = async (planId: string, planName: string) => {
    if (planName === 'free') {
      onOpenChange(false);
      return;
    }

    setIsSubscribing(true);
    setSubscribingPlanId(planId);

    try {
      // Call the API to create subscription
      const billingCycle = planName === 'pro_annual' ? 'YEARLY' : 'MONTHLY';
      const response = await subscriptionApi.subscribe(planId, billingCycle);

      if (response.success && response.initPoint) {
        // Redirect to Mercado Pago checkout
        window.location.href = response.initPoint;
      } else {
        throw new Error('Não foi possível iniciar o checkout');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: 'Erro ao assinar',
        description: error instanceof Error ? error.message : 'Tente novamente mais tarde',
        variant: 'destructive',
      });
      setIsSubscribing(false);
      setSubscribingPlanId(null);
    }
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
                const isPro = plan.name === 'pro';
                const isAnnual = plan.name === 'pro_annual';
                const isFree = plan.name === 'free';

                // Determine price to display
                const price = isAnnual ? plan.priceYearly : plan.priceMonthly;
                const priceLabel = isAnnual ? '/ano' : '/mês';

                return (
                  <Card
                    key={plan.id}
                    className={`relative ${
                      isPro
                        ? 'border-primary shadow-lg ring-1 ring-primary'
                        : ''
                    } ${isAnnual ? 'border-green-500/50' : ''} ${isCurrentPlan ? 'bg-primary/5' : ''}`}
                  >
                    {isAnnual && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                          -30% desconto
                        </Badge>
                      </div>
                    )}
                    <CardContent className="p-5 pt-6">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`p-2 rounded-lg ${
                            isPro
                              ? 'bg-primary/10 text-primary'
                              : isAnnual
                              ? 'bg-green-500/10 text-green-600'
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
                          {isFree
                            ? 'Grátis'
                            : `R$ ${price.toFixed(2).replace('.', ',')}`}
                        </span>
                        {!isFree && (
                          <span className="text-muted-foreground text-sm">{priceLabel}</span>
                        )}
                        {isAnnual && (
                          <div className="text-xs text-green-600 mt-1">
                            equivale a R$ {(price / 12).toFixed(2).replace('.', ',')}/mês
                          </div>
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
                        className={`w-full ${isAnnual ? 'bg-green-500 hover:bg-green-600' : ''}`}
                        variant={isPro || isAnnual ? 'default' : 'outline'}
                        onClick={() => handleSelectPlan(plan.id, plan.name)}
                        disabled={isCurrentPlan || isSubscribing}
                      >
                        {subscribingPlanId === plan.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processando...
                          </>
                        ) : isCurrentPlan ? (
                          'Plano atual'
                        ) : plan.name === 'free' ? (
                          'Plano gratuito'
                        ) : (
                          'Assinar agora'
                        )}
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
