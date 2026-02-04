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
import { DisciplinePicker } from "@/components/ui/discipline-picker"
import type { Subject, Discipline } from "@/types/api"

// Internal representation for unified handling
interface SubjectItem {
  id: string
  name: string
  color?: string | null
  icon?: string | null
}

// Props when using Subject[] (new mode)
interface SubjectPickerPropsWithSubjects {
  value: string // Subject ID or name (depending on mode)
  onValueChange: (value: string) => void
  subjects: Subject[]
  recentSubjects?: string[] // Recent subject IDs
  onSubjectUsed?: (subjectId: string) => void
  /** Called when user wants to create a new subject. Returns the created Subject. */
  onCreateSubject?: (data: { name: string; disciplineId?: string }) => Promise<Subject>
  /** Optional list of disciplines. If provided, shows discipline picker when creating new subject. */
  disciplines?: Discipline[]
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** When true, value/onChange use subject names instead of IDs (for legacy compat) */
  useNameAsValue?: boolean
}

// Props when using string[] (legacy mode)
interface SubjectPickerPropsLegacy {
  value: string
  onValueChange: (value: string) => void
  subjects: string[]
  recentSubjects?: string[]
  onSubjectUsed?: (subject: string) => void
  onCreateSubject?: never
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  useNameAsValue?: never
}

export type SubjectPickerProps = SubjectPickerPropsWithSubjects | SubjectPickerPropsLegacy

// Type guard to check if subjects is Subject[]
function isSubjectArray(subjects: Subject[] | string[]): subjects is Subject[] {
  return subjects.length === 0 || typeof subjects[0] === 'object'
}

// Normalize string for search (remove accents, lowercase)
const normalizeString = (str: string) =>
  str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")

// Group subjects by first letter
function groupByFirstLetter(subjects: SubjectItem[]): Map<string, SubjectItem[]> {
  const groups = new Map<string, SubjectItem[]>()
  const sorted = [...subjects].sort((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
  )

  sorted.forEach((subject) => {
    const letter = subject.name[0].toUpperCase()
    if (!groups.has(letter)) groups.set(letter, [])
    groups.get(letter)!.push(subject)
  })

  return groups
}

// Shared content component for both Popover and Drawer
interface SubjectPickerContentProps {
  subjects: SubjectItem[]
  recentSubjects: SubjectItem[]
  selectedId: string
  inputValue: string
  onInputChange: (value: string) => void
  onSelect: (subject: SubjectItem) => void
  onCreateNew: () => void
  showCreateOption: boolean
  isCreating: boolean
  matchingOptions: SubjectItem[]
  emptyMessage: string
  searchPlaceholder: string
  isMobile: boolean
  // Props for create form
  showCreateForm: boolean
  pendingName: string
  disciplines?: Discipline[]
  selectedDisciplineId: string
  onDisciplineChange: (id: string) => void
  onConfirmCreate: () => void
  onCancelCreate: () => void
}

function SubjectPickerContent({
  subjects,
  recentSubjects,
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
  showCreateForm,
  pendingName,
  disciplines,
  selectedDisciplineId,
  onDisciplineChange,
  onConfirmCreate,
  onCancelCreate,
}: SubjectPickerContentProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const grouped = React.useMemo(
    () => groupByFirstLetter(matchingOptions),
    [matchingOptions]
  )

  // Filter recents that exist in subjects and match search
  const filteredRecents = React.useMemo(() => {
    const subjectIds = new Set(subjects.map(s => s.id))
    if (!inputValue) return recentSubjects.filter((r) => subjectIds.has(r.id))
    return recentSubjects.filter(
      (r) =>
        subjectIds.has(r.id) &&
        normalizeString(r.name).includes(normalizeString(inputValue))
    )
  }, [recentSubjects, subjects, inputValue])

  // Focus input on mount for mobile
  React.useEffect(() => {
    if (isMobile) {
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isMobile])

  // Render create form when showing
  if (showCreateForm && disciplines) {
    return (
      <div className={cn("flex flex-col p-4 space-y-4", isMobile ? "h-full" : "")}>
        <div className="space-y-2">
          <label className="text-sm font-medium">Nome do tópico</label>
          <div className="px-3 py-2 bg-muted rounded-md text-sm">
            {pendingName}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Disciplina <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <DisciplinePicker
            value={selectedDisciplineId}
            onValueChange={onDisciplineChange}
            disciplines={disciplines}
            placeholder="Selecione uma disciplina"
            searchPlaceholder="Buscar disciplina..."
            emptyMessage="Nenhuma disciplina"
          />
        </div>

        <div className={cn(
          "flex gap-2 pt-2",
          isMobile && "fixed bottom-0 left-0 right-0 p-4 bg-background border-t"
        )}>
          <Button
            variant="outline"
            onClick={onCancelCreate}
            disabled={isCreating}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={onConfirmCreate}
            disabled={isCreating}
            className="flex-1"
          >
            {isCreating ? "Criando..." : "Criar Tópico"}
          </Button>
        </div>
      </div>
    )
  }

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
                  key={subject.id}
                  variant={selectedId === subject.id ? "default" : "secondary"}
                  className="cursor-pointer hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  style={subject.color ? { borderColor: subject.color } : undefined}
                  onClick={() => onSelect(subject)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelect(subject)
                    }
                  }}
                  role="option"
                  tabIndex={0}
                  aria-selected={selectedId === subject.id}
                >
                  {subject.name}
                  {selectedId === subject.id && (
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
                    key={subject.id}
                    onClick={() => onSelect(subject)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onSelect(subject)
                      }
                    }}
                    role="option"
                    aria-selected={selectedId === subject.id}
                    className={cn(
                      "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      selectedId === subject.id && "bg-accent"
                    )}
                  >
                    {subject.color && (
                      <span
                        className="w-2 h-2 rounded-full mr-2 shrink-0"
                        style={{ backgroundColor: subject.color }}
                      />
                    )}
                    <span className="flex-1 text-left">{subject.name}</span>
                    {selectedId === subject.id && (
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
            aria-label={`Criar nova matéria: ${inputValue.trim()}`}
          >
            <Plus className="h-4 w-4" />
            {isCreating ? "Criando..." : `Criar "${inputValue.trim()}"`}
          </button>
        </div>
      )}
    </div>
  )
}

