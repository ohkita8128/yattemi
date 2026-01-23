'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks';
import { getClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, Lock, ArrowLeft, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

// パスワード強度チェック
const checkPasswordStrength = (password: string) => {
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
  };
  
  const passed = Object.values(checks).filter(Boolean).length;
  
  return {
    checks,
    score: passed,
    isStrong: passed >= 3 && checks.length,
  };
};

export default function AccountSettingsPage() {
  const { user } = useAuth();
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  // メールアドレス変更用
  const [newEmail, setNewEmail] = useState('');
  const [emailCurrentPassword, setEmailCurrentPassword] = useState('');
  const [showEmailPassword, setShowEmailPassword] = useState(false);

  // パスワード変更用
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordStrength = checkPasswordStrength(newPassword);

  // 現在のパスワードを確認する関数
  const verifyCurrentPassword = async (password: string): Promise<boolean> => {
    if (!user?.email) return false;
    
    const supabase = getClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: password,
    });
    
    return !error;
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEmail) {
      toast.error('新しいメールアドレスを入力してください');
      return;
    }

    if (!emailCurrentPassword) {
      toast.error('現在のパスワードを入力してください');
      return;
    }

    setIsEmailLoading(true);
    try {
      // 現在のパスワードを確認
      const isValid = await verifyCurrentPassword(emailCurrentPassword);
      if (!isValid) {
        toast.error('現在のパスワードが正しくありません');
        return;
      }

      const supabase = getClient();
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) throw error;

      toast.success('確認メールを送信しました。新しいメールアドレスに届いたリンクをクリックしてください。');
      setNewEmail('');
      setEmailCurrentPassword('');
    } catch (error: any) {
      console.error('Email update error:', error);
      toast.error(error.message || 'メールアドレスの変更に失敗しました');
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error('現在のパスワードを入力してください');
      return;
    }

    if (!newPassword || !confirmPassword) {
      toast.error('新しいパスワードを入力してください');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('新しいパスワードが一致しません');
      return;
    }

    if (!passwordStrength.isStrong) {
      toast.error('より強力なパスワードを設定してください');
      return;
    }

    if (currentPassword === newPassword) {
      toast.error('新しいパスワードは現在のパスワードと異なるものにしてください');
      return;
    }

    setIsPasswordLoading(true);
    try {
      // 現在のパスワードを確認
      const isValid = await verifyCurrentPassword(currentPassword);
      if (!isValid) {
        toast.error('現在のパスワードが正しくありません');
        return;
      }

      const supabase = getClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success('パスワードを変更しました');
      setCurrentPassword('');
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
              autoComplete="off"
              placeholder="new@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="emailCurrentPassword">現在のパスワード</Label>
            <div className="relative">
              <Input
                id="emailCurrentPassword"
                autoComplete="current-password"
                type={showEmailPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={emailCurrentPassword}
                onChange={(e) => setEmailCurrentPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowEmailPassword(!showEmailPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showEmailPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" disabled={isEmailLoading} className="w-full sm:w-auto">
            {isEmailLoading ? '送信中...' : 'メールアドレスを変更'}
          </Button>
          <p className="text-xs text-gray-400">
            ※新しいメールアドレスに確認メールが届きます。リンクをクリックして変更を完了してください。
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
            <Label htmlFor="currentPassword">現在のパスワード</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                autoComplete="current-password"
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">新しいパスワード</Label>
            <div className="relative">
              <Input
                id="newPassword"
                autoComplete="new-password"
                type={showNewPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            
            {/* パスワード強度インジケーター */}
            {newPassword && (
              <div className="mt-2 space-y-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        passwordStrength.score >= level
                          ? passwordStrength.score >= 3
                            ? 'bg-green-500'
                            : passwordStrength.score >= 2
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-xs space-y-1">
                  <div className={`flex items-center gap-1 ${passwordStrength.checks.length ? 'text-green-600' : 'text-gray-400'}`}>
                    {passwordStrength.checks.length ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    8文字以上
                  </div>
                  <div className={`flex items-center gap-1 ${passwordStrength.checks.lowercase ? 'text-green-600' : 'text-gray-400'}`}>
                    {passwordStrength.checks.lowercase ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    小文字を含む (a-z)
                  </div>
                  <div className={`flex items-center gap-1 ${passwordStrength.checks.uppercase ? 'text-green-600' : 'text-gray-400'}`}>
                    {passwordStrength.checks.uppercase ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    大文字を含む (A-Z)
                  </div>
                  <div className={`flex items-center gap-1 ${passwordStrength.checks.number ? 'text-green-600' : 'text-gray-400'}`}>
                    {passwordStrength.checks.number ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    数字を含む (0-9)
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">新しいパスワード（確認）</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                autoComplete="new-password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                パスワードが一致しません
              </p>
            )}
            {confirmPassword && newPassword === confirmPassword && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                パスワードが一致しました
              </p>
            )}
          </div>

          <Button 
            type="submit" 
            disabled={isPasswordLoading || !passwordStrength.isStrong || newPassword !== confirmPassword} 
            className="w-full sm:w-auto"
          >
            {isPasswordLoading ? '変更中...' : 'パスワードを変更'}
          </Button>
        </form>
      </div>
    </div>
  );
}
