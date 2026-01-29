import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 🚀 公開ページは認証チェックをスキップ（高速化）
  const publicPaths = ['/', '/login', '/register', '/explore', '/auth/callback'];
  const isPublicPath = publicPaths.some(path => pathname === path) ||
    (pathname.startsWith('/posts/') && !pathname.includes('/edit') && !pathname.includes('/new')) ||
    pathname.startsWith('/users/');

  if (isPublicPath) {
    return NextResponse.next();
  }

  // 認証が必要なページのみSupabaseにアクセス
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // 未ログインユーザーはログインページへ
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // オンボーディング状態を確認
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .single();

  const needsOnboarding = profile && profile.onboarding_completed === false;

  // オンボーディングが必要な場合
  if (needsOnboarding && pathname !== '/onboarding') {
    const url = request.nextUrl.clone();
    url.pathname = '/onboarding';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|sw.js|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};