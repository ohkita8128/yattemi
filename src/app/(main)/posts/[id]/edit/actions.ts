'use server';

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function updatePost(postId: string, userId: string, data: any) {
  // 所有者確認
  const { data: post } = await supabase
    .from('posts')
    .select('user_id')
    .eq('id', postId)
    .single();
  
  if (!post || post.user_id !== userId) {
    return { error: '権限がありません' };
  }

  const { error } = await supabase
    .from('posts')
    .update(data)
    .eq('id', postId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}