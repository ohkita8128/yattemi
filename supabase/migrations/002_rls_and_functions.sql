-- =====================================================
-- YatteMi! Database Migration - Part 2
-- RLS Policies and Functions
-- =====================================================

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- Profiles Policies
-- -----------------------------------------------------

CREATE POLICY "profiles_select_all"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- -----------------------------------------------------
-- Categories Policies
-- -----------------------------------------------------

CREATE POLICY "categories_select_all"
  ON categories FOR SELECT
  USING (true);

-- -----------------------------------------------------
-- Posts Policies
-- -----------------------------------------------------

CREATE POLICY "posts_select_public"
  ON posts FOR SELECT
  USING (status != 'cancelled' OR auth.uid() = user_id);

CREATE POLICY "posts_insert_authenticated"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts_update_own"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "posts_delete_own"
  ON posts FOR DELETE
  USING (auth.uid() = user_id);

-- -----------------------------------------------------
-- Applications Policies
-- -----------------------------------------------------

-- 応募は投稿者と応募者のみ閲覧可能
CREATE POLICY "applications_select_involved"
  ON applications FOR SELECT
  USING (
    auth.uid() = applicant_id OR 
    auth.uid() IN (SELECT user_id FROM posts WHERE id = post_id)
  );

-- 認証ユーザーは応募可能（自分の投稿以外）
CREATE POLICY "applications_insert_authenticated"
  ON applications FOR INSERT
  WITH CHECK (
    auth.uid() = applicant_id AND
    auth.uid() NOT IN (SELECT user_id FROM posts WHERE id = post_id)
  );

-- 応募者は自分の応募をキャンセル可能
CREATE POLICY "applications_update_applicant"
  ON applications FOR UPDATE
  USING (auth.uid() = applicant_id)
  WITH CHECK (status = 'cancelled');

-- 投稿者は応募を承認/拒否可能
CREATE POLICY "applications_update_owner"
  ON applications FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM posts WHERE id = post_id));

-- -----------------------------------------------------
-- Matches Policies
-- -----------------------------------------------------

-- マッチは関係者のみ閲覧可能
CREATE POLICY "matches_select_involved"
  ON matches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN posts p ON a.post_id = p.id
      WHERE a.id = application_id
      AND (a.applicant_id = auth.uid() OR p.user_id = auth.uid())
    )
  );

-- マッチの更新は関係者のみ
CREATE POLICY "matches_update_involved"
  ON matches FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN posts p ON a.post_id = p.id
      WHERE a.id = application_id
      AND (a.applicant_id = auth.uid() OR p.user_id = auth.uid())
    )
  );

-- -----------------------------------------------------
-- Reviews Policies
-- -----------------------------------------------------

-- レビューは誰でも閲覧可能
CREATE POLICY "reviews_select_all"
  ON reviews FOR SELECT
  USING (true);

-- レビューはマッチ関係者のみ作成可能
CREATE POLICY "reviews_insert_involved"
  ON reviews FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id AND
    EXISTS (
      SELECT 1 FROM matches m
      JOIN applications a ON m.application_id = a.id
      JOIN posts p ON a.post_id = p.id
      WHERE m.id = match_id
      AND m.status = 'completed'
      AND (a.applicant_id = auth.uid() OR p.user_id = auth.uid())
    )
  );

-- -----------------------------------------------------
-- Notifications Policies
-- -----------------------------------------------------

CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- Functions and Triggers
-- =====================================================

-- -----------------------------------------------------
-- Updated At Trigger
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- -----------------------------------------------------
-- Handle New User Registration
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_username TEXT;
  base_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- ユーザー名のベースを決定
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    SPLIT_PART(NEW.email, '@', 1)
  );
  
  -- ユニークなユーザー名を生成
  new_username := base_username;
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = new_username) LOOP
    counter := counter + 1;
    new_username := base_username || counter::TEXT;
  END LOOP;
  
  INSERT INTO profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    new_username,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      new_username
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 既存のトリガーがあれば削除
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- -----------------------------------------------------
-- Handle Application Status Change
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION handle_application_status_change()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
  post_title TEXT;
  applicant_name TEXT;
BEGIN
  -- 投稿情報を取得
  SELECT p.user_id, p.title INTO post_owner_id, post_title
  FROM posts p WHERE p.id = NEW.post_id;
  
  -- 応募者名を取得
  SELECT display_name INTO applicant_name
  FROM profiles WHERE id = NEW.applicant_id;
  
  -- 承認された場合
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- マッチを作成
    INSERT INTO matches (application_id)
    VALUES (NEW.id);
    
    -- 応募者に通知
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (
      NEW.applicant_id,
      'application_accepted',
      '🎉 応募が承認されました！',
      '「' || post_title || '」への応募が承認されました。',
      '/matches'
    );
  END IF;
  
  -- 拒否された場合
  IF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (
      NEW.applicant_id,
      'application_rejected',
      '応募結果のお知らせ',
      '「' || post_title || '」への応募は承認されませんでした。',
      '/posts'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_application_status_change
  AFTER UPDATE ON applications
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION handle_application_status_change();

-- -----------------------------------------------------
-- Handle New Application
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION handle_new_application()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
  post_title TEXT;
  applicant_name TEXT;
BEGIN
  -- 投稿情報を取得
  SELECT p.user_id, p.title INTO post_owner_id, post_title
  FROM posts p WHERE p.id = NEW.post_id;
  
  -- 応募者名を取得
  SELECT display_name INTO applicant_name
  FROM profiles WHERE id = NEW.applicant_id;
  
  -- 投稿者に通知
  INSERT INTO notifications (user_id, type, title, message, link)
  VALUES (
    post_owner_id,
    'new_application',
    '📩 新しい応募があります！',
    applicant_name || 'さんが「' || post_title || '」に応募しました。',
    '/applications'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_application
  AFTER INSERT ON applications
  FOR EACH ROW EXECUTE FUNCTION handle_new_application();

-- -----------------------------------------------------
-- Increment View Count
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION increment_view_count(p_post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts SET view_count = view_count + 1 WHERE id = p_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------
-- Get User Stats
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION get_user_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'posts_count', (SELECT COUNT(*) FROM posts WHERE user_id = p_user_id AND status != 'cancelled'),
    'teach_count', (SELECT COUNT(*) FROM posts WHERE user_id = p_user_id AND type = 'teach' AND status != 'cancelled'),
    'learn_count', (SELECT COUNT(*) FROM posts WHERE user_id = p_user_id AND type = 'learn' AND status != 'cancelled'),
    'matches_count', (
      SELECT COUNT(*) FROM matches m
      JOIN applications a ON m.application_id = a.id
      JOIN posts p ON a.post_id = p.id
      WHERE (a.applicant_id = p_user_id OR p.user_id = p_user_id)
      AND m.status IN ('active', 'completed')
    ),
    'avg_rating', (
      SELECT ROUND(AVG(rating)::numeric, 1)
      FROM reviews WHERE reviewee_id = p_user_id
    ),
    'review_count', (SELECT COUNT(*) FROM reviews WHERE reviewee_id = p_user_id)
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Storage Bucket (Run in Dashboard or use Supabase CLI)
-- =====================================================
-- Note: Run this in Supabase Dashboard > Storage
-- 
-- 1. Create bucket 'avatars' with public access
-- 2. Add policy: Allow authenticated users to upload to own folder
--    - Policy name: "Avatar upload"
--    - Allowed operation: INSERT
--    - Policy definition: (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])
-- 3. Add policy: "Public avatar access"
--    - Allowed operation: SELECT
--    - Policy definition: (bucket_id = 'avatars')
