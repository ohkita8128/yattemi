// src/components/users/block-button.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Ban } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface BlockButtonProps {
  targetUserId: string;
  initialBlocked?: boolean;
}

export function BlockButton({ targetUserId, initialBlocked = false }: BlockButtonProps) {
  const [isBlocked, setIsBlocked] = useState(initialBlocked);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleToggleBlock = async () => {
    setLoading(true);
    try {
      if (isBlocked) {
        // ブロック解除
        await (supabase as any)
          .from('blocks')
          .delete()
          .eq('blocked_id', targetUserId);
        setIsBlocked(false);
        toast.success('ブロックを解除しました');
      } else {
        // ブロック
        await (supabase as any)
          .from('blocks')
          .insert({ blocked_id: targetUserId });
        setIsBlocked(true);
        toast.success('ブロックしました');
      }
    } catch (error) {
      toast.error('エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={isBlocked ? 'outline' : 'ghost'}
      size="sm"
      onClick={handleToggleBlock}
      disabled={loading}
      className={isBlocked ? 'text-red-500 border-red-200' : 'text-gray-500'}
    >
      <Ban className="h-4 w-4 mr-1" />
      {isBlocked ? 'ブロック中' : 'ブロック'}
    </Button>
  );
}