'use client';

import Link from 'next/link';
import BaseModal from '@/components/shared/BaseModal';
import BaseButton from '@/components/shared/BaseButton';
import { useLoginModalStore } from '@/stores/useLoginModalStore';

export default function LoginPromptModal() {
  const isOpen = useLoginModalStore((state) => state.isOpen);
  const title = useLoginModalStore((state) => state.title);
  const redirectPath = useLoginModalStore((state) => state.redirectPath);
  const closeLoginModal = useLoginModalStore((state) => state.closeLoginModal);

  return (
    <BaseModal isOpen={isOpen} onClose={closeLoginModal}>
      <section className="mx-auto w-full max-w-md space-y-5 rounded-2xl bg-mt-white p-6 shadow-lg">
        <h2 className="text-xl font-bold">{title}</h2>
        <div className="flex justify-end gap-2">
          <BaseButton variant="gray" onClick={closeLoginModal}>
            닫기
          </BaseButton>
          <Link
            href={`/auth/login${redirectPath ? `?next=${encodeURIComponent(redirectPath)}` : ''}`}
            onClick={closeLoginModal}
            className="inline-flex items-center rounded-xl bg-mt-primary px-4 text-sm font-bold text-mt-white"
          >
            로그인 화면
          </Link>
        </div>
      </section>
    </BaseModal>
  );
}
