'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks';
import { getClient } from '@/lib/supabase/client';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PrivacySettingsPage() {
  const { user } = useAuth();
  const [isPublic, setIsPublic] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchSettings = async () => {
      try {
        const supabase = getClient();
        const { data, error } = await supabase
          .from('profiles')
          .select('is_public')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching settings:', error);
        }

        if (data) {
          setIsPublic((data as any).is_public ?? true);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  const handleToggle = async () => {
    const newValue = !isPublic;
    setIsPublic(newValue);

    setIsSaving(true);
    try {
      const supabase = getClient();
      const { error } = await (supabase as any)
        .from('profiles')
        .update({ is_public: newValue })
        .eq('id', user?.id);

      if (error) throw error;
      toast.success(newValue ? 'プロフィールを公開しました' : 'プロフィールを非公開にしました');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error('設定の保存に失敗しました');
      setIsPublic(!newValue); // 元に戻す
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="bg-white rounded-xl border p-6">
          <div className="h-20 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* モバイル用戻るボタン */}
      <Link 
        href="/settings" 
        className="md:hidden flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        設定に戻る
      </Link>

      <div>
        <h2 className="text-xl font-bold">プライバシー設定</h2>
        <p className="text-sm text-gray-500 mt-1">
          プロフィールの公開範囲を設定します
        </p>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        {/* プロフィール公開設定 */}
        <div className="flex items-center gap-4 p-4">
          <div className={`p-2 rounded-lg ${isPublic ? 'bg-green-100' : 'bg-gray-100'}`}>
            {isPublic ? (
              <Eye className="h-5 w-5 text-green-600" />
            ) : (
              <EyeOff className="h-5 w-5 text-gray-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <Label 
              htmlFor="isPublic" 
              className="font-medium text-sm cursor-pointer"
            >
              プロフィールを公開
            </Label>
            <p className="text-xs text-gray-400">
              {isPublic 
                ? '誰でもあなたのプロフィールを見ることができます' 
                : 'あなたのプロフィールは非公開です'}
            </p>
          </div>
          <Switch
            id="isPublic"
            checked={isPublic}
            onCheckedChange={handleToggle}
            disabled={isSaving}
          />
        </div>
      </div>

      {/* 説明 */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h3 className="font-medium text-sm mb-2">公開設定について</h3>
        <ul className="text-xs text-gray-500 space-y-1">
          <li>• <strong>公開</strong>: 誰でもあなたのプロフィール、投稿、レビューを見ることができます</li>
          <li>• <strong>非公開</strong>: フォロワーとマッチした相手のみがあなたの詳細を見ることができます</li>
          <li>• 非公開でも、投稿は検索結果に表示されます（投稿者名は表示されます）</li>
        </ul>
      </div>
    </div>
  );
}
