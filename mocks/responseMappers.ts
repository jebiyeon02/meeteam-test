import { JOB_OPTIONS, type MockMember } from './fixtures';
import type { ProjectRecord } from './projectContract';
import { getLikes, getSessionMember } from './storage';

export function toProjectRecruitments(project: ProjectRecord) {
  return project.recruitments.map((item) => {
    const field = JOB_OPTIONS.fields.find((field) => field.code === item.jobFieldCode);
    return {
      jobFieldCode: item.jobFieldCode,
      jobFieldName: field?.name ?? '',
      jobPositionName:
        field?.positions.find((position) => position.id === item.jobPositionId)?.name ?? '',
      recruitmentCount: item.count,
      currentCount: item.currentCount ?? 0,
      isClosed: item.closed ?? false,
      closed: item.closed ?? false,
      techStacks:
        field?.techStacks
          .filter((skill) => item.techStackIds.includes(skill.id))
          .map((skill) => skill.name) ?? [],
    };
  });
}
export function toProjectCard(project: ProjectRecord) {
  return {
    projectId: project.id,
    projectName: project.name,
    categoryCode: project.category,
    categoryName: {
      CAPSTONE: '캡스톤',
      CREATIVE_SEMESTER: '창의학기제',
      CLUB: '동아리',
      ETC: '기타',
    }[project.category],
    platformName: { WEB: '웹', IOS: 'iOS', ANDROID: '안드로이드' }[project.platform],
    imageUrl: project.imageUrl,
    endDate: project.deadline,
    creatorName: project.leaderName,
    creatorImageUrl: null,
    currentCount: project.currentMembers,
    recruitmentCount: 1 + project.recruitments.reduce((total, item) => total + item.count, 0),
    recruitments: toProjectRecruitments(project),
  };
}
export function toProjectDetail(project: ProjectRecord) {
  const member = getSessionMember();
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    projectCategory: project.category,
    platformCategory: project.platform,
    imageUrl: project.imageUrl,
    recruitmentStatus: project.recruitmentStatus ?? 'RECRUITING',
    recruitmentDeadlineType: project.closeWhenFull ? 'RECRUITMENT_COMPLETED' : 'END_DATE',
    startDate: project.createdAt.slice(0, 10),
    endDate: project.deadline,
    githubRepositoryUrl: project.githubUrl,
    communicationChannelUrl: project.communicationUrl,
    leader: {
      id: project.leaderId,
      name: project.leaderName,
      profileImageUrl: null,
      jobPositions: [],
      techStacks: [],
    },
    members: [
      { memberId: project.leaderId, name: project.leaderName, profileImageUrl: null },
      ...(project.memberIds ?? [])
        .filter((id) => id !== project.leaderId)
        .map((memberId) => ({ memberId, name: '팀원', profileImageUrl: null })),
    ],
    recruitments: toProjectRecruitments(project),
    likeCount: getLikes().filter((item) => item.endsWith(`:${project.id}`)).length,
    isLiked: member ? getLikes().includes(`${member.memberId}:${project.id}`) : false,
    isLeader: project.leaderId === member?.memberId,
  };
}
export function toMemberCard(member: MockMember) {
  const field = JOB_OPTIONS.fields.find((field) =>
    field.positions.some((item) => member.jobPositionIds.includes(item.id)),
  );
  return {
    memberId: member.memberId,
    name: member.name,
    profileImageUrl: member.profileImageUrl,
    jobFieldName: field?.name ?? null,
    projectCount: member.projectCount,
    techStacks: JOB_OPTIONS.fields
      .flatMap((field) => field.techStacks)
      .filter((item) => member.techStackIds.includes(item.id))
      .map((item, index) => ({ ...item, displayOrder: index + 1 })),
  };
}
export function pageResponse<T>(items: T[], params: URLSearchParams) {
  const page = Math.max(0, Number(params.get('page')) || 0);
  const size = Math.min(100, Math.max(1, Number(params.get('size')) || 10));
  const content = items.slice(page * size, (page + 1) * size);
  return {
    content,
    number: page,
    size,
    numberOfElements: content.length,
    totalElements: items.length,
    first: page === 0,
    last: (page + 1) * size >= items.length,
    empty: !content.length,
  };
}
