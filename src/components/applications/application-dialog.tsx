'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCreateApplication } from '@/hooks';

interface ApplicationDialogProps {
  postId: string;
  postTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ApplicationDialog({
  postId,
  postTitle,
  isOpen,
  onClose,
  onSuccess,
}: ApplicationDialogProps) {
  const [message, setMessage] = useState('');
  const { createApplication, isSubmitting } = useCreateApplication();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast.error('メッセージを入力してください');
      return;
    }

    try {
      await createApplication(postId, message);
      toast.success('応募しました！');
      setMessage('');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Application error:', error);
      const err = error as any;
      if (err?.code === '23505') {
        toast.error('既に応募済みです');
      } else {
        toast.error('応募に失敗しました');
      }
    }

  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">応募する</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Post Title */}
        <p className="text-sm text-gray-500 mb-4">
          「{postTitle}」に応募
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">メッセージ</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="自己紹介や、なぜ応募したいかを書いてください"
              className="min-h-[120px]"
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="flex-1"
            >
              応募する
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
