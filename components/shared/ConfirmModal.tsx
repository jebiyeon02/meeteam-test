'use client';

import type { ReactNode } from 'react';
import BaseButton from '@/components/shared/BaseButton';
import BaseModal from '@/components/shared/BaseModal';

type ConfirmModalProps = {
  isOpen: boolean;
  title: string;
  description: ReactNode;
  closeLabel?: string;
  confirmLabel: string;
  isSubmitting?: boolean;
  isConfirmDisabled?: boolean;
  confirmButtonDataCy?: string;
  children?: ReactNode;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

export default function ConfirmModal({
  isOpen,
  title,
  description,
  closeLabel = '닫기',
  confirmLabel,
  isSubmitting = false,
  isConfirmDisabled = false,
  confirmButtonDataCy,
  children,
  onClose,
  onConfirm,
}: ConfirmModalProps) {
  return (
    <BaseModal isOpen={isOpen} onClose={isSubmitting ? () => undefined : onClose}>
      <div className="rounded-2xl bg-mt-white p-6 shadow-2xl">
        <h2 className="text-xl font-extrabold text-mt-text-primary">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-mt-text-secondary">{description}</p>

        {children ? <div className="mt-5">{children}</div> : null}

        <div className="mt-6 flex justify-end gap-2">
          <BaseButton size="M" variant="gray" onClick={onClose} disabled={isSubmitting}>
            {closeLabel}
          </BaseButton>
          <BaseButton
            size="M"
            onClick={onConfirm}
            disabled={isSubmitting || isConfirmDisabled}
            data-cy={confirmButtonDataCy}
          >
            {confirmLabel}
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  );
}
