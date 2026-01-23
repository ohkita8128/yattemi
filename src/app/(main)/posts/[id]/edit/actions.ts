'use server';

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function updatePost(postId: string, userId: string, data: any) {
  console.log('=== Server Action updatePost (RPC版) ===');
  
  // 所有者確認
  const { data: post } = await supabase
    .from('posts')
    .select('user_id')
    .eq('id', postId)
    .single();
  
  if (!post || post.user_id !== userId) {
    return { error: '権限がありません' };
  }

  // RPCでUPDATE
  const { error } = await supabase.rpc('update_post', {
    p_post_id: postId,
    p_title: data.title,
    p_description: data.description,
    p_status: data.status,
    p_my_level: data.my_level,
    p_target_level_min: data.target_level_min,
    p_target_level_max: data.target_level_max,
    p_tags: data.tags,
    p_type: data.type,
    p_category_id: data.category_id,
    p_max_applicants: data.max_applicants,
    p_is_online: data.is_online,
    p_location: data.location,
    p_available_days: data.available_days,
    p_available_times: data.available_times,
    p_specific_dates: data.specific_dates
  });

  console.log('rpc error:', error);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}