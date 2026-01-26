'use client';

import { Header, Footer } from '@/components/layout';
import { BottomNav } from '@/components/layout/bottom-nav';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#fcfcfc]">
      <Header />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <div className="hidden md:block">
        <Footer />
      </div>
      <BottomNav />  {/* スマホのみ（コンポーネント内でmd:hidden） */}
    </div>
  );
}
