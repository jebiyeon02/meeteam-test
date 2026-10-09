import type { ReactNode } from 'react';
import { NavBar } from '@/components/shared/NavBar';

export default function WithNavLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-mt-white text-mt-text-primary">
      <NavBar />
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 md:py-8 lg:px-8">{children}</main>
    </div>
  );
}
