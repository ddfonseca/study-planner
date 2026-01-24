import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const emptyStateVariants = cva(
  "flex flex-col items-center justify-center text-center",
  {
    variants: {
      variant: {
        default: "text-muted-foreground",
        subtle: "text-muted-foreground/70",
        card: "rounded-[var(--radius)] border bg-card text-card-foreground p-6",
      },
      size: {
        default: "py-12 gap-3",
        sm: "py-6 gap-2",
        lg: "py-16 gap-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const emptyStateIconVariants = cva(
  "text-muted-foreground",
  {
    variants: {
      size: {
        default: "h-12 w-12",
        sm: "h-8 w-8",
        lg: "h-16 w-16",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

const emptyStateTitleVariants = cva(
  "font-medium",
  {
    variants: {
      size: {
        default: "text-base",
        sm: "text-sm",
        lg: "text-lg",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

const emptyStateDescriptionVariants = cva(
  "text-muted-foreground max-w-sm",
  {
    variants: {
      size: {
        default: "text-sm",
        sm: "text-xs",
        lg: "text-base",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

export interface EmptyStateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof emptyStateVariants> {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, variant, size, icon: Icon, title, description, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(emptyStateVariants({ variant, size, className }))}
        {...props}
      >
        {Icon && (
          <Icon
            className={cn(emptyStateIconVariants({ size }))}
            aria-hidden="true"
          />
        )}
        <div className="space-y-1">
          <p className={cn(emptyStateTitleVariants({ size }))}>{title}</p>
          {description && (
            <p className={cn(emptyStateDescriptionVariants({ size }))}>
              {description}
            </p>
          )}
        </div>
        {action && <div className="mt-2">{action}</div>}
      </div>
    )
  }
)
EmptyState.displayName = "EmptyState"

// eslint-disable-next-line react-refresh/only-export-components
export { EmptyState, emptyStateVariants }
