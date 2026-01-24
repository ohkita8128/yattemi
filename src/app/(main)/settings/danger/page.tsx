'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks';
import { getClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { LogOut, Trash2, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function DangerSettingsPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      toast.success('ログアウトしました');
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('ログアウトに失敗しました');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) {
      toast.error('ログインが必要です');
      return;
    }

    if (deleteConfirmText !== '削除する') {
      toast.error('「削除する」と入力してください');
      return;
    }

    setIsDeleting(true);
    try {
      const supabase = getClient();
      
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) throw profileError;

      await signOut();

      toast.success('アカウントを削除しました');
      router.push('/');
    } catch (error: any) {
      console.error('Delete account error:', error);
      toast.error(error.message || 'アカウントの削除に失敗しました');
    } finally {
      setIsDeleting(false);
    }
  };

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
        <h2 className="text-xl font-bold">アカウント管理</h2>
        <p className="text-sm text-gray-500 mt-1">
          ログアウトやアカウント削除を行います
        </p>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gray-100 rounded-lg">
            <LogOut className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <h3 className="font-semibold">ログアウト</h3>
            <p className="text-sm text-gray-500">このデバイスからログアウトします</p>
          </div>
        </div>

        <Button 
          variant="outline" 
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full sm:w-auto"
        >
          {isLoggingOut ? 'ログアウト中...' : 'ログアウト'}
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-red-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <Trash2 className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-red-600">アカウント削除</h3>
            <p className="text-sm text-gray-500">アカウントと全てのデータを削除します</p>
          </div>
        </div>

        {!showDeleteConfirm ? (
          <Button 
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full sm:w-auto"
          >
            アカウントを削除
          </Button>
        ) : (
          <div className="space-y-4 p-4 bg-red-50 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-700">本当に削除しますか？</p>
                <p className="text-red-600 mt-1">
                  この操作は取り消せません。以下のデータが全て削除されます：
                </p>
                <ul className="list-disc list-inside text-red-600 mt-2 space-y-1">
                  <li>プロフィール情報</li>
                  <li>投稿した全ての内容</li>
                  <li>メッセージ履歴</li>
                  <li>いいね、フォロー情報</li>
                </ul>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deleteConfirm" className="text-sm text-red-700">
                確認のため「削除する」と入力してください
              </Label>
              <Input
                id="deleteConfirm"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="削除する"
                className="border-red-200"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText('');
                }}
                className="flex-1"
              >
                キャンセル
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmText !== '削除する'}
                className="flex-1"
              >
                {isDeleting ? '削除中...' : '完全に削除する'}
              </Button>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center">
        お困りの場合は
        <Link href="/contact" className="text-orange-500 hover:underline ml-1">
          お問い合わせ
        </Link>
        からご連絡ください
      </p>
    </div>
  );
}
