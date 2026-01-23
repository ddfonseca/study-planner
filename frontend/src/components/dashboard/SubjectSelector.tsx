/**
 * Subject Selector - Dropdown to select a subject for analytics
 */
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BookOpen } from 'lucide-react';

interface SubjectSelectorProps {
  subjects: string[];
  selectedSubject: string | null;
  onSelectSubject: (subject: string) => void;
}

export function SubjectSelector({
  subjects,
  selectedSubject,
  onSelectSubject,
}: SubjectSelectorProps) {
  if (subjects.length === 0) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <BookOpen className="h-4 w-4" />
        <span className="text-sm">Nenhuma materia encontrada</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 text-muted-foreground">
        <BookOpen className="h-4 w-4" />
        <span className="text-sm">Materia:</span>
      </div>
      <Select
        value={selectedSubject || undefined}
        onValueChange={onSelectSubject}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Selecione uma materia" />
        </SelectTrigger>
        <SelectContent>
          {subjects.map((subject) => (
            <SelectItem key={subject} value={subject}>
              {subject}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default SubjectSelector;
