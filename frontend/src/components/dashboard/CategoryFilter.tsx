/**
 * Category Filter - Filter dashboard by categories (multi-select)
 */
import { Button } from '@/components/ui/button';
import { Tag } from 'lucide-react';
import type { Category } from '@/types/api';
import { cn } from '@/lib/utils';

interface CategoryFilterProps {
  categories: Category[];
  selectedIds: string[];
  onToggle: (categoryId: string) => void;
  onClearAll: () => void;
}

export function CategoryFilter({
  categories,
  selectedIds,
  onToggle,
  onClearAll,
}: CategoryFilterProps) {
  if (categories.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Tag className="h-4 w-4" aria-hidden="true" />
        <span className="text-sm" id="category-filter-label">Categorias:</span>
      </div>
      <div className="flex gap-2 flex-wrap" role="group" aria-labelledby="category-filter-label">
        <Button
          variant={selectedIds.length === 0 ? 'default' : 'outline'}
          size="sm"
          onClick={onClearAll}
          aria-current={selectedIds.length === 0 ? 'true' : undefined}
        >
          Todas
        </Button>
        {categories.map((category) => {
          const isSelected = selectedIds.includes(category.id);
          return (
            <Button
              key={category.id}
              variant={isSelected ? 'default' : 'outline'}
              size="sm"
              onClick={() => onToggle(category.id)}
              aria-pressed={isSelected}
              className={cn(
                'gap-1',
                category.color && isSelected && 'border-2',
              )}
              style={category.color && isSelected ? { borderColor: category.color } : undefined}
            >
              <Tag className="h-3 w-3" />
              {category.name}
              {category._count && (
                <span className="text-xs opacity-70">({category._count.subjects})</span>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

export default CategoryFilter;
