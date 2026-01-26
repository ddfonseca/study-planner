import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calculator, Edit, Trash2, Calendar } from 'lucide-react';
import type { ExamProfile } from '@/types/api';

function computeDaysUntilExam(examDateStr: string | null): number | null {
  if (!examDateStr) return null;
  const examDate = new Date(examDateStr);
  return Math.ceil((examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

interface ExamProfileCardProps {
  profile: ExamProfile;
  onEdit: () => void;
  onDelete: () => void;
  onCalculate: () => void;
}

export function ExamProfileCard({ profile, onEdit, onDelete, onCalculate }: ExamProfileCardProps) {
  const examDate = profile.examDate ? new Date(profile.examDate) : null;
  const [daysUntilExam] = useState(() => computeDaysUntilExam(profile.examDate ?? null));

  return (
    <Card className="relative">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{profile.name}</CardTitle>
            <CardDescription className="mt-1">
              {profile.subjects.length} disciplinas • {profile.weeklyHours}h/semana
            </CardDescription>
          </div>
          {profile.isActive && (
            <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-200">
              Ativo
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {examDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {examDate.toLocaleDateString('pt-BR')}
              {daysUntilExam !== null && daysUntilExam > 0 && (
                <span className="ml-1 text-primary">({daysUntilExam} dias)</span>
              )}
            </span>
          </div>
        )}

        <div className="flex flex-wrap gap-1">
          {profile.subjects.slice(0, 4).map((subject) => (
            <Badge key={subject.id} variant="secondary" className="text-xs">
              {subject.subject}
            </Badge>
          ))}
          {profile.subjects.length > 4 && (
            <Badge variant="outline" className="text-xs">
              +{profile.subjects.length - 4}
            </Badge>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="default" size="sm" onClick={onCalculate} className="flex-1">
            <Calculator className="h-4 w-4 mr-1" />
            Calcular
          </Button>
          <Button variant="outline" size="icon" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={onDelete} className="text-destructive hover:bg-destructive/10">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
