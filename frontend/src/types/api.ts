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

// Session entity from backend
export interface Session {
  id: string;
  userId: string;
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
