'use client';

import ConfirmModal from '@/components/shared/ConfirmModal';

type ProjectMemberRemovalModalProps = {
  isOpen: boolean;
  isSubmitting?: boolean;
  memberName: string;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

export default function ProjectMemberRemovalModal({
  isOpen,
  isSubmitting = false,
  memberName,
  onClose,
  onConfirm,
}: ProjectMemberRemovalModalProps) {
  return (
    <ConfirmModal
      isOpen={isOpen}
      title="팀원을 방출할까요?"
      description={
        <>
          정말로 <span className="font-bold">{memberName}</span>님을 방출하시겠습니까?
        </>
      }
      closeLabel="취소"
      confirmLabel={isSubmitting ? '방출 중' : '방출하기'}
      isSubmitting={isSubmitting}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
