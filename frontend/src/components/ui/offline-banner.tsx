import * as React from "react"
import { WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { useOnlineStatus } from "@/hooks/useOnlineStatus"

export interface OfflineBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Custom message to display when offline */
  message?: string
}

const OfflineBanner = React.forwardRef<HTMLDivElement, OfflineBannerProps>(
  ({ className, message = "Você está offline", ...props }, ref) => {
    const isOnline = useOnlineStatus()

    if (isOnline) {
      return null
    }

    return (
      <div
        ref={ref}
        role="alert"
        aria-live="assertive"
        className={cn(
          "fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-md",
          className
        )}
        {...props}
      >
        <WifiOff className="h-4 w-4" aria-hidden="true" />
        <span>{message}</span>
      </div>
    )
  }
)
OfflineBanner.displayName = "OfflineBanner"

export { OfflineBanner }
