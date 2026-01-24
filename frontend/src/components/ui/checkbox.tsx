/**
 * Checkbox component
 */
import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { useHaptic } from '@/hooks/useHaptic';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    const { trigger: triggerHaptic } = useHaptic();

    const handleClick = () => {
      triggerHaptic('light');
      onCheckedChange?.(!checked);
    };

    return (
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={handleClick}
        className={cn(
          'peer h-6 w-6 min-h-[24px] min-w-[24px] shrink-0 rounded-sm border border-primary ring-offset-background',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
          'touch-action-manipulation select-none active:scale-95',
          checked && 'bg-primary text-primary-foreground',
          className
        )}
        data-state={checked ? 'checked' : 'unchecked'}
      >
        {checked && <Check className="h-4 w-4" />}
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          className="sr-only"
          {...props}
        />
      </button>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
