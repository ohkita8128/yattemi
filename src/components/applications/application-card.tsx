'use client';

import Link from 'next/link';
import { Clock, CheckCircle, XCircle, AlertCircle, Ban, MessageSquare } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import type { ApplicationStatus } from '@/types';

interface PostOwner {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

interface MatchInfo {
  id: string;
  status: 'active' | 'completed' | 'cancelled';
}

interface ApplicationCardProps {
  application: {
    id: string;
    message: string | null;
    status: ApplicationStatus;
    created_at: string;
    post: {
      id: string;
      title: string;
      type: 'support' | 'challenge';
    };
    applicant: {
      id: string;
      username: string;
      display_name: string;
      avatar_url: string | null;
    };
    post_owner?: PostOwner;
    match?: MatchInfo | null;
  };
  showApplicant?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  isUpdating?: boolean;
}

const statusConfig: Record<ApplicationStatus, {
  label: string;
  color: string;
  bgColor: string;
  icon: typeof AlertCircle;
}> = {
  pending: {
    label: '審査中',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    icon: AlertCircle,
  },
  accepted: {
    label: '承認済み',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: CheckCircle,
  },
  rejected: {
    label: '却下',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: XCircle,
  },
  cancelled: {
    label: 'キャンセル',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    icon: Ban,
  },
};

export function ApplicationCard({
  application,
  showApplicant = false,
  onApprove,
  onReject,
  isUpdating,
}: ApplicationCardProps) {
  const status = statusConfig[application.status];
  const StatusIcon = status.icon;
  
  // 送った応募の場合は投稿者を表示
  const showPostOwner = !showApplicant && application.post_owner;
  
  // チャットボタンを表示するか（承認済み & マッチあり）
  const showChatButton = application.status === 'accepted' && application.match;

  return (
    <div className={`bg-white rounded-xl border shadow-sm p-5 ${
      application.status === 'accepted' ? 'border-green-200' : ''
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <Link
            href={`/posts/${application.post.id}`}
            className="font-semibold hover:text-orange-500 line-clamp-1"
          >
            {application.post.title}
          </Link>
          <span
            className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
              application.post.type === 'support'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-cyan-100 text-cyan-700'
            }`}
          >
            {application.post.type === 'support' ? '🎓 サポート' : '📘 チャレンジ'}
          </span>
        </div>
        <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${status.bgColor} ${status.color}`}>
          <StatusIcon className="h-3 w-3" />
          {status.label}
        </span>
      </div>

      {/* 受け取った応募: 応募者を表示 */}
      {showApplicant && (
        <Link 
          href={`/users/${application.applicant.username}`}
          className="flex items-center gap-3 mb-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {application.applicant.avatar_url ? (
            <img
              src={application.applicant.avatar_url}
              alt={application.applicant.display_name}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
              <span className="font-medium text-orange-600">
                {application.applicant.display_name[0]}
              </span>
            </div>
          )}
          <div>
            <p className="font-medium">{application.applicant.display_name}</p>
            <p className="text-sm text-gray-500">@{application.applicant.username}</p>
          </div>
        </Link>
      )}

      {/* 送った応募: 投稿者を表示 */}
      {showPostOwner && application.post_owner && (
        <Link 
          href={`/users/${application.post_owner.username}`}
          className="flex items-center gap-3 mb-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          {application.post_owner.avatar_url ? (
            <img
              src={application.post_owner.avatar_url}
              alt={application.post_owner.display_name}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="font-medium text-blue-600">
                {application.post_owner.display_name[0]}
              </span>
            </div>
          )}
          <div>
            <p className="font-medium">{application.post_owner.display_name}</p>
            <p className="text-sm text-gray-500">@{application.post_owner.username} の投稿</p>
          </div>
        </Link>
      )}

      {/* Message */}
      {application.message && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-3 bg-gray-50 p-3 rounded-lg">
          {application.message}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatRelativeTime(application.created_at)}
        </span>

        <div className="flex gap-2">
          {/* 承認済み: チャットボタン */}
          {showChatButton && application.match && (
            <Link
              href={`/matches/${application.match.id}`}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              チャットを開く
            </Link>
          )}

          {/* 審査中: 承認/却下ボタン */}
          {application.status === 'pending' && onApprove && onReject && (
            <>
              <button
                onClick={() => onReject(application.id)}
                disabled={isUpdating}
                className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-50"
              >
                却下
              </button>
              <button
                onClick={() => onApprove(application.id)}
                disabled={isUpdating}
                className="px-3 py-1.5 text-sm rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
              >
                承認
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
