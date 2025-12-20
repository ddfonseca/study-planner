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
  minHours: number;
  desHours: number;
  createdAt: string;
  updatedAt: string;
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
  minHours: number;
  desHours: number;
}

// Generic API response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
}
