'use client';

import RedirectIfAuthenticated from '@/components/features/auth/RedirectIfAuthenticated';
import AuthSignupShell from '@/components/features/auth/AuthSignupShell';
import SejongSignupForm from '@/components/features/auth/SejongSignupForm';

export default function Page() {
  return (
    <RedirectIfAuthenticated>
      <AuthSignupShell title="세종대 회원가입">
        <SejongSignupForm />
      </AuthSignupShell>
    </RedirectIfAuthenticated>
  );
}
