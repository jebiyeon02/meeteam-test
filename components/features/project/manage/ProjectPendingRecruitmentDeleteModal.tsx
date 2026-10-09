'use client';

import ConfirmModal from '@/components/shared/ConfirmModal';
import type { PendingRecruitmentDeleteTarget } from './projectEditGuards';

type ProjectPendingRecruitmentDeleteModalProps = {
  isOpen: boolean;
  isSubmitting?: boolean;
  targets: PendingRecruitmentDeleteTarget[];
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

export default function ProjectPendingRecruitmentDeleteModal({
  isOpen,
  isSubmitting = false,
  targets,
  onClose,
  onConfirm,
}: ProjectPendingRecruitmentDeleteModalProps) {
  const totalPendingCount = targets.reduce(
    (sum, target) => sum + target.pendingApplicationCount,
    0,
  );

  return (
    <ConfirmModal
      isOpen={isOpen}
      title="대기 지원자가 있어요"
      description="삭제하려는 모집 분야에 대기 중인 지원자가 있습니다. 계속 저장하면 해당 지원서는 자동으로 거절됩니다."
      closeLabel="취소"
      confirmLabel={isSubmitting ? '저장 중' : '자동 거절 후 저장'}
      isSubmitting={isSubmitting}
      onClose={onClose}
      onConfirm={onConfirm}
    >
      <div className="rounded-2xl border border-mt-border bg-mt-white px-4 py-3">
        <p className="text-sm leading-5 font-bold text-mt-text-primary">
          자동 거절 예정 지원자 {totalPendingCount}명
        </p>

        {targets.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {targets.map((target) => (
              <li
                key={target.recruitmentStateId}
                className="flex items-center justify-between gap-3 text-sm leading-5 text-mt-text-secondary"
              >
                <span className="min-w-0 truncate">{target.label}</span>
                <span className="shrink-0 font-bold text-mt-hero-blue">
                  {target.pendingApplicationCount}명
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm leading-5 text-mt-text-secondary">
            백엔드가 대기 지원자 충돌을 감지했습니다.
          </p>
        )}
      </div>
    </ConfirmModal>
  );
}
