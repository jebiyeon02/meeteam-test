import { afterEach, describe, expect, it, vi } from 'vitest';

import type { JobFieldOption } from '@/types/auth';
import type { ProjectFormValues } from '@/types/project';

import * as projectApi from '@/components/features/project/projectApi';

const originalFetch = global.fetch;

const JOB_FIELDS: JobFieldOption[] = [
  {
    code: 'FRONTEND',
    name: '프론트엔드',
    positions: [{ id: 25, code: 'WEB_FRONTEND', name: '웹 프론트엔드' }],
    techStacks: [
      { id: 1, name: 'React' },
      { id: 2, name: 'TypeScript' },
    ],
  },
  {
    code: 'BACKEND',
    name: '백엔드',
    positions: [{ id: 31, code: 'NODE_NESTJS', name: 'Node.js/NestJS' }],
    techStacks: [
      { id: 11, name: 'Node.js' },
      { id: 12, name: 'PostgreSQL' },
    ],
  },
];

const PROJECT_VALUES: ProjectFormValues = {
  projectName: '  QA 계약 테스트 프로젝트  ',
  githubUrl: 'github.com/meeteam/qa-contract',
  communicationUrl: 'https://discord.gg/meeteam',
  categoryId: 'capstone',
  description: '  프로젝트 API 계약을 검증하는 테스트 설명입니다.  ',
  releasePlatforms: ['웹'],
  myInterest: {
    major: '프론트엔드',
    minor: '웹 프론트엔드',
  },
  recruitInterests: [
    {
      major: '프론트엔드',
      minor: '웹 프론트엔드',
      count: 2,
    },
    {
      major: '백엔드',
      minor: 'Node.js/NestJS',
      count: 1,
    },
  ],
  recruitTechStacks: {
    '프론트엔드 - 웹 프론트엔드': ['React', 'TypeScript'],
    '백엔드 - Node.js/NestJS': ['Node.js'],
  },
  recruitDeadline: '2026-06-30',
  isRecruitUntilComplete: false,
  coverImage: null,
};

afterEach(() => {
  vi.restoreAllMocks();
  global.fetch = originalFetch;
});

describe('buildProjectCreatePayload', () => {
  it('프로젝트 등록 폼 값을 백엔드 생성 payload로 변환한다', () => {
    expect(projectApi.buildProjectCreatePayload(PROJECT_VALUES, JOB_FIELDS)).toEqual({
      projectName: 'QA 계약 테스트 프로젝트',
      githubRepositoryUrl: 'https://github.com/meeteam/qa-contract',
      communicationChannelUrl: 'https://discord.gg/meeteam',
      projectCategory: 'CAPSTONE',
      description: '프로젝트 API 계약을 검증하는 테스트 설명입니다.',
      platformCategory: 'WEB',
      creatorJobPositionCode: 'WEB_FRONTEND',
      recruitments: [
        {
          jobFieldCode: 'FRONTEND',
          jobPositionCode: 'WEB_FRONTEND',
          recruitmentCount: 2,
          techStackIds: [1, 2],
        },
        {
          jobFieldCode: 'BACKEND',
          jobPositionCode: 'NODE_NESTJS',
          recruitmentCount: 1,
          techStackIds: [11],
        },
      ],
      recruitmentDeadlineType: 'END_DATE',
      endDate: '2026-06-30',
    });
  });

  it('상시 모집 프로젝트는 endDate 없이 RECRUITMENT_COMPLETED로 보낸다', () => {
    expect(
      projectApi.buildProjectCreatePayload(
        {
          ...PROJECT_VALUES,
          recruitDeadline: '',
          isRecruitUntilComplete: true,
        },
        JOB_FIELDS,
      ),
    ).toMatchObject({
      recruitmentDeadlineType: 'RECRUITMENT_COMPLETED',
      endDate: undefined,
    });
  });
});

