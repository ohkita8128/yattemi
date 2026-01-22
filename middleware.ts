import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

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
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // 認証不要ページ
  const publicPaths = ['/', '/login', '/register', '/explore', '/auth/callback'];
  const isPublicPath = publicPaths.some(path => pathname === path) ||
    pathname.startsWith('/posts/') && !pathname.includes('/edit') && !pathname.includes('/new') ||
    pathname.startsWith('/users/');

  // 認証が必要なページにアクセスしようとしている未ログインユーザー
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // ログイン済みユーザーがログイン/登録ページにアクセス
  if (user && (pathname === '/login' || pathname === '/register')) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // オンボーディング未完了チェック（ログイン済み & 認証必要ページ & オンボーディング以外）
  if (user && !isPublicPath && pathname !== '/onboarding') {
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single();

    // オンボーディング未完了ならリダイレクト
    if (profile && profile.onboarding_completed === false) {
      const url = request.nextUrl.clone();
      url.pathname = '/onboarding';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};