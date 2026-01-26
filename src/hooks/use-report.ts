'use client';

import { useState } from 'react';
import { getClient } from '@/lib/supabase/client';
import { useAuth } from './use-auth';

export type ReportType = 'question' | 'post' | 'user' | 'message';
export type ReportReason = 'spam' | 'inappropriate' | 'harassment' | 'dating' | 'scam' | 'personal_info' | 'impersonation' | 'other';

interface ReportData {
  type: ReportType;
  targetId: string;
  reason: ReportReason;
  detail?: string;
}

export function useReport() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitReport = async (data: ReportData): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'ログインが必要です' };
    }

    setIsSubmitting(true);

    try {
      const supabase = getClient();
      
      const { error } = await (supabase as any)
        .from('reports')
        .insert({
          reporter_id: user.id,
          type: data.type,
          target_id: data.targetId,
          reason: data.reason,
          detail: data.detail || null,
        });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Report error:', error);
      return { success: false, error: error.message || '通報に失敗しました' };
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submitReport, isSubmitting };
}