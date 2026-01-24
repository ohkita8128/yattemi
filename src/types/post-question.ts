export interface PostQuestion {
  id: string;
  post_id: string;
  user_id: string;
  question_text: string;
  answer_text: string | null;
  answered_at: string | null;
  created_at: string;
  deleted_at: string | null;
  // JOINで取得
  profiles?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}