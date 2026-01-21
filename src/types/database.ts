// =====================================================
// Database Types (Supabase Generated Style)
// =====================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Enum Types
export type PostType = 'teach' | 'learn';
export type PostStatus = 'open' | 'closed' | 'completed' | 'cancelled';
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';
export type MatchStatus = 'active' | 'completed' | 'cancelled';
export type NotificationType =
  | 'new_application'
  | 'application_accepted'
  | 'application_rejected'
  | 'match_completed'
  | 'new_review'
  | 'system';

// =====================================================
// Table Types
// =====================================================

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  university: string | null;
  department: string | null;
  grade: number | null;
  twitter_url: string | null;
  instagram_url: string | null;
  website_url: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
  color: string;
  sort_order: number;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  title: string;
  description: string;
  type: PostType;
  category_id: number;
  status: PostStatus;
  max_applicants: number;
  location: string | null;
  is_online: boolean;
  preferred_schedule: string | null;
  tags: string[];
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  post_id: string;
  applicant_id: string;
  message: string | null;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  application_id: string;
  status: MatchStatus;
  matched_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
}

export interface Review {
  id: string;
  match_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

// =====================================================
// Extended Types (with relations)
// =====================================================

export interface PostWithRelations extends Post {
  profile: Profile;
  category: Category;
  applications?: Application[];
  _count?: {
    applications: number;
  };
}

export interface ApplicationWithRelations extends Application {
  post: PostWithRelations;
  applicant: Profile;
}

export interface MatchWithRelations extends Match {
  application: ApplicationWithRelations;
}

export interface ReviewWithRelations extends Review {
  reviewer: Profile;
  reviewee: Profile;
  match: Match;
}

// =====================================================
// Insert/Update Types
// =====================================================

export type ProfileInsert = Omit<Profile, 'created_at' | 'updated_at'>;
export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;

export type PostInsert = Omit<Post, 'id' | 'view_count' | 'created_at' | 'updated_at'>;
export type PostUpdate = Partial<Omit<Post, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type ApplicationInsert = Pick<Application, 'post_id' | 'applicant_id' | 'message'>;
export type ApplicationUpdate = Pick<Application, 'status'>;

// =====================================================
// Database Type (for Supabase client)
// =====================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, 'id' | 'created_at'>;
        Update: Partial<Omit<Category, 'id' | 'created_at'>>;
      };
      posts: {
        Row: Post;
        Insert: PostInsert;
        Update: PostUpdate;
      };
      applications: {
        Row: Application;
        Insert: ApplicationInsert;
        Update: ApplicationUpdate;
      };
      matches: {
        Row: Match;
        Insert: Pick<Match, 'application_id'>;
        Update: Partial<Pick<Match, 'status' | 'completed_at' | 'cancelled_at' | 'cancel_reason'>>;
      };
      reviews: {
        Row: Review;
        Insert: Omit<Review, 'id' | 'created_at'>;
        Update: never;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at'>;
        Update: Pick<Notification, 'is_read'>;
      };
    };
    Enums: {
      post_type: PostType;
      post_status: PostStatus;
      application_status: ApplicationStatus;
      match_status: MatchStatus;
      notification_type: NotificationType;
    };
    Functions: {
      increment_view_count: {
        Args: { p_post_id: string };
        Returns: void;
      };
      get_user_stats: {
        Args: { p_user_id: string };
        Returns: {
          posts_count: number;
          teach_count: number;
          learn_count: number;
          matches_count: number;
          avg_rating: number | null;
          review_count: number;
        };
      };
    };
  };
}