export function SubjectPicker(props: SubjectPickerProps) {
  const {
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
    open: controlledOpen,
    onOpenChange,
  } = props

  const onCreateSubject = 'onCreateSubject' in props ? props.onCreateSubject : undefined
  const useNameAsValue = 'useNameAsValue' in props ? props.useNameAsValue : undefined
  const disciplines = 'disciplines' in props ? props.disciplines : undefined

  const [internalOpen, setInternalOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")
  const [isCreating, setIsCreating] = React.useState(false)
  const [showCreateForm, setShowCreateForm] = React.useState(false)
  const [pendingName, setPendingName] = React.useState("")
  const [selectedDisciplineId, setSelectedDisciplineId] = React.useState("")
  const isMobile = useIsMobile()

  // Detect mode based on subjects type
  const isObjectMode = isSubjectArray(subjects)

  // Convert subjects to internal format
  const subjectItems: SubjectItem[] = React.useMemo(() => {
    if (isObjectMode) {
      return (subjects as Subject[]).map(s => ({
        id: s.id,
        name: s.name,
        color: s.color,
        icon: s.icon,
      }))
    }
    // Legacy string mode: use name as id
    return (subjects as string[]).map(s => ({
      id: s,
      name: s,
    }))
  }, [subjects, isObjectMode])

  // Convert recent subjects to internal format
  const recentItems: SubjectItem[] = React.useMemo(() => {
    if (isObjectMode) {
      // recentSubjects contains IDs, find full objects
      return recentSubjects
        .map(id => subjectItems.find(s => s.id === id))
        .filter((s): s is SubjectItem => s !== undefined)
    }
    // Legacy: recentSubjects contains names
    return (recentSubjects as string[]).map(s => ({
      id: s,
      name: s,
    }))
  }, [recentSubjects, subjectItems, isObjectMode])

  // Get selected ID (in object mode with useNameAsValue, find by name)
  const selectedId = React.useMemo(() => {
    if (!value) return ""
    if (!isObjectMode) return value
    if (useNameAsValue) {
      const found = subjectItems.find(s => s.name === value)
      return found?.id ?? ""
    }
    return value
  }, [value, isObjectMode, useNameAsValue, subjectItems])

  // Get display value
  const displayValue = React.useMemo(() => {
    if (!value) return ""
    if (!isObjectMode) return value
    if (useNameAsValue) return value
    const found = subjectItems.find(s => s.id === value)
    return found?.name ?? ""
  }, [value, isObjectMode, useNameAsValue, subjectItems])

  // Support controlled and uncontrolled modes
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = React.useCallback((newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }, [isControlled, onOpenChange])

  const matchingOptions = React.useMemo(
    () =>
      subjectItems.filter((option) =>
        normalizeString(option.name).includes(normalizeString(inputValue))
      ),
    [subjectItems, inputValue]
  )

  const exactMatch = subjectItems.some(
    (option) => normalizeString(option.name) === normalizeString(inputValue)
  )

  const showCreateOption = Boolean(inputValue.trim()) && !exactMatch

  const handleSelect = (subject: SubjectItem) => {
    // Return ID for object mode (unless useNameAsValue), name for legacy
    const returnValue = isObjectMode && !useNameAsValue ? subject.id : subject.name
    onValueChange(returnValue)
    onSubjectUsed?.(isObjectMode ? subject.id : subject.name)
    setInputValue("")
    setOpen(false)
  }

  const handleCreateNew = async () => {
    if (!inputValue.trim()) return

    if (onCreateSubject) {
      // If disciplines are available, show the create form first
      if (disciplines && disciplines.length > 0) {
        setPendingName(inputValue.trim())
        setShowCreateForm(true)
        return
      }

      // Object mode with API creation (no discipline selection)
      setIsCreating(true)
      try {
        const newSubject = await onCreateSubject({ name: inputValue.trim() })
        const returnValue = useNameAsValue ? newSubject.name : newSubject.id
        onValueChange(returnValue)
        onSubjectUsed?.(newSubject.id)
        setInputValue("")
        setOpen(false)
      } catch (error) {
        console.error('Failed to create subject:', error)
      } finally {
        setIsCreating(false)
      }
    } else {
      // Legacy mode: just return the name
      onValueChange(inputValue.trim())
      onSubjectUsed?.(inputValue.trim())
      setInputValue("")
      setOpen(false)
    }
  }

  const handleConfirmCreate = async () => {
    if (!pendingName || !onCreateSubject) return

    setIsCreating(true)
    try {
      const newSubject = await onCreateSubject({
        name: pendingName,
        disciplineId: selectedDisciplineId || undefined,
      })
      const returnValue = useNameAsValue ? newSubject.name : newSubject.id
      onValueChange(returnValue)
      onSubjectUsed?.(newSubject.id)
      setInputValue("")
      setPendingName("")
      setSelectedDisciplineId("")
      setShowCreateForm(false)
      setOpen(false)
    } catch (error) {
      console.error('Failed to create subject:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleCancelCreate = () => {
    setShowCreateForm(false)
    setPendingName("")
    setSelectedDisciplineId("")
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
      <span className="truncate">{displayValue || placeholder}</span>
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
              <DrawerTitle>Selecionar Matéria</DrawerTitle>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>
          <SubjectPickerContent
            subjects={subjectItems}
            recentSubjects={recentItems}
            selectedId={selectedId}
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
            showCreateForm={showCreateForm}
            pendingName={pendingName}
            disciplines={disciplines}
            selectedDisciplineId={selectedDisciplineId}
            onDisciplineChange={setSelectedDisciplineId}
            onConfirmCreate={handleConfirmCreate}
            onCancelCreate={handleCancelCreate}
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
          subjects={subjectItems}
          recentSubjects={recentItems}
          selectedId={selectedId}
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
          showCreateForm={showCreateForm}
          pendingName={pendingName}
          disciplines={disciplines}
          selectedDisciplineId={selectedDisciplineId}
          onDisciplineChange={setSelectedDisciplineId}
          onConfirmCreate={handleConfirmCreate}
          onCancelCreate={handleCancelCreate}
        />
      </PopoverContent>
    </Popover>
  )
}
