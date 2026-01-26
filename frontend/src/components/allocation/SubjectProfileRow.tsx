import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import type { CreateSubjectProfileDto } from '@/types/api';

interface SubjectProfileRowProps {
  subject: CreateSubjectProfileDto;
  onChange: (subject: CreateSubjectProfileDto) => void;
  onDelete: () => void;
}

export function SubjectProfileRow({ subject, onChange, onDelete }: SubjectProfileRowProps) {
  const [weightInput, setWeightInput] = useState(String(subject.weight));
  const [currentLevelInput, setCurrentLevelInput] = useState(String(subject.currentLevel));
  const [goalLevelInput, setGoalLevelInput] = useState(String(subject.goalLevel));

  // Sync local state when subject prop changes (only if not focused)
  if (String(subject.weight) !== weightInput && document.activeElement?.id !== `weight-${subject.position}`) {
    setWeightInput(String(subject.weight));
  }
  if (String(subject.currentLevel) !== currentLevelInput && document.activeElement?.id !== `current-${subject.position}`) {
    setCurrentLevelInput(String(subject.currentLevel));
  }
  if (String(subject.goalLevel) !== goalLevelInput && document.activeElement?.id !== `goal-${subject.position}`) {
    setGoalLevelInput(String(subject.goalLevel));
  }

  const handleBlur = (
    field: 'weight' | 'currentLevel' | 'goalLevel',
    value: string,
    min: number,
    max: number,
    isFloat = false
  ) => {
    const parsed = isFloat ? parseFloat(value) : parseInt(value, 10);

    let final: number;
    if (isNaN(parsed) || value === '') {
      final = min;
    } else {
      final = Math.min(Math.max(parsed, min), max);
    }

    onChange({ ...subject, [field]: final });

    if (field === 'weight') setWeightInput(String(final));
    if (field === 'currentLevel') setCurrentLevelInput(String(final));
    if (field === 'goalLevel') setGoalLevelInput(String(final));
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
      {/* Subject name */}
      <Input
        value={subject.subject}
        onChange={(e) => onChange({ ...subject, subject: e.target.value })}
        placeholder="Disciplina"
        className="flex-1 min-w-0"
      />

      {/* Peso */}
      <Input
        id={`weight-${subject.position}`}
        type="number"
        value={weightInput}
        onChange={(e) => setWeightInput(e.target.value)}
        onBlur={(e) => handleBlur('weight', e.target.value, 0.1, 10, true)}
        min={0.1}
        max={10}
        step={0.1}
        className="w-16 text-center"
        title="Peso"
      />

      {/* Nível atual */}
      <Input
        id={`current-${subject.position}`}
        type="number"
        value={currentLevelInput}
        onChange={(e) => setCurrentLevelInput(e.target.value)}
        onBlur={(e) => handleBlur('currentLevel', e.target.value, 0, 10)}
        min={0}
        max={10}
        step={1}
        className="w-16 text-center"
        title="Nível atual"
      />

      {/* Meta */}
      <Input
        id={`goal-${subject.position}`}
        type="number"
        value={goalLevelInput}
        onChange={(e) => setGoalLevelInput(e.target.value)}
        onBlur={(e) => handleBlur('goalLevel', e.target.value, 0, 10)}
        min={0}
        max={10}
        step={1}
        className="w-16 text-center"
        title="Meta"
      />

      <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive shrink-0 h-8 w-8">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
