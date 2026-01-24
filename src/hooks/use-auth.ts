'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores';
import { ROUTES } from '@/lib/constants';
import type { Profile } from '@/types';

export function useAuth() {
  const router = useRouter();
  const {
    user,
    profile,
    isLoading,
    isInitialized,
    setUser,
    setProfile,
    setLoading,
    setInitialized,
    reset,
  } = useAuthStore();

  const supabase = getClient();

  // プロフィールを取得
  const fetchProfile = useCallback(
    async (userId: string) => {
      // console.log('Fetching profile for:', userId);
      
      try {
        // Supabase クライアントの代わりに直接 fetch を使う
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`,
          {
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            },
          }
        );
        
        const data = await response.json();
        // console.log('Profile result:', data);
        
        if (data && data.length > 0) {
          return data[0] as Profile;
        }
        
        return null;
      } catch (err) {
        console.error('Profile fetch exception:', err);
        return null;
      }
    },
    []
  );

  // 初期化処理
  useEffect(() => {
    let isMounted = true;

    // Auth状態の変更を監視（これをメインにする）
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // console.log('Auth event:', event, 'Session:', !!session);
      
      if (!isMounted) return;

      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email ?? '',
        });
        
        const profile = await fetchProfile(session.user.id);
        if (isMounted) {
          setProfile(profile);
        }
      } else if (event === 'SIGNED_OUT') {
        reset();
      }
      
      if (isMounted) {
        setLoading(false);
        setInitialized(true);
      }
    });

    // 初期状態のチェック（フォールバック）
    const checkInitialSession = async () => {
      // 少し待ってからチェック（onAuthStateChangeが先に発火する可能性）
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!isMounted) return;
      
      // まだ初期化されてなければ、セッションなしとして処理
      if (!isInitialized) {
        console.log('Fallback: No session detected');
        setLoading(false);
        setInitialized(true);
      }
    };

    checkInitialSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, setUser, setProfile, setLoading, setInitialized, reset, fetchProfile, isInitialized]);

  // サインイン
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      throw error;
    }

    return data;
  };

  // サインアップ
  const signUp = async (
    email: string,
    password: string,
    metadata: { username: string; display_name: string }
  ) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      setLoading(false);
      throw error;
    }

    return data;
  };

  // OAuth サインイン
  const signInWithOAuth = async (provider: 'google' | 'github') => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      throw error;
    }

    return data;
  };

  // サインアウト
  const signOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);

    if (error) {
      throw error;
    }

    router.push(ROUTES.HOME);
  };

  // プロフィール更新
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return null;

    const { data, error } = await supabase
    .from('profiles')
      // @ts-ignore
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    setProfile(data as Profile);
    return data;
  };

  return {
    user,
    profile,
    isLoading,
    isInitialized,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signInWithOAuth,
    signOut,
    updateProfile,
    refreshProfile: () => user && fetchProfile(user.id).then(setProfile),
  };
}