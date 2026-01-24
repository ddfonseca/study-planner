import * as React from "react"
import { WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { useOnlineStatus } from "@/hooks/useOnlineStatus"

export interface TimerOfflineWarningProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Custom message to display when offline */
  message?: string
}

const TimerOfflineWarning = React.forwardRef<HTMLDivElement, TimerOfflineWarningProps>(
  ({ className, message = "Você está offline. A sessão será salva quando a conexão voltar.", ...props }, ref) => {
    const isOnline = useOnlineStatus()

    if (isOnline) {
      return null
    }

    return (
      <div
        ref={ref}
        role="alert"
        aria-live="polite"
        className={cn(
          "flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300",
          className
        )}
        {...props}
      >
        <WifiOff className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
        <span>{message}</span>
      </div>
    )
  }
)
TimerOfflineWarning.displayName = "TimerOfflineWarning"

export { TimerOfflineWarning }
