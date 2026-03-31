/**
 * API Types - Types for backend API responses
 */

// User entity from better-auth
export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Workspace entity
export interface Workspace {
  id: string;
  userId: string;
  name: string;
  color: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// Category entity - categorization for tasks
export interface Category {
  id: string;
  workspaceId: string;
  name: string;
  color: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    tasks: number;
  };
}

// TaskCategory junction
export interface TaskCategory {
  id: string;
  taskId: string;
  categoryId: string;
  category: Category;
  createdAt: string;
}

// Task entity - normalized task per workspace
export interface Task {
  id: string;
  workspaceId: string;
  projectId: string | null;
  name: string;
  color: string | null;
  icon: string | null;
  category: string | null; // @deprecated - use categories
  categories: TaskCategory[];
  project?: Project | null;
  position: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Create task DTO
export interface CreateTaskDto {
  name: string;
  color?: string;
  icon?: string;
  category?: string; // @deprecated - use categoryIds
  categoryIds?: string[];
  position?: number;
  projectId?: string;
}

// Update task DTO
export interface UpdateTaskDto {
  name?: string;
  color?: string;
  icon?: string;
  category?: string; // @deprecated - use categoryIds
  categoryIds?: string[];
  position?: number;
}

// Create category DTO
export interface CreateCategoryDto {
  name: string;
  color?: string;
  position?: number;
}

// Update category DTO
export interface UpdateCategoryDto {
  name?: string;
  color?: string;
  position?: number;
}

// Project entity - groups related tasks for focus cycle organization
export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  color: string | null;
  icon: string | null;
  position: number;
  tasks: Pick<Task, 'id' | 'name' | 'color' | 'icon'>[];
  createdAt: string;
  updatedAt: string;
  _count?: {
    tasks: number;
  };
}

// Create project DTO
export interface CreateProjectDto {
  name: string;
  color?: string;
  icon?: string;
  position?: number;
  taskIds?: string[];
}

// Update project DTO
export interface UpdateProjectDto {
  name?: string;
  color?: string;
  icon?: string;
  position?: number;
  taskIds?: string[];
}

// Merge tasks DTO
export interface MergeTasksDto {
  sourceIds: string[];
  targetId: string;
}

// Reorder tasks DTO
export interface ReorderTasksDto {
  taskIds: string[];
}

// WorkSession entity from backend
export interface WorkSession {
  id: string;
  userId: string;
  workspaceId: string;
  taskId: string;
  task: Task; // Populated relation
  date: string; // ISO date string
  minutes: number;
  createdAt: string;
  updatedAt: string;
}

// User configuration
export interface UserConfig {
  id: string;
  userId: string;
  targetHours: number;
  weekStartDay: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  createdAt: string;
  updatedAt: string;
}

// Weekly goal
export interface WeeklyGoal {
  id: string;
  userId: string;
  workspaceId: string;
  weekStart: string; // ISO date string (YYYY-MM-DD)
  targetHours: number;
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
}

// Update weekly goal DTO
export interface UpdateWeeklyGoalDto {
  targetHours?: number;
}

// Auth response after login
export interface AuthResponse {
  token: string;
  user: User;
}

// API Error response
export interface ApiError {
  message: string;
  statusCode?: number;
  error?: string;
}

// Create work session DTO
export interface CreateWorkSessionDto {
  workspaceId: string;
  date: string;
  taskId: string;
  minutes: number;
}

// Update work session DTO
export interface UpdateWorkSessionDto {
  date?: string;
  taskId?: string;
  minutes?: number;
}

// Update config DTO
export interface UpdateConfigDto {
  targetHours?: number;
  weekStartDay?: number; // 0=Dom, 1=Seg
}

// Generic API response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// Create workspace DTO
export interface CreateWorkspaceDto {
  name: string;
  color?: string;
}

// Update workspace DTO
export interface UpdateWorkspaceDto {
  name?: string;
  color?: string;
}

// Focus Cycle Item
export interface FocusCycleItem {
  id: string;
  cycleId: string;
  taskId: string | null;
  projectId: string | null;
  task: Task | null; // Populated relation
  project: Project | null; // Populated relation
  targetMinutes: number;
  position: number;
}

// Focus Cycle
export interface FocusCycle {
  id: string;
  workspaceId: string;
  name: string | null;
  isActive: boolean;
  currentItemIndex: number;
  items: FocusCycleItem[];
  createdAt: string;
  updatedAt: string;
}

// Cycle item progress
export interface CycleItemProgress {
  subject: string;
  targetMinutes: number;
  accumulatedMinutes: number;
  isComplete: boolean;
  position: number;
  isProject: boolean;
  projectId?: string;
  taskId?: string;
}

// Cycle Suggestion response
export interface CycleSuggestion {
  hasCycle: boolean;
  isEmpty: boolean;
  suggestion: {
    currentSubject: string;
    currentTargetMinutes: number;
    currentAccumulatedMinutes: number;
    remainingMinutes: number;
    isCurrentComplete: boolean;
    nextSubject: string;
    nextTargetMinutes: number;
    currentPosition: number;
    totalItems: number;
    allItemsProgress: CycleItemProgress[];
    isCycleComplete: boolean;
    currentIsProject: boolean;
    currentProjectId?: string;
    currentTaskId?: string;
  } | null;
}

// Cycle statistics
export interface CycleStatistics {
  totalTargetMinutes: number;
  totalAccumulatedMinutes: number;
  completedItemsCount: number;
  totalItemsCount: number;
  overallPercentage: number;
  averagePerItem: number;
}

// Cycle history entry
export interface CycleHistoryEntry {
  id: string;
  type: 'advance' | 'completion';
  fromSubject?: string;
  toSubject?: string;
  minutesSpent?: number;
  cycleName?: string;
  totalTargetMinutes?: number;
  totalSpentMinutes?: number;
  itemsCount?: number;
  timestamp: string;
}

// Cycle history response
export interface CycleHistory {
  entries: CycleHistoryEntry[];
  totalAdvances: number;
  totalCompletions: number;
}

// Create cycle item DTO
export interface CreateCycleItemDto {
  taskId?: string;
  projectId?: string;
  targetMinutes: number;
}

// Create focus cycle DTO
export interface CreateFocusCycleDto {
  name: string;
  items: CreateCycleItemDto[];
  activateOnCreate?: boolean;
}

// Update focus cycle DTO
export interface UpdateFocusCycleDto {
  name?: string;
  isActive?: boolean;
  currentItemIndex?: number;
  items?: CreateCycleItemDto[];
}

