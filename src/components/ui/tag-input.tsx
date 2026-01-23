'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Plus, Star } from 'lucide-react';
import { getClient } from '@/lib/supabase/client';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  placeholder?: string;
}

interface TagData {
  id: number;
  name: string;
  usage_count: number;
  is_official: boolean;
}

export function TagInput({
  value,
  onChange,
  maxTags = 5,
  placeholder = 'タグを追加...'
}: TagInputProps) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<TagData[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [popularTags, setPopularTags] = useState<TagData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabaseRef = useRef(getClient());

  // 人気タグを取得
  useEffect(() => {
    const fetchPopularTags = async () => {
      const supabase = supabaseRef.current;
      const { data } = await (supabase as any)
        .from('tags')
        .select('*')
        .order('usage_count', { ascending: false })
        .limit(20);

      if (data) {
        setPopularTags(data);
      }
    };

    fetchPopularTags();
  }, []);

  // 入力に応じてサジェスト更新
  useEffect(() => {
    if (input.length === 0) {
      setSuggestions([]);
      return;
    }

    const searchTags = async () => {
      setIsLoading(true);
      const supabase = supabaseRef.current;
      
      // DBから検索
      const { data } = await (supabase as any)
        .from('tags')
        .select('*')
        .ilike('name', `%${input}%`)
        .order('is_official', { ascending: false })
        .order('usage_count', { ascending: false })
        .limit(8);

      if (data) {
        // 既に選択済みのタグを除外
        const filtered = data.filter((tag: TagData) => !value.includes(tag.name));
        setSuggestions(filtered);
      }
      setIsLoading(false);
    };

    const debounce = setTimeout(searchTags, 150);
    return () => clearTimeout(debounce);
  }, [input, value]);

  const addTag = async (tagName: string) => {
    const trimmed = tagName.trim();
    if (!trimmed || value.includes(trimmed) || value.length >= maxTags) return;

    onChange([...value, trimmed]);
    setInput('');
    setShowSuggestions(false);

    // DBにタグを追加（存在しなければ）& usage_countを増やす
    const supabase = supabaseRef.current;
    const { data: existing } = await (supabase as any)
      .from('tags')
      .select('id, usage_count')
      .eq('name', trimmed)
      .single();

    if (existing) {
      await (supabase as any)
        .from('tags')
        .update({ usage_count: existing.usage_count + 1 })
        .eq('id', existing.id);
    } else {
      await (supabase as any)
        .from('tags')
        .insert({ name: trimmed, usage_count: 1, is_official: false });
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0) {
        addTag(suggestions[0]!.name);
      } else if (input) {
        addTag(input);
      }
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value[value.length - 1]!);
    }
  };

  // 公式タグを優先表示
  const officialTags = popularTags.filter(t => t.is_official && !value.includes(t.name)).slice(0, 6);
  const trendingTags = popularTags.filter(t => !t.is_official && !value.includes(t.name)).slice(0, 4);

  return (
    <div className="space-y-3">
      {/* タグ表示 + 入力欄 */}
      <div
        className="flex flex-wrap gap-2 p-3 border rounded-xl min-h-[48px] focus-within:ring-2 focus-within:ring-orange-500 bg-white"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm"
          >
            #{tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="hover:bg-orange-200 rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        {value.length < maxTags && (
          <div className="relative flex-1 min-w-[120px]">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onKeyDown={handleKeyDown}
              placeholder={value.length === 0 ? placeholder : ''}
              className="w-full outline-none text-sm py-1"
            />

            {/* サジェスト */}
            {showSuggestions && (suggestions.length > 0 || (input && !isLoading)) && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                {suggestions.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    onMouseDown={() => addTag(tag.name)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      {tag.is_official && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                      #{tag.name}
                    </span>
                    <span className="text-xs text-gray-400">{tag.usage_count}件</span>
                  </button>
                ))}
                {input && !suggestions.some(s => s.name === input) && (
                  <button
                    type="button"
                    onMouseDown={() => addTag(input)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-orange-50 text-orange-600 border-t flex items-center gap-2"
                  >
                    <Plus className="h-3 w-3" />
                    「{input}」を新規作成
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500">
        {value.length}/{maxTags}個のタグ（Enterで追加）
      </p>

      {/* 公式タグ */}
      {value.length < maxTags && officialTags.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-gray-500 py-1 flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
              公式タグ:
            </span>
            {officialTags.map(tag => (
              <button
                key={tag.id}
                type="button"
                onClick={() => addTag(tag.name)}
                className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-full text-xs transition-colors border border-yellow-200"
              >
                <Plus className="h-3 w-3" />
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 人気タグ */}
      {value.length < maxTags && trendingTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-gray-500 py-1">🔥 人気:</span>
          {trendingTags.map(tag => (
            <button
              key={tag.id}
              type="button"
              onClick={() => addTag(tag.name)}
              className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full text-xs transition-colors"
            >
              <Plus className="h-3 w-3" />
              {tag.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
