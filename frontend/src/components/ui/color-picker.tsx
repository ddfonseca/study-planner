"use client"

import * as React from "react"
import { X, Palette } from "lucide-react"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/useMediaQuery"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface ColorPickerProps {
  value: string | null
  onValueChange: (color: string | null) => void
  colors: (string | null)[]
  disabled?: boolean
  className?: string
}

export function ColorPicker({
  value,
  onValueChange,
  colors,
  disabled = false,
  className,
}: ColorPickerProps) {
  const [open, setOpen] = React.useState(false)
  const isMobile = useIsMobile()

  const handleSelect = (color: string | null) => {
    onValueChange(color)
    setOpen(false)
  }

  // Desktop: show inline color swatches
  if (!isMobile) {
    return (
      <div className={cn("flex gap-1", className)}>
        {colors.map((color, i) => (
          <button
            key={i}
            onClick={() => onValueChange(color)}
            disabled={disabled}
            className={cn(
              "w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary",
              value === color && "ring-2 ring-offset-2 ring-primary",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            style={{ backgroundColor: color || 'transparent', borderColor: color || '#d1d5db' }}
            aria-label={color ? `Cor ${color}` : "Sem cor"}
          >
            {color === null && <X className="h-3 w-3 mx-auto text-muted-foreground" />}
          </button>
        ))}
      </div>
    )
  }

  // Mobile: show a color trigger button that opens a popover
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-md border shrink-0 transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
          aria-label="Selecionar cor"
        >
          {value ? (
            <span
              className="w-5 h-5 rounded-full border"
              style={{ backgroundColor: value, borderColor: value }}
            />
          ) : (
            <Palette className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="flex flex-wrap gap-1.5 justify-center">
          {colors.map((color, i) => (
            <button
              key={i}
              onClick={() => handleSelect(color)}
              disabled={disabled}
              className={cn(
                "w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
                value === color && "ring-2 ring-offset-2 ring-primary",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              style={{ backgroundColor: color || 'transparent', borderColor: color || '#d1d5db' }}
              aria-label={color ? `Cor ${color}` : "Sem cor"}
            >
              {color === null && <X className="h-4 w-4 mx-auto text-muted-foreground" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
