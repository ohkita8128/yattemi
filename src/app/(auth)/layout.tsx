import Link from 'next/link';
import { ROUTES } from '@/lib/constants';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Simple Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link
            href={ROUTES.HOME}
            className="flex items-center gap-2 font-display text-xl font-bold"
          >
            <span className="text-2xl">🎯</span>
            <span className="text-gradient">YatteMi!</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Simple Footer */}
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} YatteMi! All rights reserved.
        </div>
      </footer>
    </div>
  );
}
