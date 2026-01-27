import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Vercel Cronからの呼び出しを認証
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  // 認証チェック（本番環境用）
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Service Role Key を使用（RLSをバイパス）
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const now = new Date().toISOString();

    // 1. 期限切れの投稿を取得
    const { data: expiredPosts, error: fetchError } = await supabaseAdmin
      .from('posts')
      .select('id, user_id, title')
      .eq('status', 'open')
      .lt('deadline_at', now);

    if (fetchError) throw fetchError;

    if (!expiredPosts || expiredPosts.length === 0) {
      return NextResponse.json({ message: 'No expired posts', count: 0 });
    }

    // 2. ステータスを closed に更新
    const postIds = expiredPosts.map(p => p.id);
    const { error: updateError } = await supabaseAdmin
      .from('posts')
      .update({ 
        status: 'closed',
        closed_reason: 'deadline'
      })
      .in('id', postIds);

    if (updateError) throw updateError;

    // 3. 投稿者に通知を作成
    const notifications = expiredPosts.map(post => ({
      user_id: post.user_id,
      type: 'post_closed',
      title: '募集が締め切られました',
      message: `「${post.title}」の募集期限が終了しました`,
      link: `/posts/${post.id}`,
    }));

    const { error: notifyError } = await supabaseAdmin
      .from('notifications')
      .insert(notifications);

    if (notifyError) {
      console.error('Notification error:', notifyError);
      // 通知エラーは無視して続行
    }

    return NextResponse.json({ 
      message: 'Posts closed successfully',
      count: expiredPosts.length,
      postIds 
    });

  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}