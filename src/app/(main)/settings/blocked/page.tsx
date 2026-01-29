'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Ban, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface BlockedUser {
  id: string;
  blocked_id: string;
  created_at: string;
  profile: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export default function BlockedUsersPage() {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchBlocked = async () => {
      const { data } = await (supabase as any)
        .from('blocks')
        .select(`
          id,
          blocked_id,
          created_at,
          profile:profiles!blocked_id (
            username,
            display_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (data) {
        setBlockedUsers(data);
      }
      setLoading(false);
    };

    fetchBlocked();
  }, [supabase]);

  const handleUnblock = async (blockId: string, username: string) => {
    setUnblockingId(blockId);
    try {
      await (supabase as any)
        .from('blocks')
        .delete()
        .eq('id', blockId);

      setBlockedUsers(prev => prev.filter(b => b.id !== blockId));
      toast.success(`${username}さんのブロックを解除しました`);
    } catch (error) {
      toast.error('エラーが発生しました');
    } finally {
      setUnblockingId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-8">
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border">
      <div className="p-4 border-b">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Ban className="h-5 w-5" />
          ブロックリスト
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          ブロック中のユーザーは投稿やメッセージが非表示になります
        </p>
      </div>

      {blockedUsers.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <Ban className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>ブロック中のユーザーはいません</p>
        </div>
      ) : (
        <div className="divide-y">
          {blockedUsers.map((block) => (
            <div key={block.id} className="flex items-center gap-3 p-4">
              <Link href={`/users/${block.profile.username}`}>
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                  {block.profile.avatar_url ? (
                    <img
                      src={block.profile.avatar_url}
                      alt={block.profile.display_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/users/${block.profile.username}`}>
                  <p className="font-medium truncate hover:underline">
                    {block.profile.display_name}
                  </p>
                  <p className="text-sm text-gray-500">@{block.profile.username}</p>
                </Link>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUnblock(block.id, block.profile.display_name)}
                disabled={unblockingId === block.id}
              >
                {unblockingId === block.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  '解除'
                )}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}