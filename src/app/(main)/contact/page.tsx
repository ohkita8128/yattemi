// src/app/(main)/contact/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Mail, Send, CheckCircle } from 'lucide-react';
import { getClient } from '@/lib/supabase/client';

const INQUIRY_TYPES = [
  { value: 'general', label: '一般的なお問い合わせ' },
  { value: 'bug', label: '不具合・バグの報告' },
  { value: 'feature', label: '機能リクエスト' },
  { value: 'account', label: 'アカウントに関して' },
  { value: 'report', label: '違反報告・通報' },
  { value: 'other', label: 'その他' },
] as const;

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    type: '',
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.type || !formData.subject || !formData.message) {
      toast.error('必須項目を入力してください');
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = getClient();
      
      const { error } = await (supabase as any)
        .from('contact_inquiries')
        .insert({
          name: formData.name || null,
          email: formData.email,
          inquiry_type: formData.type,
          subject: formData.subject,
          message: formData.message,
        });

      if (error) throw error;

      setIsSubmitted(true);
      toast.success('お問い合わせを送信しました');
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      toast.error('送信に失敗しました。メールでお問い合わせください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <div className="text-center space-y-4">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h1 className="text-2xl font-bold">お問い合わせを受け付けました</h1>
          <p className="text-muted-foreground">
            内容を確認の上、ご連絡いたします。<br />
            通常3営業日以内にご返信いたします。
          </p>
          <Button 
            variant="outline" 
            onClick={() => {
              setIsSubmitted(false);
              setFormData({ name: '', email: '', type: '', subject: '', message: '' });
            }}
          >
            新しいお問い合わせ
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-2">お問い合わせ</h1>
      <p className="text-muted-foreground mb-8">
        YatteMi!に関するご質問・ご要望・不具合報告などをお送りください。
      </p>

      {/* メールでのお問い合わせ */}
      <div className="bg-muted/50 rounded-lg p-4 mb-8 flex items-center gap-3">
        <Mail className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        <div>
          <p className="text-sm">メールでのお問い合わせ</p>
          <a 
            href="mailto:yattemi.official@gmail.com" 
            className="text-primary hover:underline font-medium"
          >
            yattemi.official@gmail.com
          </a>
        </div>
      </div>

      {/* お問い合わせフォーム */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">お名前</Label>
            <Input
              id="name"
              placeholder="山田太郎"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">
              メールアドレス <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="example@email.com"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">
            お問い合わせ種別 <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData({ ...formData, type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="選択してください" />
            </SelectTrigger>
            <SelectContent>
              {INQUIRY_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject">
            件名 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="subject"
            placeholder="お問い合わせの件名"
            required
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">
            お問い合わせ内容 <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="message"
            placeholder="お問い合わせ内容を詳しくご記入ください"
            rows={6}
            required
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          />
        </div>

        <div className="text-sm text-muted-foreground">
          <span className="text-destructive">*</span> は必須項目です
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            '送信中...'
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              送信する
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          お問い合わせいただいた内容は
          <a href="/privacy" className="text-primary hover:underline">プライバシーポリシー</a>
          に基づいて取り扱います。
        </p>
      </form>
    </div>
  );
}
