-- =====================================================
-- YatteMi! Database Migration
-- Run this in Supabase SQL Editor
-- =====================================================

-- 既存テーブルのクリーンアップ（開発環境のみ）
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ENUMの削除と再作成
DROP TYPE IF EXISTS post_type CASCADE;
DROP TYPE IF EXISTS post_status CASCADE;
DROP TYPE IF EXISTS application_status CASCADE;
DROP TYPE IF EXISTS match_status CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;

-- =====================================================
-- ENUM Types
-- =====================================================

CREATE TYPE post_type AS ENUM ('teach', 'learn');
CREATE TYPE post_status AS ENUM ('open', 'closed', 'completed', 'cancelled');
CREATE TYPE application_status AS ENUM ('pending', 'accepted', 'rejected', 'cancelled');
CREATE TYPE match_status AS ENUM ('active', 'completed', 'cancelled');
CREATE TYPE notification_type AS ENUM (
  'new_application',
  'application_accepted',
  'application_rejected',
  'match_completed',
  'new_review',
  'system'
);

-- =====================================================
-- Tables
-- =====================================================

-- Profiles（ユーザープロフィール）
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  university TEXT,
  department TEXT,
  grade INTEGER CHECK (grade >= 1 AND grade <= 6),
  twitter_url TEXT,
  instagram_url TEXT,
  website_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories（カテゴリマスタ）
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts（投稿）
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) >= 3 AND char_length(title) <= 100),
  description TEXT NOT NULL CHECK (char_length(description) >= 10 AND char_length(description) <= 2000),
  type post_type NOT NULL,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  status post_status DEFAULT 'open',
  max_applicants INTEGER DEFAULT 1 CHECK (max_applicants >= 1 AND max_applicants <= 10),
  location TEXT,
  is_online BOOLEAN DEFAULT TRUE,
  preferred_schedule TEXT,
  tags TEXT[] DEFAULT '{}',
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Applications（応募）
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT CHECK (char_length(message) <= 500),
  status application_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, applicant_id)
);

-- Matches（マッチング成立）
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  status match_status DEFAULT 'active',
  matched_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT
);

-- Reviews（レビュー）
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT CHECK (char_length(comment) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, reviewer_id)
);

-- Notifications（通知）
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Indexes
-- =====================================================

-- Profiles
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_university ON profiles(university);

-- Posts
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_type ON posts(type);
CREATE INDEX idx_posts_category_id ON posts(category_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_tags ON posts USING GIN(tags);

-- Applications
CREATE INDEX idx_applications_post_id ON applications(post_id);
CREATE INDEX idx_applications_applicant_id ON applications(applicant_id);
CREATE INDEX idx_applications_status ON applications(status);

-- Matches
CREATE INDEX idx_matches_application_id ON matches(application_id);
CREATE INDEX idx_matches_status ON matches(status);

-- Reviews
CREATE INDEX idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- =====================================================
-- Initial Data
-- =====================================================

INSERT INTO categories (name, slug, icon, color, sort_order) VALUES
  ('プログラミング', 'programming', 'Code', '#3B82F6', 1),
  ('デザイン', 'design', 'Palette', '#EC4899', 2),
  ('音楽', 'music', 'Music', '#8B5CF6', 3),
  ('スポーツ', 'sports', 'Trophy', '#10B981', 4),
  ('語学', 'language', 'Globe', '#F59E0B', 5),
  ('料理', 'cooking', 'UtensilsCrossed', '#EF4444', 6),
  ('写真・動画', 'media', 'Camera', '#6366F1', 7),
  ('ビジネス', 'business', 'Briefcase', '#14B8A6', 8),
  ('アート', 'art', 'Brush', '#F97316', 9),
  ('ゲーム', 'gaming', 'Gamepad2', '#A855F7', 10),
  ('その他', 'other', 'Sparkles', '#6B7280', 99);
