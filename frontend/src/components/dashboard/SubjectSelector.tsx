/**
 * Subject Selector - Dropdown with search to select a subject for analytics
 */
import * as React from 'react';
import { Check, ChevronsUpDown, Search, X, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/useMediaQuery';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

interface SubjectSelectorProps {
  subjects: string[];
  selectedSubject: string | null;
  onSelectSubject: (subject: string) => void;
}

// Normalize string for search (remove accents, lowercase)
const normalizeString = (str: string) =>
  str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// Group subjects by first letter
function groupByFirstLetter(subjects: string[]): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  const sorted = [...subjects].sort((a, b) =>
    a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
  );

  sorted.forEach((subject) => {
    const letter = subject[0].toUpperCase();
    if (!groups.has(letter)) groups.set(letter, []);
    groups.get(letter)!.push(subject);
  });

  return groups;
}

interface SelectorContentProps {
  value: string | null;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSelect: (value: string) => void;
  matchingOptions: string[];
  isMobile: boolean;
}

function SelectorContent({
  value,
  inputValue,
  onInputChange,
  onSelect,
  matchingOptions,
  isMobile,
}: SelectorContentProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const grouped = React.useMemo(
    () => groupByFirstLetter(matchingOptions),
    [matchingOptions]
  );

  // Focus input on mount for mobile
  React.useEffect(() => {
    if (isMobile) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isMobile]);

  return (
    <div className={cn('flex flex-col', isMobile ? 'h-full' : '')}>
      {/* Search input */}
      <div
        className={cn(
          'flex items-center border-b px-3',
          isMobile && 'sticky top-0 bg-background z-10'
        )}
      >
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Buscar matéria..."
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
        />
        {inputValue && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => onInputChange('')}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Content area */}
      <div
        className={cn(
          'overflow-y-auto',
          isMobile ? 'flex-1 pb-4' : 'max-h-[300px]'
        )}
      >
        {/* Grouped list A-Z */}
        {matchingOptions.length > 0 ? (
          <div className="p-1" role="listbox" aria-label="Lista de matérias">
            {Array.from(grouped.entries()).map(([letter, items]) => (
              <div
                key={letter}
                role="group"
                aria-label={`Matérias com letra ${letter}`}
              >
                <p
                  className="px-2 py-1.5 text-xs font-medium text-muted-foreground sticky top-0 bg-popover"
                  aria-hidden="true"
                >
                  {letter}
                </p>
                {items.map((subject) => (
                  <button
                    key={subject}
                    onClick={() => onSelect(subject)}
                    role="option"
                    aria-selected={value === subject}
                    className={cn(
                      'relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none transition-colors',
                      'hover:bg-accent hover:text-accent-foreground',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      value === subject && 'bg-accent'
                    )}
                  >
                    <span className="flex-1 text-left">{subject}</span>
                    {value === subject && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma matéria encontrada.
          </p>
        )}
      </div>
    </div>
  );
}

export function SubjectSelector({
  subjects,
  selectedSubject,
  onSelectSubject,
}: SubjectSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const isMobile = useIsMobile();

  const matchingOptions = React.useMemo(
    () =>
      subjects.filter((option) =>
        normalizeString(option).includes(normalizeString(inputValue))
      ),
    [subjects, inputValue]
  );

  const handleSelect = (value: string) => {
    onSelectSubject(value);
    setInputValue('');
    setOpen(false);
  };

  if (subjects.length === 0) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <BookOpen className="h-4 w-4" />
        <span className="text-sm">Nenhuma matéria encontrada</span>
      </div>
    );
  }

  const triggerButton = (
    <Button
      variant="outline"
      role="combobox"
      aria-expanded={open}
      className={cn(
        'w-[200px] justify-between font-normal',
        !selectedSubject && 'text-muted-foreground'
      )}
    >
      <span className="truncate">{selectedSubject || 'Selecione uma matéria'}</span>
      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </Button>
  );

  // Mobile: Use Drawer
  if (isMobile) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <BookOpen className="h-4 w-4" />
          <span className="text-sm">Matéria:</span>
        </div>
        <Drawer open={open} onOpenChange={setOpen}>
          <div onClick={() => setOpen(true)} className="flex-1">
            {triggerButton}
          </div>
          <DrawerContent className="h-[70vh] max-h-[70vh]">
            <DrawerHeader className="border-b pb-2">
              <div className="flex items-center justify-between">
                <DrawerTitle>Selecionar Matéria</DrawerTitle>
                <DrawerClose asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <X className="h-4 w-4" />
                  </Button>
                </DrawerClose>
              </div>
            </DrawerHeader>
            <SelectorContent
              value={selectedSubject}
              inputValue={inputValue}
              onInputChange={setInputValue}
              onSelect={handleSelect}
              matchingOptions={matchingOptions}
              isMobile={true}
            />
          </DrawerContent>
        </Drawer>
      </div>
    );
  }

  // Desktop: Use Popover
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 text-muted-foreground">
        <BookOpen className="h-4 w-4" />
        <span className="text-sm">Matéria:</span>
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
        <PopoverContent className="w-[250px] p-0" align="start">
          <SelectorContent
            value={selectedSubject}
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSelect={handleSelect}
            matchingOptions={matchingOptions}
            isMobile={false}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default SubjectSelector;
