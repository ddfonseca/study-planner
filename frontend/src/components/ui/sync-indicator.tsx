import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Check, AlertCircle, RefreshCw, Cloud } from "lucide-react"

import { cn } from "@/lib/utils"

const syncIndicatorVariants = cva(
  "inline-flex items-center gap-1.5 text-sm font-medium transition-all duration-200",
  {
    variants: {
      state: {
        idle: "text-muted-foreground",
        syncing: "text-primary",
        success: "text-green-600 dark:text-green-500",
        error: "text-destructive",
      },
      size: {
        default: "text-sm",
        sm: "text-xs",
        lg: "text-base",
      },
    },
    defaultVariants: {
      state: "idle",
      size: "default",
    },
  }
)

const iconVariants = cva(
  "transition-all duration-200",
  {
    variants: {
      state: {
        idle: "text-muted-foreground",
        syncing: "text-primary animate-spin",
        success: "text-green-600 dark:text-green-500",
        error: "text-destructive",
      },
      size: {
        default: "h-4 w-4",
        sm: "h-3 w-3",
        lg: "h-5 w-5",
      },
    },
    defaultVariants: {
      state: "idle",
      size: "default",
    },
  }
)

export type SyncState = "idle" | "syncing" | "success" | "error"

export interface SyncIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof syncIndicatorVariants> {
  state?: SyncState
  showLabel?: boolean
  labels?: {
    idle?: string
    syncing?: string
    success?: string
    error?: string
  }
  /** Callback when retry button is clicked (only shown in error state) */
  onRetry?: () => void
  /** Whether retry is currently in progress */
  isRetrying?: boolean
  /** Custom retry button text */
  retryText?: string
}

const defaultLabels = {
  idle: "Synced",
  syncing: "Syncing...",
  success: "Saved",
  error: "Sync failed",
}

const StateIcon = ({ state, size }: { state: SyncState; size: "default" | "sm" | "lg" | null | undefined }) => {
  const iconClass = cn(iconVariants({ state, size }))

  switch (state) {
    case "syncing":
      return <RefreshCw className={iconClass} aria-hidden="true" />
    case "success":
      return <Check className={iconClass} aria-hidden="true" />
    case "error":
      return <AlertCircle className={iconClass} aria-hidden="true" />
    case "idle":
    default:
      return <Cloud className={iconClass} aria-hidden="true" />
  }
}

const SyncIndicator = React.forwardRef<HTMLDivElement, SyncIndicatorProps>(
  (
    {
      className,
      state = "idle",
      size,
      showLabel = true,
      labels,
      onRetry,
      isRetrying = false,
      retryText = "Tentar novamente",
      ...props
    },
    ref
  ) => {
    const mergedLabels = { ...defaultLabels, ...labels }
    const currentLabel = mergedLabels[state]

    const ariaLabel = `Sync status: ${currentLabel}`

    const showRetryButton = state === "error" && onRetry && !isRetrying

    return (
      <div
        ref={ref}
        role="status"
        aria-label={ariaLabel}
        aria-live="polite"
        className={cn(syncIndicatorVariants({ state, size, className }))}
        {...props}
      >
        <StateIcon state={state} size={size} />
        {showLabel && <span>{currentLabel}</span>}
        {showRetryButton && (
          <button
            type="button"
            onClick={onRetry}
            className="ml-1 underline hover:no-underline focus:outline-none focus:ring-1 focus:ring-current rounded px-1"
            aria-label={retryText}
          >
            {retryText}
          </button>
        )}
        {isRetrying && (
          <RefreshCw className={cn(iconVariants({ state: "syncing", size }))} aria-hidden="true" />
        )}
      </div>
    )
  }
)
SyncIndicator.displayName = "SyncIndicator"

// eslint-disable-next-line react-refresh/only-export-components
export { SyncIndicator, syncIndicatorVariants }
