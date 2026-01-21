// Re-export all types
export * from './database';

// =====================================================
// API Types
// =====================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PostFilters {
  type?: 'teach' | 'learn';
  categoryId?: number;
  status?: 'open' | 'closed' | 'completed';
  search?: string;
  userId?: string;
}

export interface SortParams {
  sortBy?: 'created_at' | 'view_count';
  sortOrder?: 'asc' | 'desc';
}

// =====================================================
// Auth Types
// =====================================================

export interface AuthUser {
  id: string;
  email: string;
  user_metadata: {
    avatar_url?: string;
    full_name?: string;
    name?: string;
  };
}

// =====================================================
// Form Types
// =====================================================

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  displayName: string;
}

export interface PostFormData {
  title: string;
  description: string;
  type: 'teach' | 'learn';
  categoryId: number;
  maxApplicants: number;
  location?: string;
  isOnline: boolean;
  preferredSchedule?: string;
  tags: string[];
}

export interface ProfileFormData {
  displayName: string;
  bio?: string;
  university?: string;
  department?: string;
  grade?: number;
  twitterUrl?: string;
  instagramUrl?: string;
  websiteUrl?: string;
}

export interface ApplicationFormData {
  message: string;
}

// =====================================================
// UI Types
// =====================================================

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  badge?: number;
}

export interface Tab {
  id: string;
  label: string;
  count?: number;
}

export interface SelectOption {
  value: string | number;
  label: string;
  icon?: string;
  color?: string;
}
