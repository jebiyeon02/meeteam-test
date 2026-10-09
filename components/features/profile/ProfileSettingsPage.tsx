'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { withdrawMember } from '@/components/features/auth/loginApi';
import ConfirmModal from '@/components/shared/ConfirmModal';
import ToastMessage from '@/components/shared/ToastMessage';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoginModalStore } from '@/stores/useLoginModalStore';

export default function ProfileSettingsPage() {
  const router = useRouter();
  const beginLogout = useAuthStore((state) => state.beginLogout);
  const clearSession = useAuthStore((state) => state.clearSession);
  const closeLoginModal = useLoginModalStore((state) => state.closeLoginModal);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const closeConfirmModal = () => {
    if (isWithdrawing) {
      return;
    }

    setIsConfirmOpen(false);
  };

  const handleWithdraw = async () => {
    if (isWithdrawing) {
      return;
    }

    try {
      setIsWithdrawing(true);
      setErrorMessage(null);
      await withdrawMember();
      beginLogout();
      closeLoginModal();
      clearSession();
      setIsConfirmOpen(false);
      router.replace('/');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : '회원 탈퇴 처리 중 오류가 발생했습니다.',
      );
      setIsConfirmOpen(false);
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <ToastMessage message={errorMessage} />

      <div className="rounded-3xl border border-mt-border bg-mt-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm leading-5 font-semibold text-mt-primary">설정</p>
            <br />
            <h2 className="text-lg leading-7 font-bold text-mt-text-primary">회원탈퇴</h2>
            <p className="mt-1 text-sm leading-6 text-mt-text-secondary">
              계정 정보와 활동 내역이 삭제되며, 탈퇴 후에는 복구할 수 없습니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsConfirmOpen(true)}
            disabled={isWithdrawing}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-mt-border bg-mt-white px-4 text-sm font-bold text-mt-text-secondary transition-colors hover:border-mt-danger hover:text-mt-danger disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isWithdrawing ? '탈퇴 처리 중' : '회원탈퇴'}
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="회원탈퇴를 진행할까요?"
        description="탈퇴하면 계정 정보와 활동 내역을 복구할 수 없습니다. 진행 전 필요한 정보가 남아있는지 한 번 더 확인해 주세요."
        closeLabel="취소"
        confirmLabel={isWithdrawing ? '탈퇴 처리 중' : '탈퇴하기'}
        isSubmitting={isWithdrawing}
        onClose={closeConfirmModal}
        onConfirm={() => void handleWithdraw()}
      />
    </section>
  );
}