describe('buildProjectEditPayload', () => {
  it('[EX-001] 현재 승인 인원보다 모집 인원을 줄이면 수정 payload 생성을 막는다', () => {
    expect(() =>
      projectApi.buildProjectEditPayload(
        {
          ...PROJECT_VALUES,
          recruitInterests: [
            {
              major: '프론트엔드',
              minor: '웹 프론트엔드',
              count: 2,
              recruitmentStateId: 701,
              currentCount: 3,
              minRecruitmentCount: 3,
            },
          ],
        },
        JOB_FIELDS,
      ),
    ).toThrow('현재 승인된 인원보다 적게 설정할 수 없습니다.');
  });

  it('[EX-002] 현재 승인 인원과 같은 모집 인원은 수정 payload로 허용한다', () => {
    expect(
      projectApi.buildProjectEditPayload(
        {
          ...PROJECT_VALUES,
          recruitInterests: [
            {
              major: '프론트엔드',
              minor: '웹 프론트엔드',
              count: 3,
              recruitmentStateId: 701,
              currentCount: 3,
              minRecruitmentCount: 3,
            },
          ],
          recruitTechStacks: {
            '프론트엔드 - 웹 프론트엔드': ['React'],
          },
        },
        JOB_FIELDS,
      ).recruitments[0],
    ).toMatchObject({
      recruitmentStateId: 701,
      recruitmentCount: 3,
    });
  });

  it('[EX-003] 현재 승인 인원보다 큰 모집 인원은 수정 payload로 허용한다', () => {
    expect(
      projectApi.buildProjectEditPayload(
        {
          ...PROJECT_VALUES,
          recruitInterests: [
            {
              major: '프론트엔드',
              minor: '웹 프론트엔드',
              count: 5,
              recruitmentStateId: 701,
              currentCount: 3,
              minRecruitmentCount: 3,
            },
          ],
          recruitTechStacks: {
            '프론트엔드 - 웹 프론트엔드': ['React', 'TypeScript'],
          },
        },
        JOB_FIELDS,
      ).recruitments[0],
    ).toMatchObject({
      recruitmentStateId: 701,
      recruitmentCount: 5,
      techStackIds: [1, 2],
    });
  });

  it('프로젝트 수정 payload에 모집분야 state id와 자동 거절 확인 플래그를 포함한다', () => {
    expect(
      projectApi.buildProjectEditPayload(
        {
          ...PROJECT_VALUES,
          recruitInterests: [
            {
              major: '프론트엔드',
              minor: '웹 프론트엔드',
              count: 3,
              recruitmentStateId: 701,
            },
          ],
          recruitTechStacks: {
            '프론트엔드 - 웹 프론트엔드': ['React'],
          },
        },
        JOB_FIELDS,
        { confirmDeletePositionsWithPendingApplicants: true },
      ),
    ).toEqual({
      name: 'QA 계약 테스트 프로젝트',
      description: '프로젝트 API 계약을 검증하는 테스트 설명입니다.',
      projectCategory: 'CAPSTONE',
      platformCategory: 'WEB',
      githubRepositoryUrl: 'https://github.com/meeteam/qa-contract',
      communicationChannelUrl: 'https://discord.gg/meeteam',
      recruitmentDeadlineType: 'END_DATE',
      endDate: '2026-06-30',
      leaderJobPositionCode: 'WEB_FRONTEND',
      recruitments: [
        {
          recruitmentStateId: 701,
          jobFieldCode: 'FRONTEND',
          jobPositionCode: 'WEB_FRONTEND',
          recruitmentCount: 3,
          techStackIds: [1],
        },
      ],
      confirmDeletePositionsWithPendingApplicants: true,
    });
  });

  it('마감일 방식인데 마감일이 없으면 수정 payload 생성을 막는다', () => {
    expect(() =>
      projectApi.buildProjectEditPayload(
        {
          ...PROJECT_VALUES,
          recruitDeadline: '',
          isRecruitUntilComplete: false,
        },
        JOB_FIELDS,
      ),
    ).toThrow('프로젝트 마감일을 선택해 주세요.');
  });

  it('수정 payload 생성 시 현재 승인 인원보다 작은 모집 인원을 막는다', () => {
    expect(() =>
      projectApi.buildProjectEditPayload(
        {
          ...PROJECT_VALUES,
          recruitInterests: [
            {
              major: '프론트엔드',
              minor: '웹 프론트엔드',
              count: 1,
              recruitmentStateId: 701,
              minRecruitmentCount: 2,
            },
          ],
        },
        JOB_FIELDS,
      ),
    ).toThrow('현재 승인된 인원보다 적게 설정할 수 없습니다.');
  });

  it('수정 payload 생성 시 같은 모집 분야 중복을 막는다', () => {
    expect(() =>
      projectApi.buildProjectEditPayload(
        {
          ...PROJECT_VALUES,
          recruitInterests: [
            {
              major: '프론트엔드',
              minor: '웹 프론트엔드',
              count: 2,
            },
            {
              major: '프론트엔드',
              minor: '웹 프론트엔드',
              count: 1,
            },
          ],
        },
        JOB_FIELDS,
      ),
    ).toThrow('같은 모집 분야는 한 번만 추가할 수 있어요.');
  });
});

