'use client';

import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

import BaseModal from '@/components/shared/BaseModal';
import AppLogo from '@/components/shared/AppLogo';
import { useLoginModalStore } from '@/stores/useLoginModalStore';

import LoginForm from './LoginForm';

export default function LoginPromptModal() {
  const router = useRouter();
  const isOpen = useLoginModalStore((state) => state.isOpen);
  const redirectPath = useLoginModalStore((state) => state.redirectPath);
  const title = useLoginModalStore((state) => state.title);
  const closeLoginModal = useLoginModalStore((state) => state.closeLoginModal);

  const handleSignupRequired = (signupPath: string) => {
    router.push(signupPath);
    closeLoginModal();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={closeLoginModal}>
      <section className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-2xl bg-mt-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <AppLogo className="h-8 w-36" />
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-mt-text-primary">{title}</h2>
            </div>
          </div>

          <button
            type="button"
            onClick={closeLoginModal}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-mt-border text-mt-text-secondary transition-colors hover:bg-mt-bg-soft hover:text-mt-text-primary"
            aria-label="로그인 모달 닫기"
          >
            <X className="h-4 w-4" aria-hidden strokeWidth={1.8} />
          </button>
        </div>

        <LoginForm
          redirectPath={redirectPath ?? undefined}
          onSuccess={closeLoginModal}
          onSignupRequired={handleSignupRequired}
        />
      </section>
    </BaseModal>
  );
}
