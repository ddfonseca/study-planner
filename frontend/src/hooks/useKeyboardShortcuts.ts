import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface UseKeyboardShortcutsReturn {
  isHelpOpen: boolean;
  setIsHelpOpen: (open: boolean) => void;
  pendingKey: string | null;
}

export function useKeyboardShortcuts(): UseKeyboardShortcutsReturn {
  const navigate = useNavigate();
  const location = useLocation();
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const pendingKeyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Callback para abrir nova sessão (navega se necessário, depois emite evento)
  const openNewSession = useCallback(() => {
    const isOnCalendar = location.pathname === '/app' || location.pathname === '/app/' || location.pathname === '/app/calendar';

    if (!isOnCalendar) {
      // Navega para calendário e agenda evento após navegação
      navigate('/app/calendar');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('shortcut:newSession'));
      }, 100);
    } else {
      window.dispatchEvent(new CustomEvent('shortcut:newSession'));
    }
  }, [location, navigate]);

  // Callback para toggle timer
  const toggleTimer = useCallback(() => {
    window.dispatchEvent(new CustomEvent('shortcut:toggleTimer'));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;

      // Ignorar se em input/textarea/contenteditable
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      // Se modal de ajuda está aberto, só processar Escape
      if (isHelpOpen) {
        if (key === 'escape') {
          setIsHelpOpen(false);
        }
        return;
      }

      // Sequência G + letra
      if (pendingKey === 'g') {
        if (pendingKeyTimeoutRef.current) {
          clearTimeout(pendingKeyTimeoutRef.current);
        }
        setPendingKey(null);

        switch (key) {
          case 'c':
            e.preventDefault();
            navigate('/app/calendar');
            break;
          case 'd':
            e.preventDefault();
            navigate('/app/dashboard');
            break;
          case 's':
            e.preventDefault();
            navigate('/app/settings');
            break;
          case 'n':
            e.preventDefault();
            navigate('/app/scratchpad');
            break;
        }
        return;
      }

      // Iniciar sequência com G
      if (key === 'g' && !e.ctrlKey && !e.metaKey) {
        setPendingKey('g');
        pendingKeyTimeoutRef.current = setTimeout(() => {
          setPendingKey(null);
        }, 1500);
        return;
      }

      // Atalhos simples
      switch (key) {
        case '?':
          e.preventDefault();
          setIsHelpOpen(true);
          break;
        case 'n':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            openNewSession();
          }
          break;
        case 't':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            toggleTimer();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (pendingKeyTimeoutRef.current) {
        clearTimeout(pendingKeyTimeoutRef.current);
      }
    };
  }, [navigate, pendingKey, isHelpOpen, openNewSession, toggleTimer]);

  return { isHelpOpen, setIsHelpOpen, pendingKey };
}