describe('projectApi mutation contracts', () => {
  it('createProject는 multipart form data로 request JSON과 파일을 보낸다', async () => {
    const payload = projectApi.buildProjectCreatePayload(PROJECT_VALUES, JOB_FIELDS);
    const file = new File(['cover'], 'cover.png', { type: 'image/png' });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        result: {
          id: 1201,
          title: 'QA 계약 테스트 프로젝트',
          createdAt: '2026-05-01T00:00:00',
        },
      }),
    } as Response);

    await expect(projectApi.createProject(payload, file)).resolves.toEqual({
      id: 1201,
      title: 'QA 계약 테스트 프로젝트',
      createdAt: '2026-05-01T00:00:00',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/projects',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      }),
    );

    const [, requestInit] = vi.mocked(global.fetch).mock.calls[0] ?? [];
    const formData = requestInit?.body as FormData;
    const requestBlob = formData.get('request');

    expect(formData).toBeInstanceOf(FormData);
    expect(requestBlob).toBeInstanceOf(Blob);
    await expect((requestBlob as Blob).text()).resolves.toBe(JSON.stringify(payload));
    expect(formData.get('file')).toBe(file);
  });

  it('applyToProject는 지원 payload를 보내고 백엔드 상태를 프론트 상태로 매핑한다', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        result: {
          applicationId: 9001,
          projectId: 1201,
          applicantId: 42,
          status: '대기중',
        },
      }),
    } as Response);

    await expect(
      projectApi.applyToProject(1201, {
        jobPositionCode: 'WEB_FRONTEND',
        motivation: '프론트엔드 구현 경험으로 기여하고 싶습니다.',
      }),
    ).resolves.toEqual({
      applicationId: 9001,
      projectId: 1201,
      applicantId: 42,
      status: 'pending',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/projects/1201/application',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
          jobPositionCode: 'WEB_FRONTEND',
          motivation: '프론트엔드 구현 경험으로 기여하고 싶습니다.',
        }),
      }),
    );
  });

  it('decideProjectApplication은 승인/거절 결정을 application decision endpoint로 보낸다', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        result: {
          applicationId: 9001,
          projectId: 1201,
          applicantId: 77,
          decision: 'ACCEPTED',
        },
      }),
    } as Response);

    await expect(projectApi.decideProjectApplication(1201, 9001, 'ACCEPTED')).resolves.toEqual({
      applicationId: 9001,
      projectId: 1201,
      applicantId: 77,
      decision: 'approved',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/projects/1201/applications/9001/decision',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ decision: 'ACCEPTED' }),
      }),
    );
  });

  it('expelProjectMember는 팀원 방출을 DELETE 요청으로 보낸다', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        result: {
          projectId: 1201,
          expelledMemberId: 99,
          expelledMemberName: '팀원',
        },
      }),
    } as Response);

    await expect(projectApi.expelProjectMember(1201, 99)).resolves.toEqual({
      projectId: 1201,
      expelledMemberId: 99,
      expelledMemberName: '팀원',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/projects/1201/members/99',
      expect.objectContaining({
        method: 'DELETE',
        credentials: 'include',
      }),
    );
  });
});

