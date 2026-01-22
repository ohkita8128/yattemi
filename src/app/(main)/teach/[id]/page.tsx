'use client';

import { useParams } from 'next/navigation';
import { SessionChat } from '@/components/session';

export default function TeachChatPage() {
  const params = useParams();
  const matchId = params.id as string;

  return <SessionChat matchId={matchId} basePath="teach" />;
}
