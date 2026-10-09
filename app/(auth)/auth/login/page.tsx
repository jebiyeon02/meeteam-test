'use client';

import Link from 'next/link';

import RedirectIfAuthenticated from '@/components/features/auth/RedirectIfAuthenticated';
import LoginForm from '@/components/features/auth/LoginForm';
import AppLogo from '@/components/shared/AppLogo';

export default function Page() {
  return (
    <RedirectIfAuthenticated>
      <section className="flex w-full max-w-md flex-col rounded-3xl bg-mt-white p-10 shadow-xl">
        <div className="flex flex-col items-center justify-end pt-16 gap-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center transition-opacity hover:opacity-80"
            aria-label="meeTeam 홈"
          >
            <AppLogo className="h-14 w-60" priority />
          </Link>
        </div>

        <LoginForm />
      </section>
    </RedirectIfAuthenticated>
  );
}
