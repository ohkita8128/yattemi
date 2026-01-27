'use client';

import { usePathname } from 'next/navigation';
import { Header, Footer } from '@/components/layout';
import { BottomNav } from '@/components/layout/bottom-nav';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // チャットページ判定
  const isChatPage = pathname.startsWith('/matches/') && pathname !== '/matches';

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfcfc]">
      {/* チャットページ: スマホは非表示、PCは表示 */}
      {isChatPage ? (
        <div className="hidden md:block">
          <Header />
        </div>
      ) : (
        <Header />
      )}
      
      <main className={`flex-1 ${isChatPage ? 'pb-0' : 'pb-16 md:pb-0'}`}>
        {children}
      </main>
      
      {!isChatPage && (
        <div className="hidden md:block">
          <Footer />
        </div>
      )}
      <BottomNav />
    </div>
  );
}