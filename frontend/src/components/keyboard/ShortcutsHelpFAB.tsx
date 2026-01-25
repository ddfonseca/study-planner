import { Keyboard, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

interface ShortcutsHelpFABProps {
  onClick: () => void;
  pendingKey?: string | null;
}

const TELEGRAM_COMMUNITY_URL = 'https://t.me/+g27TaGZfnYIzZTUx';

export function ShortcutsHelpFAB({ onClick, pendingKey }: ShortcutsHelpFABProps) {
  const isMobile = useIsMobile();

  // Não mostrar no mobile
  if (isMobile) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Indicador de sequência pendente */}
      {pendingKey && (
        <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium animate-pulse">
          {pendingKey.toUpperCase()} + ...
        </div>
      )}

      {/* Botão da Comunidade */}
      <Button
        variant="outline"
        size="icon"
        asChild
        className={cn(
          "h-12 w-12 rounded-full shadow-lg",
          "bg-background/95 backdrop-blur-sm border-2",
          "hover:scale-105 active:scale-95 transition-transform"
        )}
        aria-label="Entrar na comunidade"
        title="Entrar na comunidade - Peça ajuda, sugira features, troque ideias"
      >
        <a href={TELEGRAM_COMMUNITY_URL} target="_blank" rel="noopener noreferrer">
          <Users className="h-5 w-5" />
        </a>
      </Button>

      {/* Botão de Atalhos de Teclado */}
      <Button
        variant="outline"
        size="icon"
        onClick={onClick}
        className={cn(
          "h-12 w-12 rounded-full shadow-lg",
          "bg-background/95 backdrop-blur-sm border-2",
          "hover:scale-105 active:scale-95 transition-transform"
        )}
        aria-label="Atalhos de teclado (pressione ?)"
        title="Atalhos de teclado (?)"
      >
        <Keyboard className="h-5 w-5" />
      </Button>
    </div>
  );
}
