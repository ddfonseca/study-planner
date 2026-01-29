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

// Subject entity - normalized subject per workspace
export interface Subject {
  id: string;
  workspaceId: string;
  name: string;
  color: string | null;
  icon: string | null;
  position: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Create subject DTO
export interface CreateSubjectDto {
  name: string;
  color?: string;
  icon?: string;
  position?: number;
}

// Update subject DTO
export interface UpdateSubjectDto {
  name?: string;
  color?: string;
  icon?: string;
  position?: number;
}

// Merge subjects DTO
export interface MergeSubjectsDto {
  sourceIds: string[];
  targetId: string;
}

// Reorder subjects DTO
export interface ReorderSubjectsDto {
  subjectIds: string[];
}

// Session entity from backend
export interface Session {
  id: string;
  userId: string;
  workspaceId: string;
  subjectId: string;
  subject: Subject; // Populated relation
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

// Create session DTO
export interface CreateSessionDto {
  workspaceId: string;
  date: string;
  subjectId: string;
  minutes: number;
}

// Update session DTO
export interface UpdateSessionDto {
  date?: string;
  subjectId?: string;
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
  subjectId: string;
  subject: Subject; // Populated relation
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
  subjectId: string;
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

// =====================================================
// STUDY ALLOCATION
// =====================================================

// Exam Profile - user's exam/contest profile
export interface ExamProfile {
  id: string;
  workspaceId: string;
  name: string;
  examDate: string | null;
  weeklyHours: number;
  isActive: boolean;
  subjects: SubjectProfile[];
  createdAt: string;
  updatedAt: string;
}

// Subject Profile - subject with metadata
export interface SubjectProfile {
  id: string;
  examProfileId: string;
  subject: string;
  weight: number;
  currentLevel: number;
  goalLevel: number;
  position: number;
  createdAt: string;
  updatedAt: string;
}

// Exam Template - pre-populated templates
export interface ExamTemplate {
  id: string;
  name: string;
  category: string;
  isPublic: boolean;
  items: ExamTemplateItem[];
  createdAt: string;
}

// Exam Template Item
export interface ExamTemplateItem {
  id: string;
  templateId: string;
  subject: string;
  weight: number;
  medianLevel: number;
  position: number;
}

// Allocation result
export interface AllocationResult {
  subject: string;
  totalHours: number;
  hoursPerWeek: number;
  gap: number;
  percentage: number;
}

// Allocation response with metadata
export interface AllocationResponse {
  results: AllocationResult[];
  metadata: {
    weeksUntilExam: number;
    totalAvailableHours: number;
    weeklyHours: number;
    examDate: string;
  };
}

// Create exam profile DTO
export interface CreateExamProfileDto {
  workspaceId: string;
  name: string;
  examDate: string;
  weeklyHours: number;
  subjects: CreateSubjectProfileDto[];
}

// Create subject profile DTO
export interface CreateSubjectProfileDto {
  subject: string;
  weight: number;
  currentLevel: number;
  goalLevel: number;
  position: number;
}

// Update exam profile DTO
export interface UpdateExamProfileDto {
  name?: string;
  examDate?: string | null;
  weeklyHours?: number;
  isActive?: boolean;
  subjects?: CreateSubjectProfileDto[];
}