describe('projectApi read contracts', () => {
  it('fetchProjectApplications는 지원자 목록을 UI 모델로 변환한다', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        result: [
          {
            applicationId: 9001,
            applicantId: 77,
            applicantName: '지원자',
            profileImageUrl: null,
            applicantEmail: 'applicant@example.com',
            jobFieldName: '프론트엔드',
            jobPositionName: '웹 프론트엔드',
            motivation: 'React 경험으로 프로젝트에 기여하고 싶습니다.',
            status: 'PENDING',
            appliedAt: '2026-04-23T10:00:00',
            currentCount: 1,
            recruitmentCount: 2,
            isRecruitmentFull: false,
          },
        ],
      }),
    } as Response);

    await expect(projectApi.fetchProjectApplications(1201)).resolves.toEqual([
      expect.objectContaining({
        id: 9001,
        applicantId: 77,
        name: '지원자',
        position: '프론트엔드',
        specialty: '웹 프론트엔드',
        appliedAt: '2026.04.23 지원',
        email: 'applicant@example.com',
        status: 'pending',
        currentCount: 1,
        recruitmentCount: 2,
        isRecruitmentFull: false,
      }),
    ]);
  });

  it('[EX-004] fetchProjectEditPrefill은 승인된 팀원이 있는 포지션의 삭제 불가 상태를 보존한다', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        result: {
          projectId: 1201,
          name: '삭제 불가 포지션 프로젝트',
          description: '승인 인원이 있는 포지션 삭제 불가 상태를 검증합니다.',
          projectCategory: 'CAPSTONE',
          projectCategoryName: '캡스톤',
          platformCategory: 'WEB',
          recruitmentDeadlineType: 'END_DATE',
          githubRepositoryUrl: null,
          communicationChannelUrl: null,
          endDate: '2026-06-30',
          imageUrl: null,
          leaderJobFieldName: '프론트엔드',
          leaderJobPositionName: '웹 프론트엔드',
          editable: true,
          notEditableReason: null,
          recruitments: [
            {
              recruitmentStateId: 701,
              jobFieldCode: 'FRONTEND',
              jobFieldName: '프론트엔드',
              jobPositionCode: 'WEB_FRONTEND',
              jobPositionName: '웹 프론트엔드',
              recruitmentCount: 3,
              currentCount: 1,
              pendingApplicationCount: 0,
              techStackIds: [1],
              techStackNames: ['React'],
              deletable: false,
              notDeletableReason: '승인된 팀원이 있는 포지션은 삭제할 수 없습니다.',
              minRecruitmentCount: 1,
            },
          ],
        },
      }),
    } as Response);

    await expect(projectApi.fetchProjectEditPrefill(1201)).resolves.toMatchObject({
      values: {
        recruitInterests: [
          {
            recruitmentStateId: 701,
            currentCount: 1,
            minRecruitmentCount: 1,
            deletable: false,
            notDeletableReason: '승인된 팀원이 있는 포지션은 삭제할 수 없습니다.',
          },
        ],
      },
    });
  });

  it('[EX-012] fetchProjectApplications는 정원 마감 여부를 승인 버튼 비활성화에 쓸 수 있게 보존한다', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        result: [
          {
            applicationId: 9001,
            applicantId: 77,
            applicantName: '첫 번째 지원자',
            profileImageUrl: null,
            applicantEmail: 'first@example.com',
            jobFieldName: '프론트엔드',
            jobPositionName: '웹 프론트엔드',
            motivation: '첫 번째 승인 후 정원이 찬 상태입니다.',
            status: 'PENDING',
            appliedAt: '2026-04-23T10:00:00',
            currentCount: 1,
            recruitmentCount: 1,
            isRecruitmentFull: true,
          },
        ],
      }),
    } as Response);

    await expect(projectApi.fetchProjectApplications(1201)).resolves.toEqual([
      expect.objectContaining({
        id: 9001,
        currentCount: 1,
        recruitmentCount: 1,
        isRecruitmentFull: true,
      }),
    ]);
  });

  it('[EX-013] fetchProjectApplications는 이미 결정된 지원서 상태를 pending과 구분해 매핑한다', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        result: [
          {
            applicationId: 9001,
            applicantId: 77,
            applicantName: '승인된 지원자',
            profileImageUrl: null,
            applicantEmail: 'approved@example.com',
            jobFieldName: '프론트엔드',
            jobPositionName: '웹 프론트엔드',
            motivation: '이미 승인된 지원서입니다.',
            status: 'ACCEPTED',
            appliedAt: '2026-04-23T10:00:00',
            currentCount: 1,
            recruitmentCount: 2,
            isRecruitmentFull: false,
          },
          {
            applicationId: 9002,
            applicantId: 78,
            applicantName: '거절된 지원자',
            profileImageUrl: null,
            applicantEmail: 'rejected@example.com',
            jobFieldName: '프론트엔드',
            jobPositionName: '웹 프론트엔드',
            motivation: '이미 거절된 지원서입니다.',
            status: 'REJECTED',
            appliedAt: '2026-04-24T10:00:00',
            currentCount: 1,
            recruitmentCount: 2,
            isRecruitmentFull: false,
          },
        ],
      }),
    } as Response);

    await expect(projectApi.fetchProjectApplications(1201)).resolves.toEqual([
      expect.objectContaining({ id: 9001, status: 'approved' }),
      expect.objectContaining({ id: 9002, status: 'rejected' }),
    ]);
  });

  it('fetchProjectEditPrefill은 endDate가 null인 현재 백엔드 응답을 상시 모집으로 해석한다', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        result: {
          projectId: 1201,
          name: '상시 모집 프로젝트',
          description: '상시 모집 prefill 테스트',
          projectCategory: 'ETC',
          projectCategoryName: '기타',
          platformCategory: 'WEB',
          githubRepositoryUrl: null,
          communicationChannelUrl: null,
          endDate: null,
          imageUrl: null,
          leaderJobFieldName: '프론트엔드',
          leaderJobPositionName: '웹 프론트엔드',
          editable: true,
          notEditableReason: null,
          recruitments: [
            {
              recruitmentStateId: 701,
              jobFieldCode: 'FRONTEND',
              jobFieldName: '프론트엔드',
              jobPositionCode: 'WEB_FRONTEND',
              jobPositionName: '웹 프론트엔드',
              recruitmentCount: 2,
              currentCount: 1,
              pendingApplicationCount: 0,
              techStackIds: [1],
              techStackNames: ['React'],
              deletable: true,
              notDeletableReason: null,
              minRecruitmentCount: 1,
            },
          ],
        },
      }),
    } as Response);

    await expect(projectApi.fetchProjectEditPrefill(1201)).resolves.toMatchObject({
      values: {
        projectName: '상시 모집 프로젝트',
        categoryId: 'other',
        releasePlatforms: ['웹'],
        recruitDeadline: '',
        isRecruitUntilComplete: true,
      },
      editable: true,
    });
  });
});

