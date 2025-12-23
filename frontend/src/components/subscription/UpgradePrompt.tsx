/**
 * UpgradePrompt - Shows when user hits a plan limit
 */
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Zap } from 'lucide-react';
import { useCanUseFeature, FEATURES, type FeatureKey } from '@/hooks/useSubscriptionLimits';
import { cn } from '@/lib/utils';

const FEATURE_LABELS: Record<FeatureKey, string> = {
  [FEATURES.MAX_CYCLES]: 'ciclos de estudo',
  [FEATURES.MAX_WORKSPACES]: 'workspaces',
  [FEATURES.MAX_SESSIONS_PER_DAY]: 'sessões por dia',
  [FEATURES.EXPORT_DATA]: 'exportação de dados',
  [FEATURES.SHARED_PLANS]: 'compartilhamentos',
  [FEATURES.HISTORY_DAYS]: 'dias de histórico',
};

interface UpgradePromptProps {
  feature: FeatureKey;
  currentUsage: number;
  className?: string;
  variant?: 'inline' | 'card' | 'banner';
  onUpgradeClick?: () => void;
}

export function UpgradePrompt({
  feature,
  currentUsage,
  className,
  variant = 'card',
  onUpgradeClick,
}: UpgradePromptProps) {
  const { canUse, limit, isUnlimited } = useCanUseFeature(feature, currentUsage);

  // Don't show if unlimited or can still use
  if (isUnlimited || canUse) {
    return null;
  }

  const featureLabel = FEATURE_LABELS[feature] || feature;

  if (variant === 'inline') {
    return (
      <p className={cn('text-sm text-amber-600 dark:text-amber-400', className)}>
        Limite de {limit} {featureLabel} atingido.{' '}
        <button
          onClick={onUpgradeClick}
          className="underline hover:no-underline font-medium"
        >
          Fazer upgrade
        </button>
      </p>
    );
  }

  if (variant === 'banner') {
    return (
      <div
        className={cn(
          'flex items-center justify-between gap-4 p-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-lg',
          className
        )}
      >
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" />
          <span className="text-sm">
            Você atingiu o limite de {limit} {featureLabel}
          </span>
        </div>
        <Button size="sm" variant="outline" onClick={onUpgradeClick}>
          <Crown className="h-3 w-3 mr-1" />
          Upgrade
        </Button>
      </div>
    );
  }

  // Default: card
  return (
    <Card className={cn('border-amber-500/30 bg-amber-500/5', className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-500/10 rounded-full">
            <Crown className="h-5 w-5 text-amber-500" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-foreground">
              Limite atingido
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              Você atingiu o limite de {limit} {featureLabel} do plano gratuito.
              Faça upgrade para desbloquear mais recursos.
            </p>
            <Button
              size="sm"
              className="mt-3"
              onClick={onUpgradeClick}
            >
              <Zap className="h-4 w-4 mr-2" />
              Ver planos
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * LimitIndicator - Shows current usage vs limit
 */
interface LimitIndicatorProps {
  feature: FeatureKey;
  currentUsage: number;
  className?: string;
  showLabel?: boolean;
}

export function LimitIndicator({
  feature,
  currentUsage,
  className,
  showLabel = true,
}: LimitIndicatorProps) {
  const { limit, isUnlimited, percentUsed } = useCanUseFeature(feature, currentUsage);

  if (isUnlimited) {
    return showLabel ? (
      <span className={cn('text-xs text-muted-foreground', className)}>∞</span>
    ) : null;
  }

  const isNearLimit = percentUsed >= 80;
  const isAtLimit = percentUsed >= 100;

  return (
    <span
      className={cn(
        'text-xs',
        isAtLimit
          ? 'text-red-500'
          : isNearLimit
            ? 'text-amber-500'
            : 'text-muted-foreground',
        className
      )}
    >
      {currentUsage}/{limit}
    </span>
  );
}

export default UpgradePrompt;
