import type { ReactNode } from 'react';
import { NavBar } from '@/components/shared/NavBar';
import ProtectedRoute from '@/components/features/auth/ProtectedRoute';

export default function WithNavLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-mt-bg text-mt-text-primary">
      <NavBar />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ProtectedRoute>{children}</ProtectedRoute>
      </main>
    </div>
  );
}
