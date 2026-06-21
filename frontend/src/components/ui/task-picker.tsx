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
import { ProjectPicker } from "@/components/ui/project-picker"
import type { Task, Project } from "@/types/api"

// Internal representation for unified handling
interface TaskItem {
  id: string
  name: string
  color?: string | null
  icon?: string | null
}

// Props when using Task[] (new mode)
interface TaskPickerPropsWithTasks {
  value: string // Subject ID or name (depending on mode)
  onValueChange: (value: string) => void
  subjects: Task[]
  recentTasks?: string[] // Recent subject IDs
  onTaskUsed?: (subjectId: string) => void
  /** Called when user wants to create a new subject. Returns the created Subject. */
  onCreateTask?: (data: { name: string; projectId?: string }) => Promise<Task>
  /** Optional list of projects. If provided, shows discipline picker when creating new subject. */
  projects?: Project[]
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
interface TaskPickerPropsLegacy {
  value: string
  onValueChange: (value: string) => void
  subjects: string[]
  recentTasks?: string[]
  onTaskUsed?: (subject: string) => void
  onCreateTask?: never
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  useNameAsValue?: never
}

export type TaskPickerProps = TaskPickerPropsWithTasks | TaskPickerPropsLegacy

// Type guard to check if tasks is Task[]
function isTaskArray(items: Task[] | string[]): items is Task[] {
  return items.length === 0 || typeof items[0] === 'object'
}

// Normalize string for search (remove accents, lowercase)
const normalizeString = (str: string) =>
  str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")

// Group subjects by first letter
function groupByFirstLetter(subjects: TaskItem[]): Map<string, TaskItem[]> {
  const groups = new Map<string, TaskItem[]>()
  const sorted = [...subjects].sort((a, b) =>
    a.name.localeCompare(b.name, 'en-US', { sensitivity: 'base' })
  )

  sorted.forEach((subject) => {
    const letter = subject.name[0].toUpperCase()
    if (!groups.has(letter)) groups.set(letter, [])
    groups.get(letter)!.push(subject)
  })

  return groups
}

// Shared content component for both Popover and Drawer
interface TaskPickerContentProps {
  subjects: TaskItem[]
  recentTasks: TaskItem[]
  selectedId: string
  inputValue: string
  onInputChange: (value: string) => void
  onSelect: (subject: TaskItem) => void
  onCreateNew: () => void
  showCreateOption: boolean
  isCreating: boolean
  matchingOptions: TaskItem[]
  emptyMessage: string
  searchPlaceholder: string
  isMobile: boolean
  // Props for create form
  showCreateForm: boolean
  pendingName: string
  projects?: Project[]
  selectedProjectId: string
  onDisciplineChange: (id: string) => void
  onConfirmCreate: () => void
  onCancelCreate: () => void
}

function TaskPickerContent({
  subjects,
  recentTasks,
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
  projects,
  selectedProjectId,
  onDisciplineChange,
  onConfirmCreate,
  onCancelCreate,
}: TaskPickerContentProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const grouped = React.useMemo(
    () => groupByFirstLetter(matchingOptions),
    [matchingOptions]
  )

  // Filter recents that exist in subjects and match search
  const filteredRecents = React.useMemo(() => {
    const subjectIds = new Set(subjects.map(s => s.id))
    if (!inputValue) return recentTasks.filter((r) => subjectIds.has(r.id))
    return recentTasks.filter(
      (r) =>
        subjectIds.has(r.id) &&
        normalizeString(r.name).includes(normalizeString(inputValue))
    )
  }, [recentTasks, subjects, inputValue])

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
  if (showCreateForm && projects) {
    return (
      <div className={cn("flex flex-col p-4 space-y-4", isMobile ? "h-full" : "")}>
        <div className="space-y-2">
          <label className="text-sm font-medium">Task name</label>
          <div className="px-3 py-2 bg-muted rounded-md text-sm">
            {pendingName}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Project <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <ProjectPicker
            value={selectedProjectId}
            onValueChange={onDisciplineChange}
            projects={projects}
            placeholder="Select a project"
            searchPlaceholder="Search project..."
            emptyMessage="No projects found"
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
            Cancel
          </Button>
          <Button
            onClick={onConfirmCreate}
            disabled={isCreating}
            className="flex-1"
          >
            {isCreating ? "Creating..." : "Create Task"}
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
          className="flex h-10 w-full bg-transparent py-3 text-base outline-none placeholder:text-muted-foreground md:text-sm"
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
            <div className="flex flex-wrap gap-1.5" role="listbox" aria-label="Recent tasks">
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
          <div className="p-1" role="listbox" aria-label="Task list">
            {Array.from(grouped.entries()).map(([letter, items]) => (
              <div key={letter} role="group" aria-label={`Tasks starting with ${letter}`}>
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
            aria-label={`Create new task: ${inputValue.trim()}`}
          >
            <Plus className="h-4 w-4" />
            {isCreating ? "Creating..." : `Create "${inputValue.trim()}"`}
          </button>
        </div>
      )}
    </div>
  )
}

export function TaskPicker(props: TaskPickerProps) {
  const {
    value,
    onValueChange,
    subjects,
    recentTasks = [],
    onTaskUsed,
    placeholder = "Select...",
    searchPlaceholder = "Search task...",
    emptyMessage = "No tasks found.",
    disabled = false,
    className,
    open: controlledOpen,
    onOpenChange,
  } = props

  const onCreateTask = 'onCreateTask' in props ? props.onCreateTask : undefined
  const useNameAsValue = 'useNameAsValue' in props ? props.useNameAsValue : undefined
  const projects = 'projects' in props ? props.projects : undefined

  const [internalOpen, setInternalOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")
  const [isCreating, setIsCreating] = React.useState(false)
  const [showCreateForm, setShowCreateForm] = React.useState(false)
  const [pendingName, setPendingName] = React.useState("")
  const [selectedProjectId, setSelectedProjectId] = React.useState("")
  const isMobile = useIsMobile()

  // Detect mode based on subjects type
  const isObjectMode = isTaskArray(subjects)

  // Convert subjects to internal format
  const subjectItems: TaskItem[] = React.useMemo(() => {
    if (isObjectMode) {
      return (subjects as Task[]).map(s => ({
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
  const recentItems: TaskItem[] = React.useMemo(() => {
    if (isObjectMode) {
      // recentTasks contains IDs, find full objects
      return recentTasks
        .map(id => subjectItems.find(s => s.id === id))
        .filter((s): s is TaskItem => s !== undefined)
    }
    // Legacy: recentTasks contains names
    return (recentTasks as string[]).map(s => ({
      id: s,
      name: s,
    }))
  }, [recentTasks, subjectItems, isObjectMode])

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

  const handleSelect = (subject: TaskItem) => {
    // Return ID for object mode (unless useNameAsValue), name for legacy
    const returnValue = isObjectMode && !useNameAsValue ? subject.id : subject.name
    onValueChange(returnValue)
    onTaskUsed?.(isObjectMode ? subject.id : subject.name)
    setInputValue("")
    setOpen(false)
  }

  const handleCreateNew = async () => {
    if (!inputValue.trim()) return

    if (onCreateTask) {
      // If projects are available, show the create form first
      if (projects && projects.length > 0) {
        setPendingName(inputValue.trim())
        setShowCreateForm(true)
        return
      }

      // Object mode with API creation (no discipline selection)
      setIsCreating(true)
      try {
        const newTask = await onCreateTask({ name: inputValue.trim() })
        const returnValue = useNameAsValue ? newTask.name : newTask.id
        onValueChange(returnValue)
        onTaskUsed?.(newTask.id)
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
      onTaskUsed?.(inputValue.trim())
      setInputValue("")
      setOpen(false)
    }
  }

  const handleConfirmCreate = async () => {
    if (!pendingName || !onCreateTask) return

    setIsCreating(true)
    try {
      const newTask = await onCreateTask({
        name: pendingName,
        projectId: selectedProjectId || undefined,
      })
      const returnValue = useNameAsValue ? newTask.name : newTask.id
      onValueChange(returnValue)
      onTaskUsed?.(newTask.id)
      setInputValue("")
      setPendingName("")
      setSelectedProjectId("")
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
    setSelectedProjectId("")
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
              <DrawerTitle>Select Task</DrawerTitle>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>
          <TaskPickerContent
            subjects={subjectItems}
            recentTasks={recentItems}
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
            projects={projects}
            selectedProjectId={selectedProjectId}
            onDisciplineChange={setSelectedProjectId}
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
        <TaskPickerContent
          subjects={subjectItems}
          recentTasks={recentItems}
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
          projects={projects}
          selectedProjectId={selectedProjectId}
          onDisciplineChange={setSelectedProjectId}
          onConfirmCreate={handleConfirmCreate}
          onCancelCreate={handleCancelCreate}
        />
      </PopoverContent>
    </Popover>
  )
}
