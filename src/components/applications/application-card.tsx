'use client';

import Link from 'next/link';
import { Clock, CheckCircle, XCircle, AlertCircle, Ban } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import type { ApplicationStatus } from '@/types';

interface ApplicationCardProps {
  application: {
    id: string;
    message: string | null;
    status: ApplicationStatus;
    created_at: string;
    post: {
      id: string;
      title: string;
      type: 'teach' | 'learn';
    };
    applicant: {
      id: string;
      username: string;
      display_name: string;
      avatar_url: string | null;
    };
  };
  showApplicant?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  isUpdating?: boolean;
}

// ApplicationStatus型に合わせたキー定義
const statusConfig: Record<ApplicationStatus, {
  label: string;
  color: string;
  icon: typeof AlertCircle;
}> = {
  pending: {
    label: '審査中',
    color: 'bg-yellow-100 text-yellow-700',
    icon: AlertCircle,
  },
  accepted: {
    label: '承認済み',
    color: 'bg-green-100 text-green-700',
    icon: CheckCircle,
  },
  rejected: {
    label: '却下',
    color: 'bg-red-100 text-red-700',
    icon: XCircle,
  },
  cancelled: {
    label: 'キャンセル',
    color: 'bg-gray-100 text-gray-500',
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

  return (
    <div className="bg-white rounded-xl border shadow-sm p-5">
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
              application.post.type === 'teach'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-cyan-100 text-cyan-700'
            }`}
          >
            {application.post.type === 'teach' ? '🎓 教えたい' : '📘 教えてほしい'}
          </span>
        </div>
        <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${status.color}`}>
          <StatusIcon className="h-3 w-3" />
          {status.label}
        </span>
      </div>

      {/* Applicant (if showing) */}
      {showApplicant && (
        <div className="flex items-center gap-3 mb-3 p-3 bg-gray-50 rounded-lg">
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {application.applicant.avatar_url ? (
              <img
                src={application.applicant.avatar_url}
                alt={application.applicant.display_name}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <span className="font-medium text-gray-600">
                {application.applicant.display_name[0]}
              </span>
            )}
          </div>
          <div>
            <p className="font-medium">{application.applicant.display_name}</p>
            <p className="text-sm text-gray-500">@{application.applicant.username}</p>
          </div>
        </div>
      )}

      {/* Message */}
      {application.message && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-3">
          {application.message}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatRelativeTime(application.created_at)}
        </span>

        {/* Actions (for received applications) */}
        {application.status === 'pending' && onApprove && onReject && (
          <div className="flex gap-2">
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
          </div>
        )}
      </div>
    </div>
  );
}
