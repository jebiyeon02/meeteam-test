'use client';

import { Mail, UserRound } from 'lucide-react';
import BaseModal from '@/components/shared/BaseModal';
import BaseButton from '@/components/shared/BaseButton';
import { formatJobRole } from '@/components/shared/jobRoleFormat';
import MarkdownContent from '@/components/shared/MarkdownContent';
import SkillChip from '@/components/shared/SkillChip';
import ToastMessage from '@/components/shared/ToastMessage';
import type { ProjectApplicant } from '@/types/project';

type ProjectApplicantDetailModalProps = {
  applicant: ProjectApplicant | null;
  isOpen: boolean;
  isLoading?: boolean;
  errorMessage?: string | null;
  onClose: () => void;
};

function getGenderLabel(gender: ProjectApplicant['gender']) {
  if (gender === 'FEMALE') {
    return '여성';
  }

  if (gender === 'MALE') {
    return '남성';
  }

  return gender ?? '-';
}

export default function ProjectApplicantDetailModal({
  applicant,
  isOpen,
  isLoading = false,
  errorMessage,
  onClose,
}: ProjectApplicantDetailModalProps) {
  if (!applicant) {
    return null;
  }

  return (
    <BaseModal isOpen={isOpen} onClose={onClose}>
      <div className="rounded-2xl bg-mt-white p-6 shadow-2xl">
        <ToastMessage message={errorMessage} />

        <div className="pb-5">
          <p className="text-sm font-bold text-mt-primary">지원서 상세</p>
          <h2 className="mt-1 text-xl font-extrabold text-mt-text-primary">{applicant.name}</h2>
          <p className="mt-1 text-sm text-mt-text-secondary">
            {formatJobRole(applicant.position, applicant.specialty)}
          </p>
        </div>

        <div className="space-y-5">
          <div className="flex flex-wrap gap-3 text-sm text-mt-text-secondary">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-mt-badge-bg px-3 py-1 font-medium text-mt-primary">
              <UserRound className="h-4 w-4" aria-hidden strokeWidth={1.8} />
              {applicant.appliedAt}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-mt-bg-soft px-3 py-1 font-medium text-mt-text-secondary">
              <Mail className="h-4 w-4" aria-hidden strokeWidth={1.8} />
              {applicant.email}
            </span>
          </div>

          <div className="rounded-2xl border border-mt-border bg-mt-white p-4">
            <p className="text-xs font-bold text-mt-text-secondary">지원자 정보</p>
            <dl className="mt-3 grid gap-3 text-sm leading-5 sm:grid-cols-2">
              <div>
                <dt className="font-bold text-mt-text-primary">나이</dt>
                <dd className="mt-1 text-mt-text-secondary">
                  {typeof applicant.age === 'number' ? `${applicant.age}세` : '-'}
                </dd>
              </div>
              <div>
                <dt className="font-bold text-mt-text-primary">성별</dt>
                <dd className="mt-1 text-mt-text-secondary">{getGenderLabel(applicant.gender)}</dd>
              </div>
            </dl>

            <div className="mt-4 border-t border-mt-border pt-4">
              <p className="text-sm leading-5 font-bold text-mt-text-primary">기술스택</p>
              {applicant.techStacks?.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {applicant.techStacks.map((techStack) => (
                    <SkillChip
                      key={techStack.id}
                      label={techStack.name}
                      variant="outline"
                      size="md"
                    />
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm leading-5 text-mt-text-secondary">
                  등록된 기술스택이 없습니다.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-mt-border bg-mt-white p-4">
            <p className="text-xs font-bold text-mt-text-secondary">자기소개</p>
            <div className="mt-2">
              {isLoading ? (
                <p className="text-sm leading-6 text-mt-text-nav">
                  지원서 상세 정보를 불러오는 중입니다.
                </p>
              ) : (
                <MarkdownContent
                  value={applicant.introduction}
                  emptyText="아직 자기소개가 비어 있어요."
                  className="text-sm leading-6"
                />
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <BaseButton size="M" variant="gray" onClick={onClose}>
            닫기
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  );
}
