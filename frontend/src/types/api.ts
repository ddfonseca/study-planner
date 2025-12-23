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

// Session entity from backend
export interface Session {
  id: string;
  userId: string;
  workspaceId: string;
  date: string; // ISO date string
  subject: string;
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

// Create session DTO
export interface CreateSessionDto {
  workspaceId: string;
  date: string;
  subject: string;
  minutes: number;
}

// Update session DTO
export interface UpdateSessionDto {
  date?: string;
  subject?: string;
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

// Study Cycle Item
export interface StudyCycleItem {
  id: string;
  cycleId: string;
  subject: string;
  targetMinutes: number;
  position: number;
}

// Study Cycle
export interface StudyCycle {
  id: string;
  workspaceId: string;
  name: string | null;
  isActive: boolean;
  currentItemIndex: number;
  items: StudyCycleItem[];
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
}

// Cycle Suggestion response
export interface CycleSuggestion {
  hasCycle: boolean;
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
  subject: string;
  targetMinutes: number;
}

// Create study cycle DTO
export interface CreateStudyCycleDto {
  name: string;
  items: CreateCycleItemDto[];
  activateOnCreate?: boolean;
}

// Update study cycle DTO
export interface UpdateStudyCycleDto {
  name?: string;
  isActive?: boolean;
  currentItemIndex?: number;
  items?: CreateCycleItemDto[];
}
