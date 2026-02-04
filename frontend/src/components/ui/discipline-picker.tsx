"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus, X, Search, Layers } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/useMediaQuery"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import type { Discipline } from "@/types/api"

export interface DisciplinePickerProps {
  value: string // Discipline ID
  onValueChange: (value: string) => void
  disciplines: Discipline[]
  onCreateDiscipline?: (name: string) => Promise<Discipline>
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

// Normalize string for search (remove accents, lowercase)
const normalizeString = (str: string) =>
  str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")

// Group disciplines by first letter
function groupByFirstLetter(disciplines: Discipline[]): Map<string, Discipline[]> {
  const groups = new Map<string, Discipline[]>()
  const sorted = [...disciplines].sort((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
  )

  sorted.forEach((discipline) => {
    const letter = discipline.name[0].toUpperCase()
    if (!groups.has(letter)) groups.set(letter, [])
    groups.get(letter)!.push(discipline)
  })

  return groups
}

// Shared content component for both Popover and Drawer
interface DisciplinePickerContentProps {
  disciplines: Discipline[]
  selectedId: string
  inputValue: string
  onInputChange: (value: string) => void
  onSelect: (discipline: Discipline) => void
  onCreateNew: () => void
  showCreateOption: boolean
  isCreating: boolean
  matchingOptions: Discipline[]
  emptyMessage: string
  searchPlaceholder: string
  isMobile: boolean
}

function DisciplinePickerContent({
  selectedId,
  inputValue,
  onInputChange,
  onSelect,
  onCreateNew,
  showCreateOption,
  isCreating,
  matchingOptions,
  emptyMessage,
  searchPlaceholder,
  isMobile,
}: DisciplinePickerContentProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const grouped = React.useMemo(
    () => groupByFirstLetter(matchingOptions),
    [matchingOptions]
  )

  // Focus input on mount for mobile
  React.useEffect(() => {
    if (isMobile) {
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isMobile])

  return (
    <div className={cn("flex flex-col", isMobile ? "h-full" : "")}>
      {/* Search input */}
      <div className={cn(
        "flex items-center border-b px-3",
        isMobile && "sticky top-0 bg-background z-10"
      )}>
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <input
          ref={inputRef}
          type="text"
          placeholder={searchPlaceholder}
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
        />
        {inputValue && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => onInputChange("")}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Content area */}
      <div className={cn(
        "overflow-y-auto",
        isMobile ? "flex-1 pb-16" : "max-h-[300px]"
      )}>
        {/* Grouped list A-Z */}
        {matchingOptions.length > 0 ? (
          <div className="p-1" role="listbox" aria-label="Lista de disciplinas">
            {Array.from(grouped.entries()).map(([letter, items]) => (
              <div key={letter} role="group" aria-label={`Disciplinas com letra ${letter}`}>
                <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground sticky top-0 bg-popover" aria-hidden="true">
                  {letter}
                </p>
                {items.map((discipline) => (
                  <button
                    key={discipline.id}
                    onClick={() => onSelect(discipline)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onSelect(discipline)
                      }
                    }}
                    role="option"
                    aria-selected={selectedId === discipline.id}
                    className={cn(
                      "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      selectedId === discipline.id && "bg-accent"
                    )}
                  >
                    <Layers className="h-3.5 w-3.5 mr-2 text-muted-foreground shrink-0" />
                    {discipline.color && (
                      <span
                        className="w-2 h-2 rounded-full mr-2 shrink-0"
                        style={{ backgroundColor: discipline.color }}
                      />
                    )}
                    <span className="flex-1 text-left">{discipline.name}</span>
                    {discipline.subjects && discipline.subjects.length > 0 && (
                      <span className="text-xs text-muted-foreground mr-2">
                        ({discipline.subjects.length})
                      </span>
                    )}
                    {selectedId === discipline.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        ) : !showCreateOption ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        ) : null}
      </div>

      {/* Create new option - fixed at bottom on mobile */}
      {showCreateOption && (
        <div className={cn(
          "p-2 border-t bg-background",
          isMobile && "fixed bottom-0 left-0 right-0"
        )}>
          <button
            onClick={onCreateNew}
            disabled={isCreating}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onCreateNew()
              }
            }}
            className={cn(
              "flex w-full items-center gap-2 rounded-sm px-2 py-2 text-sm text-primary hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isCreating && "opacity-50 cursor-not-allowed"
            )}
            aria-label={`Criar nova disciplina: ${inputValue.trim()}`}
          >
            <Plus className="h-4 w-4" />
            {isCreating ? "Criando..." : `Criar "${inputValue.trim()}"`}
          </button>
        </div>
      )}
    </div>
  )
}

export function DisciplinePicker(props: DisciplinePickerProps) {
  const {
    value,
    onValueChange,
    disciplines,
    onCreateDiscipline,
    placeholder = "Selecione...",
    searchPlaceholder = "Buscar disciplina...",
    emptyMessage = "Nenhuma disciplina encontrada.",
    disabled = false,
    className,
    open: controlledOpen,
    onOpenChange,
  } = props

  const [internalOpen, setInternalOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")
  const [isCreating, setIsCreating] = React.useState(false)
  const isMobile = useIsMobile()

  // Support controlled and uncontrolled modes
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = React.useCallback((newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }, [isControlled, onOpenChange])

  // Get display value
  const displayValue = React.useMemo(() => {
    if (!value) return ""
    const found = disciplines.find(d => d.id === value)
    return found?.name ?? ""
  }, [value, disciplines])

  const matchingOptions = React.useMemo(
    () =>
      disciplines.filter((option) =>
        normalizeString(option.name).includes(normalizeString(inputValue))
      ),
    [disciplines, inputValue]
  )

  const exactMatch = disciplines.some(
    (option) => normalizeString(option.name) === normalizeString(inputValue)
  )

  const showCreateOption = Boolean(inputValue.trim()) && !exactMatch && !!onCreateDiscipline

  const handleSelect = (discipline: Discipline) => {
    onValueChange(discipline.id)
    setInputValue("")
    setOpen(false)
  }

  const handleCreateNew = async () => {
    if (!inputValue.trim() || !onCreateDiscipline) return

    setIsCreating(true)
    try {
      const newDiscipline = await onCreateDiscipline(inputValue.trim())
      onValueChange(newDiscipline.id)
      setInputValue("")
      setOpen(false)
    } catch (error) {
      console.error('Failed to create discipline:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const triggerButton = (
    <Button
      variant="outline"
      role="combobox"
      aria-expanded={open}
      disabled={disabled}
      className={cn(
        "w-full justify-between font-normal",
        !displayValue && "text-muted-foreground",
        className
      )}
    >
      <span className="flex items-center gap-2 truncate">
        {displayValue ? (
          <>
            <Layers className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            {displayValue}
          </>
        ) : (
          placeholder
        )}
      </span>
      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </Button>
  )

  // Mobile: Use Drawer
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <div
          onClick={() => !disabled && setOpen(true)}
          className="w-full"
        >
          {triggerButton}
        </div>
        <DrawerContent className="h-[85vh] max-h-[85vh]">
          <DrawerHeader className="border-b pb-2">
            <div className="flex items-center justify-between">
              <DrawerTitle>Selecionar Disciplina</DrawerTitle>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>
          <DisciplinePickerContent
            disciplines={disciplines}
            selectedId={value}
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSelect={handleSelect}
            onCreateNew={handleCreateNew}
            showCreateOption={showCreateOption}
            isCreating={isCreating}
            matchingOptions={matchingOptions}
            emptyMessage={emptyMessage}
            searchPlaceholder={searchPlaceholder}
            isMobile={true}
          />
        </DrawerContent>
      </Drawer>
    )
  }

  // Desktop: Use Popover
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <DisciplinePickerContent
          disciplines={disciplines}
          selectedId={value}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSelect={handleSelect}
          onCreateNew={handleCreateNew}
          showCreateOption={showCreateOption}
          isCreating={isCreating}
          matchingOptions={matchingOptions}
          emptyMessage={emptyMessage}
          searchPlaceholder={searchPlaceholder}
          isMobile={false}
        />
      </PopoverContent>
    </Popover>
  )
}
