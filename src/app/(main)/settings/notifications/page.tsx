'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks';
import { getClient } from '@/lib/supabase/client';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Bell, Heart, MessageSquare, UserPlus, Send, ArrowLeft, HelpCircle, Star } from 'lucide-react';
import Link from 'next/link';

interface NotificationSettings {
  likes: boolean;
  applications: boolean;
  messages: boolean;
  follows: boolean;
  matches: boolean;
  questions: boolean;
  reviews: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  likes: true,
  applications: true,
  messages: true,
  follows: true,
  matches: true,
  questions: true,
  reviews: true,
};

const NOTIFICATION_OPTIONS = [
  {
    key: 'likes' as keyof NotificationSettings,
    label: 'いいね',
    description: '投稿にいいねされたとき',
    icon: Heart,
    color: 'text-red-500',
    bgColor: 'bg-red-100',
  },
  {
    key: 'applications' as keyof NotificationSettings,
    label: '応募',
    description: '投稿に応募があったとき',
    icon: Send,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
  },
  {
    key: 'messages' as keyof NotificationSettings,
    label: 'メッセージ',
    description: '新しいメッセージを受信したとき',
    icon: MessageSquare,
    color: 'text-green-500',
    bgColor: 'bg-green-100',
  },
  {
    key: 'follows' as keyof NotificationSettings,
    label: 'フォロー',
    description: '新しいフォロワーができたとき',
    icon: UserPlus,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100',
  },
  {
    key: 'matches' as keyof NotificationSettings,
    label: 'マッチング',
    description: 'マッチングが成立したとき',
    icon: Bell,
    color: 'text-orange-500',
    bgColor: 'bg-orange-100',
  },
  {
    key: 'questions' as keyof NotificationSettings,
    label: '質問',
    description: '投稿に質問が来たとき・回答があったとき',
    icon: HelpCircle,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-100',
  },
  {
    key: 'reviews' as keyof NotificationSettings,
    label: 'レビュー',
    description: 'レビューが届いたとき',
    icon: Star,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100',
  },
];

export default function NotificationSettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchSettings = async () => {
      try {
        const supabase = getClient();
        const { data, error } = await supabase
          .from('profiles')
          .select('notification_settings')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching settings:', error);
        }

        const profileData = data as { notification_settings?: NotificationSettings } | null;
        if (profileData?.notification_settings) {
          setSettings({ ...DEFAULT_SETTINGS, ...profileData.notification_settings });
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  const handleToggle = async (key: keyof NotificationSettings) => {
    if (!user) return;
    
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);

    setIsSaving(true);
    try {
      const supabase = getClient();
      const { error } = await (supabase as any)
        .from('profiles')
        .update({ notification_settings: newSettings })
        .eq('id', user.id);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error('設定の保存に失敗しました');
      setSettings(settings);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="bg-white rounded-xl border p-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 py-4 border-b last:border-b-0">
              <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse" />
              <div className="flex-1">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-3 w-48 bg-gray-100 rounded animate-pulse" />
              </div>
              <div className="h-6 w-10 bg-gray-200 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link 
        href="/settings" 
        className="md:hidden flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        設定に戻る
      </Link>

      <div>
        <h2 className="text-xl font-bold">通知設定</h2>
        <p className="text-sm text-gray-500 mt-1">
          受け取る通知を選択できます
        </p>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        {NOTIFICATION_OPTIONS.map((option) => {
          const Icon = option.icon;
          return (
            <div
              key={option.key}
              className="flex items-center gap-4 p-4 border-b last:border-b-0"
            >
              <div className={`p-2 rounded-lg ${option.bgColor}`}>
                <Icon className={`h-5 w-5 ${option.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <Label 
                  htmlFor={option.key} 
                  className="font-medium text-sm cursor-pointer"
                >
                  {option.label}
                </Label>
                <p className="text-xs text-gray-400">{option.description}</p>
              </div>
              <Switch
                id={option.key}
                checked={settings[option.key]}
                onCheckedChange={() => handleToggle(option.key)}
                disabled={isSaving}
              />
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 text-center">
        ※設定は自動的に保存されます
      </p>
    </div>
  );
}
