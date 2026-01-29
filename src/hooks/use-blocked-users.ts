// src/hooks/use-blocked-users.ts
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useBlockedUsers() {
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  
  useEffect(() => {
    const fetchBlocked = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;
      
      const { data } = await (supabase as any)
        .from('blocks')
        .select('blocked_id')
        .eq('blocker_id', user.id);
      
      if (data) {
        setBlockedIds(data.map((b: any) => b.blocked_id));
      }
    };
    
    fetchBlocked();
  }, []);
  
  return blockedIds;
}