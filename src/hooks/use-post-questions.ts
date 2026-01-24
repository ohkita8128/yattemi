'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PostQuestion } from '@/types/post-question';

export function usePostQuestions(postId: string) {
  const [questions, setQuestions] = useState<PostQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('post_questions')
      .select(`
        *,
        profiles:user_id (
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('post_id', postId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setQuestions(data || []);
    }
    setIsLoading(false);
  }, [postId, supabase]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // 質問投稿
  const submitQuestion = async (questionText: string, userId: string) => {
    const { data, error } = await supabase
      .from('post_questions')
      .insert({
        post_id: postId,
        user_id: userId,
        question_text: questionText,
      } as any)
      .select(`
        *,
        profiles:user_id (
          username,
          display_name,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;
    setQuestions((prev) => [data, ...prev]);
    return data;
  };

  // 回答投稿
  const submitAnswer = async (questionId: string, answerText: string) => {
    const { data, error } = await (supabase
      .from('post_questions') as any)
      .update({
        answer_text: answerText,
        answered_at: new Date().toISOString(),
      })
      .eq('id', questionId)
      .select(`
        *,
        profiles:user_id (
          username,
          display_name,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? data : q))
    );
    return data;
  };

  const updateAnswer = async (questionId: string, answerText: string) => {
    const { data, error } = await (supabase
      .from('post_questions') as any)
      .update({
        answer_text: answerText,
      })
      .eq('id', questionId)
      .select(`
        *,
        profiles:user_id (
          username,
          display_name,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? data : q))
    );
    return data;
  };

  // 質問削除（論理削除）
  const deleteQuestion = async (questionId: string) => {
    const { error } = await (supabase
      .from('post_questions') as any)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', questionId);

    if (error) throw error;
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
  };

  return {
    questions,
    isLoading,
    error,
    refetch: fetchQuestions,
    submitQuestion,
    submitAnswer,
    updateAnswer,
    deleteQuestion,
  };
}