'use client';

import { useState } from 'react';
import { getClient } from '@/lib/supabase/client';
import { useAuth } from './use-auth';

// チャレンジ（マッチング）のステータス更新
export function useChallengeActions() {
  const [isUpdating, setIsUpdating] = useState(false);
  const { user } = useAuth();
  const supabase = getClient();

  // 完了報告を送信
  const reportComplete = async (matchId: string) => {
    if (!user) throw new Error('認証が必要です');

    setIsUpdating(true);
    try {
      const { error } = await (supabase as any)
        .from('matches')
        .update({
          completed_by: user.id,
        })
        .eq('id', matchId);

      if (error) throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  // 完了を確認（相手の完了報告を承認）
  const confirmComplete = async (matchId: string) => {
    if (!user) throw new Error('認証が必要です');

    setIsUpdating(true);
    try {
      const { error } = await (supabase as any)
        .from('matches')
        .update({
          confirmed_by: user.id,
          confirmed_at: new Date().toISOString(),
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', matchId);

      if (error) throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  // キャンセル
  const cancelChallenge = async (matchId: string, reason?: string) => {
    if (!user) throw new Error('認証が必要です');

    setIsUpdating(true);
    try {
      const { error } = await (supabase as any)
        .from('matches')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancel_reason: reason || null,
        })
        .eq('id', matchId);

      if (error) throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  return { reportComplete, confirmComplete, cancelChallenge, isUpdating };
}
