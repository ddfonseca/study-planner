import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAllocationStore } from '@/store/allocationStore';
import type { ExamTemplate } from '@/types/api';

interface TemplatePickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (template: ExamTemplate) => void;
}

export function TemplatePickerModal({ open, onOpenChange, onSelect }: TemplatePickerModalProps) {
  const { templates, categories, fetchTemplates, fetchCategories } = useAllocationStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (open && templates.length === 0) {
      fetchTemplates();
      fetchCategories();
    }
  }, [open, templates.length, fetchTemplates, fetchCategories]);

  const filteredTemplates = selectedCategory
    ? templates.filter(t => t.category === selectedCategory)
    : templates;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Escolher Template</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              Todos
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>

          <div className="max-h-[300px] overflow-y-auto pr-2">
            <div className="space-y-2">
              {filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    onSelect(template);
                    onOpenChange(false);
                  }}
                  className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="font-medium">{template.name}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {template.items.length} disciplinas
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {template.items.slice(0, 3).map((item) => (
                      <Badge key={item.id} variant="secondary" className="text-xs">
                        {item.subject}
                      </Badge>
                    ))}
                    {template.items.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{template.items.length - 3}
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
