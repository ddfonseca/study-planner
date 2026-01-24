"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus, X, Search } from "lucide-react"

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
import { Badge } from "@/components/ui/badge"

interface SubjectPickerProps {
  value: string
  onValueChange: (value: string) => void
  subjects: string[]
  recentSubjects?: string[]
  onSubjectUsed?: (subject: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
}

// Normalize string for search (remove accents, lowercase)
const normalizeString = (str: string) =>
  str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")

// Group subjects by first letter
function groupByFirstLetter(subjects: string[]): Map<string, string[]> {
  const groups = new Map<string, string[]>()
  const sorted = [...subjects].sort((a, b) =>
    a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
  )

  sorted.forEach((subject) => {
    const letter = subject[0].toUpperCase()
    if (!groups.has(letter)) groups.set(letter, [])
    groups.get(letter)!.push(subject)
  })

  return groups
}

// Shared content component for both Popover and Drawer
interface SubjectPickerContentProps {
  subjects: string[]
  recentSubjects: string[]
  value: string
  inputValue: string
  onInputChange: (value: string) => void
  onSelect: (value: string) => void
  onCreateNew: () => void
  showCreateOption: boolean
  matchingOptions: string[]
  emptyMessage: string
  searchPlaceholder: string
  isMobile: boolean
}

function SubjectPickerContent({
  subjects,
  recentSubjects,
  value,
  inputValue,
  onInputChange,
  onSelect,
  onCreateNew,
  showCreateOption,
  matchingOptions,
  emptyMessage,
  searchPlaceholder,
  isMobile,
}: SubjectPickerContentProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const grouped = React.useMemo(
    () => groupByFirstLetter(matchingOptions),
    [matchingOptions]
  )

  // Filter recents that exist in subjects and match search
  const filteredRecents = React.useMemo(() => {
    if (!inputValue) return recentSubjects.filter((r) => subjects.includes(r))
    return recentSubjects.filter(
      (r) =>
        subjects.includes(r) &&
        normalizeString(r).includes(normalizeString(inputValue))
    )
  }, [recentSubjects, subjects, inputValue])

  // Focus input on mount for mobile
  React.useEffect(() => {
    if (isMobile) {
      // Small delay to ensure drawer animation is complete
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
        {/* Recent subjects chips */}
        {filteredRecents.length > 0 && (
          <div className="p-2 border-b">
            <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
              RECENTES
            </p>
            <div className="flex flex-wrap gap-1.5" role="listbox" aria-label="Matérias recentes">
              {filteredRecents.map((subject) => (
                <Badge
                  key={subject}
                  variant={value === subject ? "default" : "secondary"}
                  className="cursor-pointer hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  onClick={() => onSelect(subject)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelect(subject)
                    }
                  }}
                  role="option"
                  tabIndex={0}
                  aria-selected={value === subject}
                >
                  {subject}
                  {value === subject && (
                    <Check className="ml-1 h-3 w-3" />
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Grouped list A-Z */}
        {matchingOptions.length > 0 ? (
          <div className="p-1" role="listbox" aria-label="Lista de matérias">
            {Array.from(grouped.entries()).map(([letter, items]) => (
              <div key={letter} role="group" aria-label={`Matérias com letra ${letter}`}>
                <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground sticky top-0 bg-popover" aria-hidden="true">
                  {letter}
                </p>
                {items.map((subject) => (
                  <button
                    key={subject}
                    onClick={() => onSelect(subject)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onSelect(subject)
                      }
                    }}
                    role="option"
                    aria-selected={value === subject}
                    className={cn(
                      "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      value === subject && "bg-accent"
                    )}
                  >
                    <span className="flex-1 text-left">{subject}</span>
                    {value === subject && (
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
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onCreateNew()
              }
            }}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-sm text-primary hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={`Criar nova matéria: ${inputValue.trim()}`}
          >
            <Plus className="h-4 w-4" />
            Criar "{inputValue.trim()}"
          </button>
        </div>
      )}
    </div>
  )
}

export function SubjectPicker({
  value,
  onValueChange,
  subjects,
  recentSubjects = [],
  onSubjectUsed,
  placeholder = "Selecione...",
  searchPlaceholder = "Buscar matéria...",
  emptyMessage = "Nenhuma matéria encontrada.",
  disabled = false,
  className,
}: SubjectPickerProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")
  const isMobile = useIsMobile()

  const matchingOptions = React.useMemo(
    () =>
      subjects.filter((option) =>
        normalizeString(option).includes(normalizeString(inputValue))
      ),
    [subjects, inputValue]
  )

  const exactMatch = subjects.some(
    (option) => normalizeString(option) === normalizeString(inputValue)
  )

  const showCreateOption = Boolean(inputValue.trim()) && !exactMatch

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue)
    onSubjectUsed?.(selectedValue)
    setInputValue("")
    setOpen(false)
  }

  const handleCreateNew = () => {
    if (inputValue.trim()) {
      onValueChange(inputValue.trim())
      onSubjectUsed?.(inputValue.trim())
      setInputValue("")
      setOpen(false)
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
        !value && "text-muted-foreground",
        className
      )}
    >
      <span className="truncate">{value || placeholder}</span>
      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </Button>
  )

  // Mobile: Use Drawer
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <button
          type="button"
          onClick={() => !disabled && setOpen(true)}
          disabled={disabled}
          className="w-full"
        >
          {triggerButton}
        </button>
        <DrawerContent className="h-[85vh] max-h-[85vh]">
          <DrawerHeader className="border-b pb-2">
            <div className="flex items-center justify-between">
              <DrawerTitle>Selecionar Matéria</DrawerTitle>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>
          <SubjectPickerContent
            subjects={subjects}
            recentSubjects={recentSubjects}
            value={value}
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSelect={handleSelect}
            onCreateNew={handleCreateNew}
            showCreateOption={showCreateOption}
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
        <SubjectPickerContent
          subjects={subjects}
          recentSubjects={recentSubjects}
          value={value}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSelect={handleSelect}
          onCreateNew={handleCreateNew}
          showCreateOption={showCreateOption}
          matchingOptions={matchingOptions}
          emptyMessage={emptyMessage}
          searchPlaceholder={searchPlaceholder}
          isMobile={false}
        />
      </PopoverContent>
    </Popover>
  )
}
