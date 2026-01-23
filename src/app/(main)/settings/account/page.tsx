'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks';
import { getClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AccountSettingsPage() {
  const { user } = useAuth();
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) {
      toast.error('新しいメールアドレスを入力してください');
      return;
    }

    setIsEmailLoading(true);
    try {
      const supabase = getClient();
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) throw error;

      toast.success('確認メールを送信しました。メールを確認してください。');
      setNewEmail('');
    } catch (error: any) {
      console.error('Email update error:', error);
      toast.error(error.message || 'メールアドレスの変更に失敗しました');
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      toast.error('パスワードを入力してください');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('パスワードが一致しません');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('パスワードは6文字以上で入力してください');
      return;
    }

    setIsPasswordLoading(true);
    try {
      const supabase = getClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success('パスワードを変更しました');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Password update error:', error);
      toast.error(error.message || 'パスワードの変更に失敗しました');
    } finally {
      setIsPasswordLoading(false);
    }
  };

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
        <h2 className="text-xl font-bold">アカウント設定</h2>
        <p className="text-sm text-gray-500 mt-1">
          メールアドレスとパスワードを管理します
        </p>
      </div>

      {/* メールアドレス変更 */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Mail className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold">メールアドレス</h3>
            <p className="text-sm text-gray-500">現在: {user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleEmailChange} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newEmail">新しいメールアドレス</Label>
            <Input
              id="newEmail"
              type="email"
              placeholder="new@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={isEmailLoading} className="w-full sm:w-auto">
            {isEmailLoading ? '送信中...' : 'メールアドレスを変更'}
          </Button>
          <p className="text-xs text-gray-400">
            ※確認メールが届きます。メール内のリンクをクリックして変更を完了してください。
          </p>
        </form>
      </div>

      {/* パスワード変更 */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <Lock className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold">パスワード</h3>
            <p className="text-sm text-gray-500">定期的な変更をおすすめします</p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">新しいパスワード</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">新しいパスワード（確認）</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={isPasswordLoading} className="w-full sm:w-auto">
            {isPasswordLoading ? '変更中...' : 'パスワードを変更'}
          </Button>
          <p className="text-xs text-gray-400">
            ※6文字以上で入力してください
          </p>
        </form>
      </div>
    </div>
  );
}
