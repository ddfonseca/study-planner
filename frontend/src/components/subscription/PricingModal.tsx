/**
 * PricingModal - Shows available subscription plans (Free vs Pro Lifetime)
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
import { BookOpen, Crown, Check, Loader2, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Map feature keys to friendly labels
const FEATURE_LABELS: Record<string, string> = {
  max_cycles: 'Focus cycles',
  max_workspaces: 'Workspaces',
  max_sessions_per_day: 'Sessions per day',
  history_days: 'History days',
  export_data: 'Export data',
  shared_plans: 'Shared plans',
};

// Format limit value for display
function formatLimitValue(feature: string, value: number): string {
  if (value === -1) return 'Unlimited';
  if (feature === 'history_days') {
    if (value >= 365) return `${Math.floor(value / 365)} year${value >= 730 ? 's' : ''}`;
    return `${value} days`;
  }
  if (feature === 'export_data' || feature === 'shared_plans') {
    return value > 0 ? 'Yes' : 'No';
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

  // Filter to show only free and pro plans
  const displayPlans = plans.filter(plan => plan.name === 'free' || plan.name === 'pro');

  const handleSelectPlan = async (planId: string, planName: string) => {
    if (planName === 'free') {
      onOpenChange(false);
      return;
    }

    setIsSubscribing(true);
    setSubscribingPlanId(planId);

    try {
      const response = await subscriptionApi.subscribe(planId);

      if (response.success && response.initPoint) {
        // Open Mercado Pago checkout in new tab
        window.open(response.initPoint, '_blank');
        onOpenChange(false);
        toast({
          title: 'Checkout opened',
          description: 'Complete the payment in the new tab',
        });
        setIsSubscribing(false);
        setSubscribingPlanId(null);
      } else {
        throw new Error('Could not start checkout');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: 'Payment processing error',
        description: error instanceof Error ? error.message : 'Please try again later',
        variant: 'destructive',
      });
      setIsSubscribing(false);
      setSubscribingPlanId(null);
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Choose your plan
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Unlock all features with a single payment
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayPlans.map((plan) => {
                const isCurrentPlan = currentPlan?.id === plan.id;
                const isPro = plan.name === 'pro';
                const isFree = plan.name === 'free';
                const price = plan.priceLifetime || 0;

                return (
                  <Card
                    key={plan.id}
                    className={`relative ${
                      isPro
                        ? 'border-primary shadow-lg ring-2 ring-primary'
                        : ''
                    } ${isCurrentPlan ? 'bg-primary/5' : ''}`}
                  >
                    {isPro && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge variant="default" className="bg-primary flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          Recommended
                        </Badge>
                      </div>
                    )}
                    <CardContent className="p-6 pt-8">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className={`p-2 rounded-lg ${
                            isPro
                              ? 'bg-primary/10 text-primary'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {isPro ? <Crown className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
                        </div>
                        <h3 className="text-xl font-semibold">{plan.displayName}</h3>
                      </div>

                      {/* Price */}
                      <div className="mb-4">
                        {isFree ? (
                          <span className="text-3xl font-bold">Free</span>
                        ) : (
                          <>
                            <span className="text-3xl font-bold">
                              R$ {price.toFixed(2).replace('.', ',')}
                            </span>
                            <span className="text-muted-foreground text-sm ml-1">
                              one-time payment
                            </span>
                          </>
                        )}
                        {isPro && (
                          <div className="text-sm text-primary mt-1 font-medium">
                            Lifetime access
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      {plan.description && (
                        <p className="text-sm text-muted-foreground mb-5">
                          {plan.description}
                        </p>
                      )}

                      {/* Features */}
                      <ul className="space-y-2.5 mb-6">
                        {plan.limits.map((limit) => {
                          const label = FEATURE_LABELS[limit.feature] || limit.feature;
                          const value = formatLimitValue(limit.feature, limit.limitValue);

                          return (
                            <li
                              key={limit.id}
                              className="flex items-center gap-2 text-sm"
                            >
                              <Check className={`h-4 w-4 shrink-0 ${isPro ? 'text-primary' : 'text-green-500'}`} />
                              <span>
                                {value === 'Yes' || value === 'No'
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
                        variant={isPro ? 'default' : 'outline'}
                        size="lg"
                        onClick={() => handleSelectPlan(plan.id, plan.name)}
                        disabled={isCurrentPlan || isSubscribing}
                      >
                        {subscribingPlanId === plan.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : isCurrentPlan ? (
                          'Current plan'
                        ) : plan.name === 'free' ? (
                          'Continue free'
                        ) : (
                          <>
                            <Crown className="h-4 w-4 mr-2" />
                            Buy lifetime access
                          </>
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
