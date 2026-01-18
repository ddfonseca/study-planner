/**
 * Review Suggestions - Spaced repetition reminders
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Clock, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import type { ReviewSuggestion } from '@/types/api';

interface ReviewSuggestionsProps {
  suggestions: ReviewSuggestion[];
  isLoading?: boolean;
}

export function ReviewSuggestions({ suggestions, isLoading }: ReviewSuggestionsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            Revisao Espacada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter to show only suggestions that need attention (medium urgency or higher)
  const urgentSuggestions = suggestions.filter(
    (s) => s.urgency === 'critical' || s.urgency === 'high' || s.urgency === 'medium'
  );

  if (urgentSuggestions.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            Revisao Espacada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma revisao pendente!</p>
            <p className="text-xs mt-1">Continue estudando para ver sugestoes aqui.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getUrgencyConfig = (urgency: ReviewSuggestion['urgency']) => {
    switch (urgency) {
      case 'critical':
        return {
          icon: AlertCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
          badge: 'destructive' as const,
          label: 'Urgente',
        };
      case 'high':
        return {
          icon: AlertTriangle,
          color: 'text-orange-500',
          bgColor: 'bg-orange-500/10',
          borderColor: 'border-orange-500/20',
          badge: 'default' as const,
          label: 'Alta',
        };
      case 'medium':
        return {
          icon: Clock,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/20',
          badge: 'secondary' as const,
          label: 'Media',
        };
      default:
        return {
          icon: Info,
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/20',
          badge: 'outline' as const,
          label: 'Baixa',
        };
    }
  };

  const formatDaysAgo = (days: number) => {
    if (days === 1) return 'ontem';
    if (days < 7) return `${days} dias atras`;
    if (days < 14) return '1 semana atras';
    if (days < 30) return `${Math.floor(days / 7)} semanas atras`;
    return `${Math.floor(days / 30)} mes${Math.floor(days / 30) > 1 ? 'es' : ''} atras`;
  };

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-500" />
          Revisao Espacada
          <Badge variant="secondary" className="ml-auto text-xs">
            {urgentSuggestions.length} pendente{urgentSuggestions.length > 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {urgentSuggestions.slice(0, 5).map((suggestion) => {
          const config = getUrgencyConfig(suggestion.urgency);
          const Icon = config.icon;

          return (
            <div
              key={suggestion.subject}
              className={`flex items-center gap-3 p-3 rounded-lg border ${config.bgColor} ${config.borderColor}`}
            >
              <div className={`p-2 rounded-full ${config.bgColor}`}>
                <Icon className={`h-4 w-4 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">
                    {suggestion.subject}
                  </span>
                  <Badge variant={config.badge} className="text-xs shrink-0">
                    {config.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span>Estudado {formatDaysAgo(suggestion.daysSinceStudy)}</span>
                  <span>·</span>
                  <span>Total: {formatMinutes(suggestion.totalMinutesStudied)}</span>
                </div>
              </div>
            </div>
          );
        })}

        {urgentSuggestions.length > 5 && (
          <p className="text-xs text-center text-muted-foreground pt-2">
            +{urgentSuggestions.length - 5} mais materias precisam de revisao
          </p>
        )}

        <div className="text-xs text-muted-foreground border-t pt-3 mt-3">
          <p>
            <strong>Dica:</strong> A revisao espacada ajuda a fixar o conteudo na memoria de longo prazo.
            Revise materias marcadas como urgentes para melhor retencao.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default ReviewSuggestions;
