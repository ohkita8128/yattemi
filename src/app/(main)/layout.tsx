'use client';
import { usePathname } from 'next/navigation';
import { Header, Footer } from '@/components/layout';
import { BottomNav } from '@/components/layout/bottom-nav';
import { ErrorBoundary } from '@/components/common/error-boundary';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // チャットページ判定
  const isChatPage = pathname.startsWith('/matches/') && pathname !== '/matches';

  return (
    <div className={`flex flex-col bg-[#fcfcfc] ${isChatPage ? 'h-screen' : 'min-h-screen'}`}>
      {/* チャットページ: スマホは非表示、PCは表示 */}
      {isChatPage ? (
        <div className="hidden md:block">
          <Header />
        </div>
      ) : (
        <Header />
      )}

      <main className={`flex-1 ${isChatPage ? 'overflow-hidden' : 'pb-16 md:pb-0'}`}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>

      {!isChatPage && (
        <div className="hidden md:block">
          <Footer />
        </div>
      )}

      {/* チャットページではBottomNavも非表示 */}
      {!isChatPage && <BottomNav />}
    </div>
  );
}