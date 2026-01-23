import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// eslint-disable-next-line react-refresh/only-export-components
export const badgeVariants = cva(
  "inline-flex items-center rounded-[calc(var(--radius)-4px)] border px-2.5 py-0.5 text-xs font-semibold transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:brightness-[0.98]",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:brightness-[0.98]",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:brightness-[0.98]",
        outline: "text-foreground",
        accent:
          "border-transparent bg-accent text-accent-foreground hover:brightness-[0.98]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge }
