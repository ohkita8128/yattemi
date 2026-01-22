'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Plus } from 'lucide-react';
import { getClient } from '@/lib/supabase/client';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  placeholder?: string;
}

// よく使われるタグのサジェスト
const SUGGESTED_TAGS: Record<string, string[]> = {
  programming: ['Python', 'JavaScript', 'React', 'Web開発', 'アプリ開発', '初心者歓迎', 'ペアプロ'],
  design: ['Figma', 'UI/UX', 'ロゴ', 'イラスト', 'Webデザイン', 'Canva'],
  music: ['ギター', 'ピアノ', 'DTM', 'ボーカル', 'バンド', '作曲', '初心者OK'],
  sports: ['筋トレ', 'ランニング', 'サッカー', 'バスケ', 'テニス', 'ヨガ', 'ダンス'],
  language: ['英語', 'TOEIC', '英会話', '中国語', '韓国語', '留学', '発音'],
  cooking: ['お菓子', '一人暮らし', '時短', '和食', 'イタリアン', 'ヘルシー'],
  traditional: ['茶道', '華道', '書道', '着付け', '和楽器', '剣道', '空手', '俳句'],
  beauty: ['メイク', 'スキンケア', 'ヘアアレンジ', 'ネイル', '垢抜け'],
  business: ['Excel', 'プレゼン', '資料作成', 'マーケティング', '起業'],
  career: ['ES添削', '面接対策', 'インターン', '業界研究', '自己分析'],
  study: ['レポート', '論文', '数学', '物理', '資格'],
  lifestyle: ['一人暮らし', '節約', '整理整頓', '時間管理', 'メンタル'],
  default: ['初心者歓迎', '経験者向け', 'オンラインOK', '対面希望', '定期的に', '単発OK'],
};

export function TagInput({ 
  value, 
  onChange, 
  maxTags = 5,
  placeholder = 'タグを追加...'
}: TagInputProps) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabaseRef = useRef(getClient());

  // 人気タグを取得
  useEffect(() => {
    const fetchPopularTags = async () => {
      const supabase = supabaseRef.current;
      const { data } = await (supabase as any)
        .from('posts')
        .select('tags')
        .not('tags', 'is', null)
        .limit(100);

      if (data) {
        const tagCounts: Record<string, number> = {};
        data.forEach((post: any) => {
          post.tags?.forEach((tag: string) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        });

        const sorted = Object.entries(tagCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([tag]) => tag);

        setPopularTags(sorted);
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

    const allTags = [
      ...(SUGGESTED_TAGS.default || []),
      ...Object.values(SUGGESTED_TAGS).flat(),
      ...popularTags,
    ];

    const uniqueTags = Array.from(new Set(allTags));
    const filtered = uniqueTags
      .filter(tag => 
        tag.toLowerCase().includes(input.toLowerCase()) &&
        !value.includes(tag)
      )
      .slice(0, 5);

    setSuggestions(filtered);
  }, [input, value, popularTags]);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !value.includes(trimmed) && value.length < maxTags) {
      onChange([...value, trimmed]);
      setInput('');
      setShowSuggestions(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0) {
        addTag(suggestions[0]!);
      } else if (input) {
        addTag(input);
      }
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value[value.length - 1]!);
    }
  };

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
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10">
                {suggestions.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onMouseDown={() => addTag(tag)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500">
        {value.length}/{maxTags}個のタグ（Enterで追加）
      </p>

      {/* おすすめタグ */}
      {value.length < maxTags && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-gray-500 py-1">おすすめ:</span>
          {(SUGGESTED_TAGS.default || []).filter(tag => !value.includes(tag))
            .slice(0, 4)
            .map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full text-xs transition-colors"
              >
                <Plus className="h-3 w-3" />
                {tag}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

// カテゴリに応じたタグサジェストを取得
export function getTagSuggestionsForCategory(categorySlug: string): string[] {
  return SUGGESTED_TAGS[categorySlug] || SUGGESTED_TAGS['default'] || [];
}
