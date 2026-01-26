'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { MessageSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAuth,
  useMyApplications,
  useReceivedApplications,
  useUpdateApplicationStatus,
} from '@/hooks';
import { ROUTES } from '@/lib/constants';

type Tab = 'received' | 'sent';

export default function ApplicationsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('received');

  const {
    applications: receivedApplications,
    isLoading: receivedLoading,
    refetch: refetchReceived,
  } = useReceivedApplications();

  const {
    applications: sentApplications,
    isLoading: sentLoading,
  } = useMyApplications();

  const { updateStatus, isUpdating } = useUpdateApplicationStatus();

  if (!authLoading && !isAuthenticated) {
    router.push(`${ROUTES.LOGIN}?redirect=/applications`);
    return null;
  }

  const handleApprove = async (applicationId: string) => {
    try {
      await updateStatus(applicationId, 'accepted');
      toast.success('応募を承認しました');
      refetchReceived();
    } catch (error) {
      toast.error('エラーが発生しました');
    }
  };

  const handleReject = async (applicationId: string) => {
    try {
      await updateStatus(applicationId, 'rejected');
      toast.success('応募を却下しました');
      refetchReceived();
    } catch (error) {
      toast.error('エラーが発生しました');
    }
  };

  const isLoading = activeTab === 'received' ? receivedLoading : sentLoading;
  const applications = activeTab === 'received' ? receivedApplications : sentApplications;

  const sortedApplications = activeTab === 'received'
    ? [...applications].sort((a, b) => {
        const order = { pending: 0, accepted: 1, rejected: 2 };
        return (order[a.status as keyof typeof order] ?? 3) - (order[b.status as keyof typeof order] ?? 3);
      })
    : applications;

  const pendingCount = receivedApplications.filter(a => a.status === 'pending').length;

  if (authLoading || isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-4">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-12 w-full mb-4 rounded-xl" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-4">
      <h1 className="text-lg font-bold mb-4">応募管理</h1>

      {/* セグメントコントロール風タブ */}
      <div className="bg-gray-100 p-1 rounded-xl flex mb-4">
        <button
          onClick={() => setActiveTab('received')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'received'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500'
          }`}
        >
          受信した応募
          {pendingCount > 0 && (
            <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'sent'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500'
          }`}
        >
          送信した応募
        </button>
      </div>

      {/* リスト */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {sortedApplications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">
              {activeTab === 'received' ? '受信した応募はありません' : '送信した応募はありません'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {sortedApplications.map((application: any) => {
              const isPending = application.status === 'pending';
              const isAccepted = application.status === 'accepted';
              const person = activeTab === 'received' ? application.applicant : application.post_owner;

              return (
                <div key={application.id} className="p-3 flex gap-3">
                  {/* アバター */}
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden">
                      {person?.avatar_url ? (
                        <img src={person.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-orange-400 flex items-center justify-center text-white text-sm font-bold">
                          {person?.display_name?.[0] || '?'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 右側コンテンツ */}
                  <div className="flex-1 min-w-0">
                    {/* 名前 + ステータス */}
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-sm truncate">
                        {person?.display_name || (activeTab === 'received' ? '応募者' : '投稿者')}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                          isPending
                            ? 'bg-yellow-100 text-yellow-700'
                            : isAccepted
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {isPending ? '審査中' : isAccepted ? '承認済' : '却下'}
                      </span>
                    </div>

                    {/* 投稿タイトル */}
                    <Link
                      href={`/posts/${application.post?.id || application.post_id}`}
                      className="text-xs text-gray-400 hover:text-orange-500 truncate block mb-1"
                    >
                      → {application.post?.title || '投稿'}
                    </Link>

                    {/* メッセージ本文 */}
                    {application.message && (
                      <p className="text-sm text-gray-700 line-clamp-2">{application.message}</p>
                    )}

                    {/* アクション */}
                    {activeTab === 'received' && isPending && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleApprove(application.id)}
                          disabled={isUpdating}
                          className="px-3 py-1 text-xs font-medium text-green-600 border border-green-300 rounded-full hover:bg-green-50 disabled:opacity-50"
                        >
                          ✓ 承認
                        </button>
                        <button
                          onClick={() => handleReject(application.id)}
                          disabled={isUpdating}
                          className="px-3 py-1 text-xs font-medium text-red-500 border border-red-300 rounded-full hover:bg-red-50 disabled:opacity-50"
                        >
                          却下
                        </button>
                      </div>
                    )}

                    {/* 承認済み → チャットへ */}
                    {isAccepted && application.match && (
                      <Link
                        href={`/matches/${application.match.id}`}
                        className="inline-flex items-center gap-1 mt-2 px-3 py-1 text-xs font-medium text-orange-600 border border-orange-300 rounded-full hover:bg-orange-50"
                      >
                        <MessageSquare className="h-3 w-3" />
                        チャット
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}