'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Send, User } from 'lucide-react';
import { BadgeSelector } from './badge-selector';
import { useCreateReview, BadgeKey, ReviewerRole } from '@/hooks/use-reviews';

interface ReviewFormProps {
  matchId: string;
  revieweeId: string;
  revieweeName: string;
  revieweeAvatar?: string | null;
  /** 自分の役割 */
  myRole: ReviewerRole;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({
  matchId,
  revieweeId,
  revieweeName,
  revieweeAvatar,
  myRole,
  onSuccess,
  onCancel,
}: ReviewFormProps) {
  const [selectedBadges, setSelectedBadges] = useState<BadgeKey[]>([]);
  const [comment, setComment] = useState('');
  const { createReview, isSubmitting } = useCreateReview();

  const targetLabel = myRole === 'senpai' ? '後輩' : '先輩';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createReview(matchId, revieweeId, myRole, selectedBadges, comment);
      toast.success('感想を送りました！');
      onSuccess?.();
    } catch (error) {
      console.error('Error creating review:', error);
      toast.error('送信に失敗しました');
    }
  };

  const handleSkip = () => {
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 相手の情報 */}
      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
        <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden">
          {revieweeAvatar ? (
            <img
              src={revieweeAvatar}
              alt={revieweeName}
              className="h-12 w-12 object-cover"
            />
          ) : (
            <User className="h-6 w-6 text-orange-500" />
          )}
        </div>
        <div>
          <p className="font-medium">{revieweeName}</p>
          <p className="text-sm text-gray-500">さんに感想を送ろう！</p>
        </div>
      </div>

      {/* バッジ選択 */}
      <BadgeSelector
        selected={selectedBadges}
        onChange={setSelectedBadges}
        myRole={myRole}
        maxSelection={3}
      />

      {/* コメント */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {targetLabel}へのコメント（任意）
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={
            myRole === 'senpai'
              ? '熱心に取り組んでくれてありがとう！'
              : 'とてもわかりやすかったです！'
          }
          rows={3}
          maxLength={500}
          className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
        />
        <p className="text-xs text-gray-400 text-right">
          {comment.length}/500
        </p>
      </div>

      {/* ボタン */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleSkip}
          className="flex-1 h-12 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50"
        >
          スキップ
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 h-12 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Send className="h-5 w-5" />
              送る
            </>
          )}
        </button>
      </div>
    </form>
  );
}
