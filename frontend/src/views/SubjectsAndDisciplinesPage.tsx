/**
 * Unified Subjects and Disciplines Management Page
 * Combines both pages into a single view with sidebar navigation
 */
import { useState } from 'react';
import { Layers, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useMediaQuery';

// Import content components from the original pages
import { DisciplinesContent } from './DisciplinesPage';
import { SubjectsContent } from './SubjectsPage';

type ActiveSection = 'disciplines' | 'subjects';

const sections = [
  { id: 'disciplines' as const, label: 'Disciplinas', icon: Layers },
  { id: 'subjects' as const, label: 'Tópicos', icon: BookOpen },
];

export function SubjectsAndDisciplinesPage() {
  const [activeSection, setActiveSection] = useState<ActiveSection>('disciplines');
  const isMobile = useIsMobile();

  // Mobile: tabs at the top
  if (isMobile) {
    return (
      <div className="space-y-4">
        <div className="flex border-b">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 -mb-px transition-colors",
                activeSection === section.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <section.icon className="h-4 w-4" />
              {section.label}
            </button>
          ))}
        </div>
        {activeSection === 'disciplines' ? <DisciplinesContent /> : <SubjectsContent />}
      </div>
    );
  }

  // Desktop: sidebar on the left
  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <div className="w-48 shrink-0 space-y-1">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
              activeSection === section.id
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <section.icon className="h-4 w-4" />
            {section.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {activeSection === 'disciplines' ? <DisciplinesContent /> : <SubjectsContent />}
      </div>
    </div>
  );
}

export default SubjectsAndDisciplinesPage;
