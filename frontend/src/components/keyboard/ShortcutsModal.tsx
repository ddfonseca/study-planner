import {
  CommandDialog,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command';
import { Calendar, BarChart3, Settings, Plus, Timer, Keyboard, FileText } from 'lucide-react';

const shortcutGroups = [
  {
    heading: 'Navigation',
    items: [
      { icon: Calendar, label: 'Go to Calendar', shortcut: 'G → C' },
      { icon: BarChart3, label: 'Go to Dashboard', shortcut: 'G → D' },
      { icon: FileText, label: 'Go to Notes', shortcut: 'G → N' },
      { icon: Settings, label: 'Go to Settings', shortcut: 'G → S' },
    ],
  },
  {
    heading: 'Actions',
    items: [
      { icon: Plus, label: 'New work session', shortcut: 'N' },
      { icon: Timer, label: 'Timer: select/start/stop', shortcut: 'T' },
    ],
  },
  {
    heading: 'Help',
    items: [
      { icon: Keyboard, label: 'Show shortcuts', shortcut: '?' },
    ],
  },
];

interface ShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShortcutsModal({ open, onOpenChange }: ShortcutsModalProps) {
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <div className="px-4 py-3 border-b">
        <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
        <p className="text-sm text-muted-foreground">
          Use shortcuts to navigate faster
        </p>
      </div>

      <CommandList className="max-h-[400px] p-2">
        {shortcutGroups.map((group) => (
          <CommandGroup key={group.heading} heading={group.heading}>
            {group.items.map((item) => (
              <CommandItem
                key={item.shortcut}
                className="cursor-default"
                onSelect={() => {}}
              >
                <item.icon className="mr-3 h-4 w-4 text-muted-foreground" />
                <span className="flex-1">{item.label}</span>
                <CommandShortcut className="ml-4">
                  {item.shortcut}
                </CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>

      <div className="px-4 py-3 border-t bg-muted/50">
        <p className="text-xs text-muted-foreground text-center">
          Press <kbd className="px-1.5 py-0.5 bg-background rounded border text-xs">Esc</kbd> to close
        </p>
      </div>
    </CommandDialog>
  );
}
