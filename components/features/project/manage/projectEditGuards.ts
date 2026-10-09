import type { RecruitInterest } from '@/types/project';

export type PendingRecruitmentDeleteTarget = {
  recruitmentStateId: number;
  label: string;
  pendingApplicationCount: number;
};

export function isPendingRecruitmentDeleteError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message;

  return (
    message.includes('지원자') &&
    message.includes('삭제') &&
    (message.includes('대기') || message.includes('자동 거절'))
  );
}

export function getPendingRecruitmentDeleteTargets(
  initialRecruitments: RecruitInterest[],
  nextRecruitments: RecruitInterest[],
): PendingRecruitmentDeleteTarget[] {
  const nextRecruitmentIds = new Set(
    nextRecruitments
      .map((recruitment) => recruitment.recruitmentStateId)
      .filter((id): id is number => typeof id === 'number'),
  );

  return initialRecruitments
    .filter((recruitment) => {
      const recruitmentStateId = recruitment.recruitmentStateId;

      return (
        typeof recruitmentStateId === 'number' &&
        !nextRecruitmentIds.has(recruitmentStateId) &&
        (recruitment.pendingApplicationCount ?? 0) > 0
      );
    })
    .map((recruitment) => ({
      recruitmentStateId: recruitment.recruitmentStateId as number,
      label: `${recruitment.major} ${recruitment.minor}`.trim(),
      pendingApplicationCount: recruitment.pendingApplicationCount ?? 0,
    }));
}
