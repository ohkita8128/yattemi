'use client';

import { useEffect, useCallback } from 'react';
import { getClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores';
import { ROUTES } from '@/lib/constants';
import type { Profile } from '@/types';

// ✅ useAuth の外に置く（モジュール全体で共有）
let isFetching = false;

export function useAuth() {
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

      // 既にフェッチ中ならスキップ
      if (isFetching) {
        return null;
      }

      const currentProfile = useAuthStore.getState().profile;
      if (currentProfile && currentProfile.id === userId) {
        return currentProfile;
      }

      console.log('FETCH: Starting...');
      isFetching = true;  // ← ref じゃなく直接代入

      try {
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

        if (data && data.length > 0) {
          return data[0] as Profile;
        }

        return null;
      } catch (err) {
        console.error('Profile fetch exception:', err);
        return null;
      } finally {
        isFetching = false;  // ← 完了時にリセット
      }
    },
    []
  );

  // 初期化処理
  useEffect(() => {
    let isMounted = true;

    // 既に初期化済みならスキップ
    if (useAuthStore.getState().isInitialized) return;

    // Auth状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email ?? '',
        });

        // すでにプロフィールがあれば再取得しない
        const currentProfile = useAuthStore.getState().profile;
        if (!currentProfile) {
          const fetchedProfile = await fetchProfile(session.user.id);
          if (isMounted) {
            setProfile(fetchedProfile);
          }
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
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!isMounted) return;

      // まだ初期化されてなければ、セッションなしとして処理
      if (!useAuthStore.getState().isInitialized) {
        setLoading(false);
        setInitialized(true);
      }
    };

    checkInitialSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, setUser, setProfile, setLoading, setInitialized, reset, fetchProfile]);
  //  ↑ isInitialized を削除！

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
  const signInWithOAuth = async (provider: 'google') => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider,
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

    window.location.href = ROUTES.HOME;
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