describe('missing project lifecycle contracts (TDD)', () => {
  it('deleteProject helper가 프로젝트 삭제 API 계약을 제공해야 한다', async () => {
    type DeleteProject = (projectId: string | number) => Promise<unknown>;
    const deleteProject = (projectApi as unknown as { deleteProject?: DeleteProject })
      .deleteProject;

    expect(
      deleteProject,
      '프로젝트 리더가 프로젝트를 삭제할 수 있도록 deleteProject API helper가 필요합니다.',
    ).toBeTypeOf('function');

    if (typeof deleteProject !== 'function') {
      return;
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        result: {
          projectId: 1201,
          deleted: true,
        },
      }),
    } as Response);

    await deleteProject(1201);

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/projects/1201',
      expect.objectContaining({
        method: 'DELETE',
        credentials: 'include',
      }),
    );
  });

  it('cancelProjectApplication helper가 내 지원 취소 API 계약을 제공해야 한다', async () => {
    type CancelProjectApplication = (applicationId: string | number) => Promise<unknown>;
    const cancelProjectApplication = (
      projectApi as unknown as {
        cancelProjectApplication?: CancelProjectApplication;
      }
    ).cancelProjectApplication;

    expect(
      cancelProjectApplication,
      '지원자는 본인 지원서를 철회할 수 있도록 cancelProjectApplication API helper가 필요합니다.',
    ).toBeTypeOf('function');

    if (typeof cancelProjectApplication !== 'function') {
      return;
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        result: {
          applicationId: 9001,
          projectId: 1201,
          projectName: 'meeTeam',
          status: 'CANCELLED',
        },
      }),
    } as Response);

    await cancelProjectApplication(9001);

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/members/me/applications/9001',
      expect.objectContaining({
        method: 'DELETE',
        credentials: 'include',
      }),
    );
  });

  it('[EX-007][EX-008][EX-009][EX-010] 신청 화면 GET에서 지원 불가 사유를 그대로 노출한다', async () => {
    const cases = [
      {
        status: 409,
        message: '이미 지원한 프로젝트입니다.',
      },
      {
        status: 409,
        message: '이미 참여 중인 프로젝트입니다.',
      },
      {
        status: 403,
        message: '자신의 프로젝트에는 지원할 수 없습니다.',
      },
      {
        status: 409,
        message: '모집이 마감된 포지션입니다.',
      },
    ];

    for (const testCase of cases) {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: testCase.status,
        json: async () => ({
          message: testCase.message,
        }),
      } as Response);

      await expect(projectApi.fetchProjectApplicationPage(1201)).rejects.toThrow(testCase.message);
    }
  });

  it('[EX-016][EX-017] deleteProject는 v1 삭제 계약과 비리더 403을 구분한다', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        result: {
          projectId: 1201,
          deleted: true,
        },
      }),
    } as Response);

    await expect(projectApi.deleteProject(1201)).resolves.toEqual({
      projectId: 1201,
      deleted: true,
    });

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({
        code: 'FORBIDDEN',
        message: '프로젝트 삭제 권한이 없습니다.',
      }),
    } as Response);

    await expect(projectApi.deleteProject(1201)).rejects.toMatchObject({
      name: 'PermissionDeniedError',
      message: '프로젝트 삭제 권한이 없습니다.',
    });
  });

  it('[EX-019] ACCEPTED/REJECTED 지원 취소는 백엔드 거절 메시지를 그대로 전달한다', async () => {
    for (const message of [
      '승인된 지원서는 지원 취소할 수 없습니다.',
      '거절된 지원서는 지원 취소할 수 없습니다.',
    ]) {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({
          message,
        }),
      } as Response);

      await expect(projectApi.cancelProjectApplication(9001)).rejects.toThrow(message);
    }
  });

  it('[EX-015] leaveProject helper가 팀원 자진 탈퇴 API 계약을 제공해야 한다', async () => {
    type LeaveProject = (projectId: string | number) => Promise<unknown>;
    const leaveProject = (projectApi as unknown as { leaveProject?: LeaveProject }).leaveProject;

    expect(
      leaveProject,
      '팀원이 자진 탈퇴하면 해당 포지션 currentCount를 감소시키는 leaveProject API helper가 필요합니다.',
    ).toBeTypeOf('function');

    if (typeof leaveProject !== 'function') {
      return;
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        result: {
          projectId: 1201,
          left: true,
        },
      }),
    } as Response);

    await leaveProject(1201);

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/project-members/withdraw',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ projectId: 1201 }),
      }),
    );
  });

  it('[EX-020] 재지원 정책은 현재 백엔드 중복 지원 정책을 명시해야 한다', async () => {
    type FetchProjectApplicationPolicy = (projectId: string | number) => Promise<{
      blockedStatuses: string[];
      reapplyableStatuses: string[];
    }>;
    const fetchProjectApplicationPolicy = (
      projectApi as unknown as {
        fetchProjectApplicationPolicy?: FetchProjectApplicationPolicy;
      }
    ).fetchProjectApplicationPolicy;

    expect(
      fetchProjectApplicationPolicy,
      '백엔드가 기존 지원 상태와 관계없이 동일 프로젝트 재지원을 막으므로 프론트 정책도 이를 명시해야 합니다.',
    ).toBeTypeOf('function');

    if (typeof fetchProjectApplicationPolicy !== 'function') {
      return;
    }

    await expect(fetchProjectApplicationPolicy(1201)).resolves.toEqual({
      blockedStatuses: ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED'],
      reapplyableStatuses: [],
    });
  });
});
