import { describe, expect, it } from 'vitest';

import {
  getPendingRecruitmentDeleteTargets,
  isPendingRecruitmentDeleteError,
} from '@/components/features/project/manage/projectEditGuards';
import type { RecruitInterest } from '@/types/project';

const INITIAL_RECRUITMENTS: RecruitInterest[] = [
  {
    major: '프론트엔드',
    minor: '웹 프론트엔드',
    count: 2,
    recruitmentStateId: 701,
    currentCount: 0,
    pendingApplicationCount: 0,
  },
  {
    major: '백엔드',
    minor: 'Node.js/NestJS',
    count: 1,
    recruitmentStateId: 702,
    currentCount: 0,
    pendingApplicationCount: 2,
  },
  {
    major: '기획',
    minor: 'PM',
    count: 1,
    recruitmentStateId: 703,
    currentCount: 1,
    pendingApplicationCount: 0,
  },
];

describe('project edit guards', () => {
  it('[EX-005] 대기 지원자가 있는 삭제 포지션만 자동 거절 confirm 대상으로 추린다', () => {
    expect(
      getPendingRecruitmentDeleteTargets(INITIAL_RECRUITMENTS, [
        {
          major: '프론트엔드',
          minor: '웹 프론트엔드',
          count: 2,
          recruitmentStateId: 701,
        },
      ]),
    ).toEqual([
      {
        recruitmentStateId: 702,
        label: '백엔드 Node.js/NestJS',
        pendingApplicationCount: 2,
      },
    ]);
  });

  it('[EX-004] 승인된 팀원만 있고 대기 지원자가 없는 삭제 포지션은 자동 거절 confirm 대상이 아니다', () => {
    expect(getPendingRecruitmentDeleteTargets(INITIAL_RECRUITMENTS, [])).not.toContainEqual(
      expect.objectContaining({
        recruitmentStateId: 703,
      }),
    );
  });

  it('[EX-005] 백엔드 대기 지원자 삭제 에러만 confirm 모달 트리거로 본다', () => {
    expect(
      isPendingRecruitmentDeleteError(
        new Error('대기 지원자가 있는 포지션입니다. 삭제 시 자동 거절됩니다.'),
      ),
    ).toBe(true);
    expect(
      isPendingRecruitmentDeleteError(new Error('승인된 팀원이 있어 삭제할 수 없습니다.')),
    ).toBe(false);
  });
});
