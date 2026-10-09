import { delay, http, HttpResponse } from 'msw';
import { projectApplicationSchema } from '@/components/features/project/apply/schema';
import { isProjectOpen, isRecruitmentOpen } from './projectContract';
import { JOB_OPTIONS } from './fixtures';
import { getMembers } from './storage';
import { toProjectDetail } from './responseMappers';
import {
  getApplications,
  getProjects,
  getSessionMember,
  saveApplication,
  getLikes,
  toggleLike,
} from './storage';

function success<T>(result: T) {
  return HttpResponse.json({ code: 'COMMON200', message: '요청에 성공했습니다.', result });
}
function failure(status: number, message: string, code = 'PROJECT_APPLICATION400') {
  return HttpResponse.json({ code, message, result: null }, { status });
}
const positions = JOB_OPTIONS.fields.flatMap((field) => field.positions);

export const projectWeek6Handlers = [
  http.get('/api/v1/projects/:projectId/team', ({ params }) => {
    const member = getSessionMember();
    if (!member) return failure(401, '로그인이 필요합니다.');
    const project = getProjects().find((item) => item.id === Number(params.projectId));
    if (!project) return failure(404, '프로젝트를 찾을 수 없습니다.');
    if (project.leaderId !== member.memberId) return failure(403, '프로젝트 관리 권한이 없습니다.');
    return success({
      currentMemberCount: project.currentMembers,
      totalRecruitmentCount: 1 + project.recruitments.reduce((sum, item) => sum + item.count, 0),
      pendingApplicationCount: getApplications().filter(
        (item) => item.projectId === project.id && item.status === 'PENDING',
      ).length,
      members: toProjectDetail(project).members.map((item) => ({
        ...item,
        jobFieldName: '',
        jobPositionName: '',
        isLeader: item.memberId === project.leaderId,
      })),
    });
  }),
  http.get('/api/v1/projects/:projectId/applications', ({ params }) => {
    const member = getSessionMember();
    if (!member) return failure(401, '로그인이 필요합니다.');
    const project = getProjects().find((item) => item.id === Number(params.projectId));
    if (!project) return failure(404, '프로젝트를 찾을 수 없습니다.');
    if (project.leaderId !== member.memberId) return failure(403, '프로젝트 관리 권한이 없습니다.');
    return success(
      getApplications()
        .filter((item) => item.projectId === project.id && item.status === 'PENDING')
        .map((item) => {
          const applicant = getMembers().find((member) => member.memberId === item.applicantId);
          const recruitment = project.recruitments.find(
            (recruitment) => recruitment.jobPositionId === item.jobPositionId,
          );
          return {
            ...item,
            applicantName: applicant?.name ?? '',
            applicantEmail: applicant?.email ?? '',
            profileImageUrl: applicant?.profileImageUrl ?? null,
            jobFieldName:
              JOB_OPTIONS.fields.find((field) =>
                field.positions.some((position) => position.id === item.jobPositionId),
              )?.name ?? '',
            currentCount: recruitment?.currentCount ?? 0,
            recruitmentCount: recruitment?.count ?? 0,
            isRecruitmentFull:
              !!recruitment && (recruitment.currentCount ?? 0) >= recruitment.count,
          };
        }),
    );
  }),
  http.get('/api/v1/projects/:projectId/application', async ({ params }) => {
    await delay(150);
    const member = getSessionMember();
    if (!member) return failure(401, '로그인이 필요합니다.');
    const project = getProjects().find((item) => item.id === Number(params.projectId));
    if (!project) return failure(404, '프로젝트를 찾을 수 없습니다.');
    if (project.leaderId === member.memberId || project.memberIds?.includes(member.memberId))
      return failure(403, '참여 중인 프로젝트에는 지원할 수 없습니다.');
    return success({
      applicant: {
        name: member.name,
        email: member.email,
        techStacks: JOB_OPTIONS.fields
          .flatMap((field) => field.techStacks)
          .filter((item) => member.techStackIds.includes(item.id))
          .map((item, index) => ({ ...item, displayOrder: index + 1 })),
      },
      recruitments: project.recruitments.filter(isRecruitmentOpen).map((item, index) => ({
        id: index + 1,
        jobFieldName: JOB_OPTIONS.fields.find((field) => field.code === item.jobFieldCode)?.name,
        jobPositionName: positions.find((position) => position.id === item.jobPositionId)?.name,
        techStacks: JOB_OPTIONS.fields
          .flatMap((field) => field.techStacks)
          .filter((skill) => item.techStackIds.includes(skill.id))
          .map((skill) => skill.name),
        isClosed: false,
      })),
    });
  }),
  http.post('/api/v1/projects/:projectId/application', async ({ request, params }) => {
    await delay(200);
    const member = getSessionMember();
    if (!member) return failure(401, '로그인이 필요합니다.');
    const project = getProjects().find((item) => item.id === Number(params.projectId));
    if (!project) return failure(404, '프로젝트를 찾을 수 없습니다.');
    const parsed = projectApplicationSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return failure(400, parsed.error.issues[0].message);
    if (project.leaderId === member.memberId || project.memberIds?.includes(member.memberId))
      return failure(403, '참여 중인 프로젝트에는 지원할 수 없습니다.', 'PROJECT_APPLICATION403');
    if (
      getApplications().some(
        (item) => item.projectId === project.id && item.applicantId === member.memberId,
      )
    )
      return failure(400, '이미 신청한 프로젝트입니다. 취소 후 재지원도 불가능합니다.');
    const position = positions.find((item) => item.code === parsed.data.jobPositionCode);
    const recruitment = project.recruitments.find((item) => item.jobPositionId === position?.id);
    if (recruitment && (recruitment.currentCount ?? 0) >= recruitment.count)
      return failure(400, '해당 직무의 모집 인원이 모두 찼습니다.', 'RECRUITMENT400');
    if (!isProjectOpen(project)) return failure(400, '해당 프로젝트는 모집이 마감되었습니다.');
    if (!position || !recruitment || !isRecruitmentOpen(recruitment))
      return failure(400, '해당 직무는 현재 모집하고 있지 않습니다.');
    if (parsed.data.motivation.includes('서버오류'))
      return failure(500, '지원서 제출 중 서버 오류가 발생했습니다.');
    if (parsed.data.motivation.includes('네트워크오류')) return HttpResponse.error();
    const application = {
      applicationId: Math.max(0, ...getApplications().map((item) => item.applicationId)) + 1,
      projectId: project.id,
      projectName: project.name,
      projectImageUrl: project.imageUrl,
      applicantId: member.memberId,
      jobPositionId: position.id,
      jobPositionName: position.name,
      motivation: parsed.data.motivation,
      status: 'PENDING' as const,
      statusDisplayName: '대기중',
      appliedAt: new Date().toISOString(),
    };
    saveApplication(application);
    return success({
      applicationId: application.applicationId,
      projectId: project.id,
      applicantId: member.memberId,
      status: application.status,
    });
  }),
  http.get('/api/v1/members/me/applications', async () => {
    await delay(100);
    const member = getSessionMember();
    if (!member) return failure(401, '로그인이 필요합니다.');
    return success(
      getApplications()
        .filter((item) => item.applicantId === member.memberId)
        .map((item) => ({
          applicationId: item.applicationId,
          projectId: item.projectId,
          projectName: item.projectName,
          projectImageUrl: item.projectImageUrl,
          jobPositionId: item.jobPositionId,
          jobPositionName: item.jobPositionName,
          status: item.status,
          statusDisplayName: item.statusDisplayName,
          appliedAt: item.appliedAt,
        })),
    );
  }),
  http.get('/api/v1/projects/:projectId/applications/:applicationId', async ({ params }) => {
    const member = getSessionMember();
    if (!member) return failure(401, '로그인이 필요합니다.');
    const application = getApplications().find(
      (item) =>
        item.applicationId === Number(params.applicationId) &&
        item.projectId === Number(params.projectId),
    );
    if (!application) return failure(404, '지원서를 찾을 수 없습니다.');
    if (member.memberId !== application.applicantId)
      return failure(403, '본인의 지원서만 조회할 수 있습니다.');
    const field = JOB_OPTIONS.fields.find((field) =>
      field.positions.some((position) => position.id === application.jobPositionId),
    );
    return success({
      applicationId: application.applicationId,
      applicantId: member.memberId,
      applicantName: member.name,
      applicantEmail: member.email,
      profileImageUrl: member.profileImageUrl,
      age: new Date().getFullYear() - Number(member.birthDate.slice(0, 4)),
      gender: member.gender,
      techStacks: JOB_OPTIONS.fields
        .flatMap((field) => field.techStacks)
        .filter((skill) => member.techStackIds.includes(skill.id))
        .map((skill, index) => ({ ...skill, displayOrder: index + 1 })),
      motivation: application.motivation,
      status: application.status,
      jobPosition: {
        jobPositionId: application.jobPositionId,
        jobPositionName: application.jobPositionName,
        jobFieldId: 0,
        jobFieldName: field?.name ?? '',
      },
    });
  }),
  http.delete('/api/v1/members/me/applications/:applicationId', async ({ params }) => {
    await delay(150);
    const member = getSessionMember();
    if (!member) return failure(401, '로그인이 필요합니다.');
    const application = getApplications().find(
      (item) => item.applicationId === Number(params.applicationId),
    );
    if (!application) return failure(404, '지원서를 찾을 수 없습니다.');
    if (application.applicantId !== member.memberId)
      return failure(403, '본인의 지원서만 취소할 수 있습니다.');
    if (application.status !== 'PENDING')
      return failure(400, '대기 중인 지원서만 취소할 수 있습니다.');
    saveApplication({ ...application, status: 'CANCELLED', statusDisplayName: '취소됨' });
    return success({
      applicationId: application.applicationId,
      projectId: application.projectId,
      status: 'CANCELLED',
    });
  }),
  http.get('/api/v1/project/like/:projectId', ({ params }) => {
    const member = getSessionMember();
    if (!member) return failure(401, '로그인이 필요합니다.');
    if (!getProjects().some((item) => item.id === Number(params.projectId)))
      return failure(404, '프로젝트를 찾을 수 없습니다.');
    return success({ isLiked: getLikes().includes(`${member.memberId}:${params.projectId}`) });
  }),
  http.post('/api/v1/project/like/:projectId', ({ params }) => {
    const member = getSessionMember();
    if (!member) return failure(401, '로그인이 필요합니다.');
    if (!getProjects().some((item) => item.id === Number(params.projectId)))
      return failure(404, '프로젝트를 찾을 수 없습니다.');
    return success({
      projectId: Number(params.projectId),
      ...toggleLike(member.memberId, Number(params.projectId)),
    });
  }),
  http.get('/api/v1/projects/:projectId/qna', ({ params }) => {
    if (!getProjects().some((item) => item.id === Number(params.projectId)))
      return failure(404, '프로젝트를 찾을 수 없습니다.');
    return success({
      content:
        Number(params.projectId) === 102
          ? [
              {
                qnaId: 1,
                questionerName: '김민지',
                question: '팀 회의는 얼마나 자주 진행하나요?',
                isSecret: false,
                answers: [
                  {
                    answerId: 1,
                    writerName: '이준호',
                    content: '일주일에 한 번 온라인으로 진행합니다.',
                  },
                ],
              },
            ]
          : [],
      number: 0,
      last: true,
    });
  }),
];
