'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Inbox, Send } from 'lucide-react';
import { ApplicationCard } from '@/components/applications';
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

  // ログインしてなければリダイレクト
  if (!authLoading && !isAuthenticated) {
    router.push(`${ROUTES.LOGIN}?redirect=/applications`);
    return null;
  }

  const handleApprove = async (applicationId: string) => {
    try {
      // 'accepted' に修正（型定義に合わせる）
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <h1 className="text-2xl font-bold mb-6">応募管理</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('received')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
              activeTab === 'received'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Inbox className="h-4 w-4" />
            受け取った応募
            {receivedApplications.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-white/20 rounded-full">
                {receivedApplications.filter((a) => a.status === 'pending').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
              activeTab === 'sent'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Send className="h-4 w-4" />
            送った応募
          </button>
        </div>

        {/* Content */}
        {authLoading || isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500">
              {activeTab === 'received'
                ? 'まだ応募を受け取っていません'
                : 'まだ応募していません'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
                showApplicant={activeTab === 'received'}
                onApprove={activeTab === 'received' ? handleApprove : undefined}
                onReject={activeTab === 'received' ? handleReject : undefined}
                isUpdating={isUpdating}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
