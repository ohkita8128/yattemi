'use client';

import { useState } from 'react';
import { X, Flag } from 'lucide-react';
import { toast } from 'sonner';
import { useReport, ReportType, ReportReason } from '@/hooks/use-report';

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: ReportType;
  targetId: string;
}

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'spam', label: 'スパム・宣伝' },
  { value: 'inappropriate', label: '不適切なコンテンツ' },
  { value: 'harassment', label: '嫌がらせ・誹謗中傷' },
  { value: 'dating', label: '出会い・ナンパ目的' },
  { value: 'scam', label: '詐欺・金銭要求' },
  { value: 'personal_info', label: '個人情報の要求' },
  { value: 'impersonation', label: 'なりすまし' },
  { value: 'other', label: 'その他' },
];

const TYPE_LABELS: Record<ReportType, string> = {
  question: '質問',
  post: '投稿',
  user: 'ユーザー',
  message: 'メッセージ',
};

export function ReportDialog({ isOpen, onClose, type, targetId }: ReportDialogProps) {
  const { submitReport, isSubmitting } = useReport();
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [detail, setDetail] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('通報理由を選択してください');
      return;
    }

    const result = await submitReport({
      type,
      targetId,
      reason,
      detail: detail.trim() || undefined,
    });

    if (result.success) {
      toast.success('通報を受け付けました');
      onClose();
      setReason('');
      setDetail('');
    } else {
      toast.error(result.error || '通報に失敗しました');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* オーバーレイ */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* ダイアログ */}
      <div className="relative bg-white rounded-xl w-full max-w-sm mx-4 overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-red-500" />
            <span className="font-bold">{TYPE_LABELS[type]}を通報</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-4 space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">通報理由</p>
            <div className="space-y-2">
              {REPORT_REASONS.map((r) => (
                <label
                  key={r.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    reason === r.value
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={(e) => setReason(e.target.value as ReportReason)}
                    className="sr-only"
                  />
                  <div
                    className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                      reason === r.value ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    {reason === r.value && (
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                    )}
                  </div>
                  <span className="text-sm">{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">詳細（任意）</p>
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="詳しい状況を教えてください..."
              className="w-full p-3 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={3}
            />
          </div>
        </div>

        {/* フッター */}
        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={handleSubmit}
            disabled={!reason || isSubmitting}
            className="w-full py-2.5 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '送信中...' : '通報する'}
          </button>
        </div>
      </div>
    </div>
  );
}