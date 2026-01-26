'use client';

import { useState, useEffect, useRef } from 'react';
import { getClient } from '@/lib/supabase/client';

export interface Tag {
  id: number;
  name: string;
  category: string | null;
  sort_order: number;
  usage_count: number;
  is_official: boolean;
}

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabaseRef = useRef(getClient());

  useEffect(() => {
    const fetchTags = async () => {
      const supabase = supabaseRef.current;

      const { data, error } = await (supabase as any)
        .from('tags')
        .select('*')
        .eq('is_official', true)
        .order('sort_order', { ascending: true });

      if (!error && data) {
        setTags(data);
      }
      setIsLoading(false);
    };

    fetchTags();
  }, []);

  // カテゴリ別に分類
  const tagsByCategory = tags.reduce((acc, tag) => {
    const category = tag.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(tag);
    return acc;
  }, {} as Record<string, Tag[]>);

  // 人気順（usage_count順）
  const popularTags = [...tags].sort((a, b) => b.usage_count - a.usage_count).slice(0, 10);

  return { tags, tagsByCategory, popularTags, isLoading };
}