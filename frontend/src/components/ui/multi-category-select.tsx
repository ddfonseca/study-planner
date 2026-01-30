/**
 * MultiCategorySelect - Multi-select component for categories
 */
import * as React from 'react';
import { Check, ChevronsUpDown, Plus, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { Category } from '@/types/api';

interface MultiCategorySelectProps {
  value: string[];
  onValueChange: (value: string[]) => void;
  categories: Category[];
  onCreateCategory?: (name: string) => Promise<Category>;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
}

export function MultiCategorySelect({
  value,
  onValueChange,
  categories,
  onCreateCategory,
  placeholder = 'Selecionar categorias...',
  searchPlaceholder = 'Buscar ou criar...',
  emptyMessage = 'Nenhuma categoria encontrada.',
  disabled = false,
  className,
}: MultiCategorySelectProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const [isCreating, setIsCreating] = React.useState(false);

  const selectedCategories = categories.filter((c) => value.includes(c.id));

  const normalizeString = (str: string) =>
    str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const matchingCategories = categories.filter((category) =>
    normalizeString(category.name).includes(normalizeString(inputValue))
  );

  const exactMatch = categories.some(
    (category) => normalizeString(category.name) === normalizeString(inputValue)
  );

  const showCreateOption = inputValue.trim() && !exactMatch && onCreateCategory;

  const handleToggle = (categoryId: string) => {
    if (value.includes(categoryId)) {
      onValueChange(value.filter((id) => id !== categoryId));
    } else {
      onValueChange([...value, categoryId]);
    }
  };

  const handleCreateNew = async () => {
    if (!inputValue.trim() || !onCreateCategory) return;

    try {
      setIsCreating(true);
      const newCategory = await onCreateCategory(inputValue.trim());
      onValueChange([...value, newCategory.id]);
      setInputValue('');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal h-8 px-2',
            !value.length && 'text-muted-foreground',
            className
          )}
        >
          <div className="flex items-center gap-1 flex-1 overflow-hidden">
            {selectedCategories.length > 0 ? (
              <>
                <Tag className="h-3 w-3 shrink-0 text-muted-foreground" />
                <span className="truncate text-xs">
                  {selectedCategories.map(c => c.name).join(', ')}
                </span>
                {selectedCategories.length > 1 && (
                  <Badge variant="secondary" className="text-xs px-1 py-0 h-4 shrink-0">
                    {selectedCategories.length}
                  </Badge>
                )}
              </>
            ) : (
              <span className="truncate text-xs">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            {matchingCategories.length === 0 && !showCreateOption && (
              <CommandEmpty>{emptyMessage}</CommandEmpty>
            )}
            {matchingCategories.length > 0 && (
              <CommandGroup>
                {matchingCategories.map((category) => (
                  <CommandItem
                    key={category.id}
                    value={category.id}
                    onSelect={() => handleToggle(category.id)}
                  >
                    <div
                      className={cn(
                        'mr-2 h-4 w-4 flex items-center justify-center rounded-sm border border-primary',
                        value.includes(category.id)
                          ? 'bg-primary text-primary-foreground'
                          : 'opacity-50'
                      )}
                    >
                      {value.includes(category.id) && <Check className="h-3 w-3" />}
                    </div>
                    <Tag className="h-3 w-3 mr-1.5 text-muted-foreground" />
                    {category.name}
                    {category._count && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {category._count.subjects}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {showCreateOption && (
              <CommandGroup>
                <CommandItem
                  value={`create-${inputValue}`}
                  onSelect={handleCreateNew}
                  disabled={isCreating}
                  className="text-primary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {isCreating ? 'Criando...' : `Criar "${inputValue.trim()}"`}
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default MultiCategorySelect;
