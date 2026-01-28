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
  const isChatPage = pathname.startsWith('/matches/') && pathname !== '/matches';

  // チャットページは独自レイアウト
  if (isChatPage) {
    return (
      <div className="h-screen flex flex-col">
        <div className="hidden md:block flex-none">
          <Header />
        </div>
        <div className="flex-1 min-h-0">
          {children}
        </div>
      </div>
    );
  }

  // 通常ページ
  return (
    <div className="min-h-screen flex flex-col bg-[#fcfcfc]">
      <Header />
      <main className="flex-1 pb-16 md:pb-0">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
      <div className="hidden md:block">
        <Footer />
      </div>
      <BottomNav />
    </div>
  );
}