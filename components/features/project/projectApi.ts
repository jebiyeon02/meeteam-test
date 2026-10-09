import type { ApiEnvelope, JobFieldOption } from '@/types/auth';
import type {
  ProjectFormValues,
  ProjectApplicant,
  ProjectMember,
  ProjectRecord,
  ProjectRecruitmentStatus,
} from '@/types/project';

import { API_BASE_URL, apiFetch } from '@/components/features/auth/apiClient';
import { createApiError } from '@/components/features/auth/authError';
import { findTechStackByName } from '@/components/features/auth/jobOptionUtils';
import { extractApiData, normalizeUrl } from '@/components/features/auth/signupTransform';
import {
  findProjectJobField,
  findProjectJobPosition,
} from '@/components/features/project/projectJobOptions';
import { formatJobRole } from '@/components/shared/jobRoleFormat';

type BackendProjectCreateResponse = {
  id: number;
  title: string;
  createdAt: string;
};

type BackendProjectDetailResponse = {
  id: number;
  name: string;
  description: string;
  projectCategory: 'CAPSTONE' | 'CREATIVE_SEMESTER' | 'CLUB' | 'ETC';
  platformCategory: 'IOS' | 'ANDROID' | 'WEB';
  imageUrl: string | null;
  recruitmentStatus: 'RECRUITING' | 'CLOSED' | 'SUSPENDED';
  recruitmentDeadlineType: 'END_DATE' | 'RECRUITMENT_COMPLETED';
  startDate: string | null;
  endDate: string | null;
  githubRepositoryUrl: string | null;
  communicationChannelUrl: string | null;
  leader: {
    id: number;
    name: string;
    profileImageUrl: string | null;
    jobPositions: Array<{
      jobFieldCode: string;
      jobFieldName: string;
      jobPositionName: string;
    }>;
    techStacks: string[];
  };
  members?: Array<{
    memberId?: number;
    id?: number;
    name: string;
    profileImageUrl: string | null;
    jobFieldName?: string | null;
    jobPositionName?: string | null;
    isLeader?: boolean;
    leader?: boolean;
  }>;
  recruitments: Array<{
    jobFieldCode: string;
    jobFieldName: string;
    jobPositionName: string;
    recruitmentCount: number;
    currentCount: number;
    isClosed: boolean;
    techStacks: string[];
  }>;
  likeCount: number;
  isLiked: boolean;
  isLeader: boolean;
};

type BackendTeamManagementResponse = {
  currentMemberCount: number;
  totalRecruitmentCount: number;
  pendingApplicationCount: number;
  members: Array<{
    memberId: number;
    name: string;
    profileImageUrl: string | null;
    jobFieldName: string | null;
    jobPositionName: string | null;
    isLeader?: boolean;
    leader?: boolean;
  }>;
};

type BackendProjectEditPrefillResponse = {
  projectId: number;
  name: string;
  description: string;
  projectCategory: BackendProjectDetailResponse['projectCategory'];
  projectCategoryName: string;
  platformCategory: BackendProjectDetailResponse['platformCategory'];
  recruitmentDeadlineType?: BackendProjectDetailResponse['recruitmentDeadlineType'];
  githubRepositoryUrl: string | null;
  communicationChannelUrl: string | null;
  endDate: string | null;
  imageUrl: string | null;
  leaderJobFieldName: string;
  leaderJobPositionName: string;
  recruitments: Array<{
    recruitmentStateId: number;
    jobFieldCode: string;
    jobFieldName: string;
    jobPositionCode: string;
    jobPositionName: string;
    recruitmentCount: number;
    currentCount: number;
    pendingApplicationCount: number;
    techStackIds: number[];
    techStackNames: string[];
    deletable: boolean;
    notDeletableReason: string | null;
    minRecruitmentCount: number;
  }>;
  editable: boolean;
  notEditableReason: string | null;
};

type BackendApplicationStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CANCELLED'
  | '대기중'
  | '승인됨'
  | '거절됨'
  | '취소됨';

type BackendApplicationResponse = {
  applicationId: number;
  projectId: number;
  applicantId: number;
  status: BackendApplicationStatus;
};

type BackendProjectApplicationListResponse = {
  applicationId: number;
  applicantId: number;
  applicantName: string;
  profileImageUrl: string | null;
  applicantEmail: string;
  jobFieldName: string;
  jobPositionName: string;
  motivation: string;
  status: BackendApplicationStatus;
  appliedAt: string;
  currentCount: number;
  recruitmentCount: number;
  isRecruitmentFull: boolean;
};

type BackendApplicationDetailResponse = {
  applicationId: number;
  applicantId: number;
  applicantName: string;
  profileImageUrl: string | null;
  age: number | null;
  gender: 'MALE' | 'FEMALE' | string | null;
  applicantEmail: string;
  jobPosition: {
    jobPositionId: number;
    jobPositionName: string;
    jobFieldId: number;
    jobFieldName: string;
  };
  techStacks?: BackendApplicantTechStackResponse[];
  motivation: string;
  status: BackendApplicationStatus;
};

type BackendApplicantTechStackResponse = {
  id: number;
  name: string;
  displayOrder: number;
};

type BackendApplicationDecisionResponse = {
  applicationId: number;
  projectId: number | null;
  applicantId: number | null;
  decision: BackendApplicationStatus;
};

type BackendProjectDeleteResponse = {
  projectId: number;
  deleted?: boolean;
};

type BackendApplicationCancelResponse = {
  applicationId: number;
  projectId?: number;
  projectName?: string;
  status?: BackendApplicationStatus;
};

type BackendLeaveProjectResponse = {
  projectId: number;
  memberId: number;
};

type BackendProjectLikeStatusResponse = {
  isLiked?: boolean;
  liked?: boolean;
};

type BackendProjectLikeToggleResponse = {
  projectId: number;
  liked: boolean;
  likeCount: number;
};

type BackendAppliedProjectResponse = {
  applicationId: number;
  projectId: number;
  projectName: string;
  projectImageUrl: string | null;
  jobPositionId: number;
  jobPositionName: string;
  status: BackendApplicationStatus;
  statusDisplayName: string;
  appliedAt: string;
};

type BackendApplicationPageResponse = {
  applicant: {
    profileImageUrl: string | null;
    name: string;
    jobFieldNames: string[];
    jobPositionNames: string[];
    age: number | null;
    gender: string | null;
    email: string;
    techStacks?: BackendApplicantTechStackResponse[];
    profileSummary: string | null;
  };
  recruitments: Array<{
    id: number;
    jobFieldName: string;
    jobPositionName: string;
    techStacks: string[];
    isClosed: boolean;
  }>;
};

type ProjectCreateRequestPayload = {
  projectName: string;
  githubRepositoryUrl?: string;
  communicationChannelUrl?: string;
  projectCategory: string;
  description: string;
  platformCategory: string;
  creatorJobPositionCode: string;
  recruitments: Array<{
    jobFieldCode: string;
    jobPositionCode: string;
    recruitmentCount: number;
    techStackIds: number[];
  }>;
  recruitmentDeadlineType: 'END_DATE' | 'RECRUITMENT_COMPLETED';
  endDate?: string;
};

type ProjectEditRequestPayload = {
  name: string;
  description: string;
  projectCategory: string;
  platformCategory: string;
  githubRepositoryUrl?: string;
  communicationChannelUrl?: string;
  recruitmentDeadlineType: 'END_DATE' | 'RECRUITMENT_COMPLETED';
  endDate?: string;
  leaderJobPositionCode: string;
  recruitments: Array<{
    recruitmentStateId?: number | null;
    jobFieldCode: string;
    jobPositionCode: string;
    recruitmentCount: number;
    techStackIds: number[];
  }>;
  confirmDeletePositionsWithPendingApplicants: boolean;
};

export type ProjectApplicationRequestPayload = {
  jobPositionCode: string;
  motivation: string;
};

export type ProjectApplicationDecision = 'ACCEPTED' | 'REJECTED';

export type ProjectApplicationResult = {
  applicationId: number;
  projectId: number;
  applicantId: number;
  status: ProjectApplicant['status'];
};

export type AppliedProject = {
  applicationId: number;
  projectId: number;
  projectName: string;
  projectImageUrl: string;
  jobPositionId: number;
  jobPositionName: string;
  status: ProjectApplicant['status'];
  statusDisplayName: string;
  appliedAt: string;
};

export type ProjectApplicationPage = {
  applicant: {
    profileImageUrl: string;
    name: string;
    jobFieldNames: string[];
    jobPositionNames: string[];
    age: number | null;
    gender: string | null;
    email: string;
    techStacks: BackendApplicantTechStackResponse[];
    profileSummary: string | null;
  };
  recruitments: Array<{
    id: number;
    jobFieldName: string;
    jobPositionName: string;
    techStacks: string[];
    isClosed: boolean;
  }>;
};

export type ProjectApplicationPolicy = {
  blockedStatuses: Array<'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED'>;
  reapplyableStatuses: Array<'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED'>;
};

export type ProjectEditPrefill = {
  values: ProjectFormValues;
  coverImageUrl: string;
  editable: boolean;
  notEditableReason: string | null;
};

export type ProjectTeamManagement = {
  currentMemberCount: number;
  totalRecruitmentCount: number;
  pendingApplicationCount: number;
  members: ProjectMember[];
};

async function readEnvelope<T>(response: Response, fallbackMessage: string) {
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok) {
    throw createApiError(response, payload, fallbackMessage);
  }

  if (!payload) {
    throw new Error('응답 형식을 해석할 수 없습니다.');
  }

  return extractApiData(payload);
}

async function readApplicationPageEnvelope(response: Response) {
  const payload = (await response
    .json()
    .catch(() => null)) as ApiEnvelope<BackendApplicationPageResponse> | null;
  const fallbackMessage = '지원 정보를 불러오지 못했습니다.';

  if (!response.ok) {
    if (response.status === 401) {
      throw createApiError(response, payload, fallbackMessage);
    }

    throw new Error(typeof payload?.message === 'string' ? payload.message : fallbackMessage);
  }

  if (!payload) {
    throw new Error('응답 형식을 해석할 수 없습니다.');
  }

  return extractApiData(payload);
}

function buildSummary(description: string) {
  return description.length > 56 ? `${description.slice(0, 56).trim()}...` : description;
}

function mapApplicationStatus(status: BackendApplicationStatus): ProjectApplicant['status'] {
  switch (status) {
    case 'ACCEPTED':
    case '승인됨':
      return 'approved';
    case 'REJECTED':
    case '거절됨':
      return 'rejected';
    case 'CANCELLED':
    case '취소됨':
      return 'cancelled';
    case 'PENDING':
    case '대기중':
    default:
      return 'pending';
  }
}

function formatAppliedAt(appliedAt: string | null | undefined) {
  if (!appliedAt) {
    return '지원일 미확인';
  }

  const [datePart] = appliedAt.split('T');
  const formattedDate = datePart?.replaceAll('-', '.');

  return formattedDate ? `${formattedDate} 지원` : '지원일 미확인';
}

function mapApplicationListItem(
  application: BackendProjectApplicationListResponse,
): ProjectApplicant {
  return {
    id: application.applicationId,
    applicantId: application.applicantId,
    name: application.applicantName,
    position: application.jobFieldName,
    specialty: application.jobPositionName,
    appliedAt: formatAppliedAt(application.appliedAt),
    email: application.applicantEmail,
    introduction: application.motivation,
    avatarUrl: application.profileImageUrl ?? '',
    status: mapApplicationStatus(application.status),
    currentCount: application.currentCount,
    recruitmentCount: application.recruitmentCount,
    isRecruitmentFull: application.isRecruitmentFull,
  };
}

function mapApplicationDetail(application: BackendApplicationDetailResponse): ProjectApplicant {
  return {
    id: application.applicationId,
    applicantId: application.applicantId,
    name: application.applicantName,
    position: application.jobPosition.jobFieldName,
    specialty: application.jobPosition.jobPositionName,
    appliedAt: '지원일 미확인',
    email: application.applicantEmail,
    introduction: application.motivation,
    avatarUrl: application.profileImageUrl ?? '',
    status: mapApplicationStatus(application.status),
    age: application.age,
    gender: application.gender,
    techStacks: mapApplicantTechStacks(application.techStacks),
  };
}

function mapApplicantTechStacks(techStacks: BackendApplicantTechStackResponse[] = []) {
  return [...techStacks].sort((left, right) => left.displayOrder - right.displayOrder);
}

function mapCategoryIdToApiValue(categoryId: ProjectFormValues['categoryId']) {
  switch (categoryId) {
    case 'capstone':
      return 'CAPSTONE';
    case 'creative-semester':
      return 'CREATIVE_SEMESTER';
    case 'club':
      return 'CLUB';
    case 'other':
      return 'ETC';
    default:
      throw new Error('프로젝트 카테고리를 다시 선택해 주세요.');
  }
}

function mapCategoryApiValueToId(category: BackendProjectDetailResponse['projectCategory']) {
  switch (category) {
    case 'CAPSTONE':
      return 'capstone';
    case 'CREATIVE_SEMESTER':
      return 'creative-semester';
    case 'CLUB':
      return 'club';
    case 'ETC':
      return 'other';
  }
}

function mapPlatformToApiValue(
  platform: ProjectFormValues['releasePlatforms'][number] | undefined,
) {
  switch (platform) {
    case '웹':
      return 'WEB';
    case 'iOS':
      return 'IOS';
    case '안드로이드':
      return 'ANDROID';
    default:
      throw new Error('출시 플랫폼을 다시 선택해 주세요.');
  }
}

function mapPlatformApiValueToLabel(platform: BackendProjectDetailResponse['platformCategory']) {
  switch (platform) {
    case 'WEB':
      return '웹';
    case 'IOS':
      return 'iOS';
    case 'ANDROID':
      return '안드로이드';
  }
}

function isRecruitmentCompletedDeadline(project: {
  recruitmentDeadlineType?: BackendProjectDetailResponse['recruitmentDeadlineType'];
  endDate: string | null;
}) {
  return (
    project.recruitmentDeadlineType === 'RECRUITMENT_COMPLETED' ||
    (!project.recruitmentDeadlineType && project.endDate === null)
  );
}

function assertRecruitmentEditableCount(interest: ProjectFormValues['recruitInterests'][number]) {
  if (interest.count < Math.max(1, interest.minRecruitmentCount ?? 1)) {
    throw new Error('현재 승인된 인원보다 적게 설정할 수 없습니다.');
  }
}

function assertUniqueRecruitment(
  recruitmentKeys: Set<string>,
  fieldCode: string,
  positionCode: string,
) {
  const recruitmentKey = `${fieldCode}:${positionCode}`;

  if (recruitmentKeys.has(recruitmentKey)) {
    throw new Error('같은 모집 분야는 한 번만 추가할 수 있어요.');
  }

  recruitmentKeys.add(recruitmentKey);
}

export function buildProjectCreatePayload(values: ProjectFormValues, jobFields: JobFieldOption[]) {
  const creatorField = findProjectJobField(jobFields, values.myInterest.major);

  if (!creatorField) {
    throw new Error('나의 분야 정보를 다시 선택해 주세요.');
  }

  const creatorPosition = findProjectJobPosition(creatorField, values.myInterest.minor);

  if (!creatorPosition) {
    throw new Error('나의 상세 분야 정보를 다시 선택해 주세요.');
  }

  const recruitmentKeys = new Set<string>();
  const recruitments = values.recruitInterests.map((interest) => {
    const field = findProjectJobField(jobFields, interest.major);

    if (!field) {
      throw new Error('모집 분야 정보를 다시 선택해 주세요.');
    }

    const position = findProjectJobPosition(field, interest.minor);

    if (!position) {
      throw new Error('모집 상세 분야 정보를 다시 선택해 주세요.');
    }

    assertUniqueRecruitment(recruitmentKeys, field.code, position.code);

    const techStackNames = values.recruitTechStacks[`${interest.major} - ${interest.minor}`] ?? [];
    const techStackIds = techStackNames.map((techStackName) => {
      const techStack = findTechStackByName(jobFields, techStackName);

      if (!techStack) {
        throw new Error('선택한 기술 스택을 다시 확인해 주세요.');
      }

      return techStack.id;
    });

    return {
      jobFieldCode: field.code,
      jobPositionCode: position.code,
      recruitmentCount: interest.count,
      techStackIds,
    };
  });

  return {
    projectName: values.projectName.trim(),
    githubRepositoryUrl: normalizeUrl(values.githubUrl),
    communicationChannelUrl: normalizeUrl(values.communicationUrl),
    projectCategory: mapCategoryIdToApiValue(values.categoryId),
    description: values.description.trim(),
    platformCategory: mapPlatformToApiValue(values.releasePlatforms[0]),
    creatorJobPositionCode: creatorPosition.code,
    recruitments,
    recruitmentDeadlineType: values.isRecruitUntilComplete ? 'RECRUITMENT_COMPLETED' : 'END_DATE',
    endDate: values.isRecruitUntilComplete ? undefined : values.recruitDeadline,
  } satisfies ProjectCreateRequestPayload;
}

function buildRecruitmentRequests(values: ProjectFormValues, jobFields: JobFieldOption[]) {
  const recruitmentKeys = new Set<string>();

  return values.recruitInterests.map((interest) => {
    const field = findProjectJobField(jobFields, interest.major);

    if (!field) {
      throw new Error('모집 분야 정보를 다시 선택해 주세요.');
    }

    const position = findProjectJobPosition(field, interest.minor);

    if (!position) {
      throw new Error('모집 상세 분야 정보를 다시 선택해 주세요.');
    }

    assertUniqueRecruitment(recruitmentKeys, field.code, position.code);
    assertRecruitmentEditableCount(interest);

    const techStackNames = values.recruitTechStacks[`${interest.major} - ${interest.minor}`] ?? [];
    const techStackIds = techStackNames.map((techStackName) => {
      const techStack = findTechStackByName(jobFields, techStackName);

      if (!techStack) {
        throw new Error('선택한 기술 스택을 다시 확인해 주세요.');
      }

      return techStack.id;
    });

    return {
      recruitmentStateId: interest.recruitmentStateId,
      jobFieldCode: field.code,
      jobPositionCode: position.code,
      recruitmentCount: interest.count,
      techStackIds,
    };
  });
}

export function buildProjectEditPayload(
  values: ProjectFormValues,
  jobFields: JobFieldOption[],
  options: { confirmDeletePositionsWithPendingApplicants?: boolean } = {},
) {
  const leaderField = findProjectJobField(jobFields, values.myInterest.major);

  if (!leaderField) {
    throw new Error('리더 분야 정보를 다시 선택해 주세요.');
  }

  const leaderPosition = findProjectJobPosition(leaderField, values.myInterest.minor);

  if (!leaderPosition) {
    throw new Error('리더 상세 분야 정보를 다시 선택해 주세요.');
  }

  if (!values.isRecruitUntilComplete && !values.recruitDeadline) {
    throw new Error('프로젝트 마감일을 선택해 주세요.');
  }

  return {
    name: values.projectName.trim(),
    description: values.description.trim(),
    projectCategory: mapCategoryIdToApiValue(values.categoryId),
    platformCategory: mapPlatformToApiValue(values.releasePlatforms[0]),
    githubRepositoryUrl: normalizeUrl(values.githubUrl),
    communicationChannelUrl: normalizeUrl(values.communicationUrl),
    recruitmentDeadlineType: values.isRecruitUntilComplete ? 'RECRUITMENT_COMPLETED' : 'END_DATE',
    endDate: values.isRecruitUntilComplete ? undefined : values.recruitDeadline,
    leaderJobPositionCode: leaderPosition.code,
    recruitments: buildRecruitmentRequests(values, jobFields),
    confirmDeletePositionsWithPendingApplicants:
      options.confirmDeletePositionsWithPendingApplicants ?? false,
  } satisfies ProjectEditRequestPayload;
}

export async function createProject(payload: ProjectCreateRequestPayload, file?: File | null) {
  const formData = new FormData();

  formData.append('request', new Blob([JSON.stringify(payload)], { type: 'application/json' }));

  if (file) {
    formData.append('file', file);
  }

  const response = await apiFetch(`${API_BASE_URL}/api/v1/projects`, {
    method: 'POST',
    body: formData,
  });

  return readEnvelope<BackendProjectCreateResponse>(
    response,
    '프로젝트 등록 중 오류가 발생했습니다.',
  );
}

export async function updateProject(
  projectId: string | number,
  payload: ProjectEditRequestPayload,
  file?: File | null,
) {
  const formData = new FormData();

  formData.append('request', new Blob([JSON.stringify(payload)], { type: 'application/json' }));

  if (file) {
    formData.append('file', file);
  }

  const response = await apiFetch(`${API_BASE_URL}/api/v1/projects/${projectId}`, {
    method: 'PUT',
    body: formData,
  });

  return readEnvelope<{
    projectId: number;
    name: string;
    recruitmentStatus: 'RECRUITING' | 'CLOSED' | 'SUSPENDED';
    autoRejectedApplicantCount: number;
  }>(response, '프로젝트 수정 중 오류가 발생했습니다.');
}

export async function deleteProject(projectId: string | number) {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/projects/${projectId}`, {
    method: 'DELETE',
  });

  return readEnvelope<BackendProjectDeleteResponse>(
    response,
    '프로젝트 삭제 중 오류가 발생했습니다.',
  );
}

export async function applyToProject(
  projectId: string | number,
  payload: ProjectApplicationRequestPayload,
): Promise<ProjectApplicationResult> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/projects/${projectId}/application`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const application = await readEnvelope<BackendApplicationResponse>(
    response,
    '프로젝트 지원 중 오류가 발생했습니다.',
  );

  return {
    applicationId: application.applicationId,
    projectId: application.projectId,
    applicantId: application.applicantId,
    status: mapApplicationStatus(application.status),
  };
}

export async function fetchProjectApplicationPage(
  projectId: string | number,
): Promise<ProjectApplicationPage> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/projects/${projectId}/application`, {
    method: 'GET',
    cache: 'no-store',
  });

  const page = await readApplicationPageEnvelope(response);

  return {
    applicant: {
      ...page.applicant,
      profileImageUrl: page.applicant.profileImageUrl ?? '',
      techStacks: mapApplicantTechStacks(page.applicant.techStacks),
    },
    recruitments: page.recruitments,
  };
}

export async function fetchProjectApplications(
  projectId: string | number,
): Promise<ProjectApplicant[]> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/projects/${projectId}/applications`, {
    method: 'GET',
    cache: 'no-store',
  });

  const applications = await readEnvelope<BackendProjectApplicationListResponse[]>(
    response,
    '지원자 목록을 불러오지 못했습니다.',
  );

  return applications.map(mapApplicationListItem);
}

export async function fetchProjectApplicationDetail(
  projectId: string | number,
  applicationId: string | number,
): Promise<ProjectApplicant> {
  const response = await apiFetch(
    `${API_BASE_URL}/api/v1/projects/${projectId}/applications/${applicationId}`,
    {
      method: 'GET',
      cache: 'no-store',
    },
  );

  const application = await readEnvelope<BackendApplicationDetailResponse>(
    response,
    '지원서 상세 정보를 불러오지 못했습니다.',
  );

  return mapApplicationDetail(application);
}

export async function cancelProjectApplication(applicationId: string | number) {
  const response = await apiFetch(
    `${API_BASE_URL}/api/v1/members/me/applications/${applicationId}`,
    {
      method: 'DELETE',
    },
  );

  return readEnvelope<BackendApplicationCancelResponse>(
    response,
    '지원 취소 중 오류가 발생했습니다.',
  );
}

export async function decideProjectApplication(
  projectId: string | number,
  applicationId: string | number,
  decision: ProjectApplicationDecision,
) {
  const response = await apiFetch(
    `${API_BASE_URL}/api/v1/projects/${projectId}/applications/${applicationId}/decision`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ decision }),
    },
  );

  const result = await readEnvelope<BackendApplicationDecisionResponse>(
    response,
    '지원자 처리 중 오류가 발생했습니다.',
  );

  return {
    applicationId: result.applicationId,
    projectId: result.projectId,
    applicantId: result.applicantId,
    decision: mapApplicationStatus(result.decision),
  };
}

export async function leaveProject(projectId: string | number) {
  const response = await apiFetch(`${API_BASE_URL}/api/project-members/withdraw`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ projectId: Number(projectId) }),
  });

  return readEnvelope<BackendLeaveProjectResponse>(
    response,
    '프로젝트 탈퇴 중 오류가 발생했습니다.',
  );
}

export async function fetchProjectApplicationPolicy(): Promise<ProjectApplicationPolicy> {
  return {
    blockedStatuses: ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED'],
    reapplyableStatuses: [],
  };
}

export async function fetchMyProjectApplications(): Promise<AppliedProject[]> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/members/me/applications`, {
    method: 'GET',
    cache: 'no-store',
  });

  const applications = await readEnvelope<BackendAppliedProjectResponse[]>(
    response,
    '내가 지원한 프로젝트를 불러오지 못했습니다.',
  );

  return applications.map((application) => ({
    applicationId: application.applicationId,
    projectId: application.projectId,
    projectName: application.projectName,
    projectImageUrl: application.projectImageUrl ?? '',
    jobPositionId: application.jobPositionId,
    jobPositionName: application.jobPositionName,
    status: mapApplicationStatus(application.status),
    statusDisplayName: application.statusDisplayName,
    appliedAt: application.appliedAt,
  }));
}

export async function toggleProjectRecruitmentStatus(projectId: string | number) {
  const response = await apiFetch(
    `${API_BASE_URL}/api/v1/projects/${projectId}/recruitment/toggle`,
    {
      method: 'POST',
    },
  );

  return readEnvelope<{
    projectId: number;
    recruitmentStatus: ProjectRecruitmentStatus;
    isRecruiting: boolean;
  }>(response, '모집 상태 변경 중 오류가 발생했습니다.');
}

export async function fetchProjectLikeStatus(projectId: string | number) {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/project/like/${projectId}`, {
    method: 'GET',
    cache: 'no-store',
  });

  const status = await readEnvelope<BackendProjectLikeStatusResponse>(
    response,
    '좋아요 상태를 불러오지 못했습니다.',
  );

  return {
    isLiked: status.isLiked ?? status.liked ?? false,
  };
}

export async function toggleProjectLike(projectId: string | number) {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/project/like/${projectId}`, {
    method: 'POST',
  });

  return readEnvelope<BackendProjectLikeToggleResponse>(
    response,
    '좋아요 처리 중 오류가 발생했습니다.',
  );
}

export async function fetchProjectTeamManagement(
  projectId: string | number,
): Promise<ProjectTeamManagement> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/projects/${projectId}/team`, {
    method: 'GET',
    cache: 'no-store',
  });

  const team = await readEnvelope<BackendTeamManagementResponse>(
    response,
    '팀원 관리 정보를 불러오지 못했습니다.',
  );

  return {
    currentMemberCount: team.currentMemberCount,
    totalRecruitmentCount: team.totalRecruitmentCount,
    pendingApplicationCount: team.pendingApplicationCount,
    members: team.members.map((member) => ({
      id: member.memberId,
      name: member.name,
      role: formatJobRole(member.jobFieldName, member.jobPositionName),
      avatarUrl: member.profileImageUrl ?? '',
      isLeader: member.isLeader ?? member.leader ?? false,
    })),
  };
}

export async function expelProjectMember(projectId: string | number, memberId: string | number) {
  const response = await apiFetch(
    `${API_BASE_URL}/api/v1/projects/${projectId}/members/${memberId}`,
    {
      method: 'DELETE',
    },
  );

  return readEnvelope<{
    projectId: number;
    expelledMemberId: number;
    expelledMemberName: string;
  }>(response, '팀원 방출 중 오류가 발생했습니다.');
}

export async function fetchProjectEditPrefill(
  projectId: string | number,
): Promise<ProjectEditPrefill> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/projects/${projectId}/edit`, {
    method: 'GET',
    cache: 'no-store',
  });

  const project = await readEnvelope<BackendProjectEditPrefillResponse>(
    response,
    '프로젝트 수정 정보를 불러오지 못했습니다.',
  );

  const recruitInterests = project.recruitments.map((recruitment) => ({
    major: recruitment.jobFieldName,
    minor: recruitment.jobPositionName,
    count: recruitment.recruitmentCount,
    recruitmentStateId: recruitment.recruitmentStateId,
    currentCount: recruitment.currentCount,
    pendingApplicationCount: recruitment.pendingApplicationCount,
    minRecruitmentCount: recruitment.minRecruitmentCount,
    deletable: recruitment.deletable,
    notDeletableReason: recruitment.notDeletableReason,
  }));
  const recruitTechStacks = Object.fromEntries(
    project.recruitments.map((recruitment) => [
      `${recruitment.jobFieldName} - ${recruitment.jobPositionName}`,
      recruitment.techStackNames,
    ]),
  );

  const isRecruitUntilComplete = isRecruitmentCompletedDeadline(project);

  return {
    values: {
      projectName: project.name,
      githubUrl: project.githubRepositoryUrl ?? '',
      communicationUrl: project.communicationChannelUrl ?? '',
      categoryId: mapCategoryApiValueToId(project.projectCategory),
      description: project.description,
      releasePlatforms: [mapPlatformApiValueToLabel(project.platformCategory)],
      myInterest: {
        major: project.leaderJobFieldName,
        minor: project.leaderJobPositionName,
      },
      recruitInterests,
      recruitTechStacks,
      recruitDeadline: project.endDate ?? '',
      isRecruitUntilComplete,
      coverImage: null,
    },
    coverImageUrl: project.imageUrl ?? '',
    editable: project.editable,
    notEditableReason: project.notEditableReason,
  };
}

export async function fetchProjectDetail(
  projectId: string | number,
  baseUrl = API_BASE_URL,
): Promise<ProjectRecord> {
  const response = await apiFetch(`${baseUrl}/api/v1/projects/${projectId}`, {
    method: 'GET',
    cache: 'no-store',
  });

  const project = await readEnvelope<BackendProjectDetailResponse>(
    response,
    '프로젝트 상세 정보를 불러오지 못했습니다.',
  );

  const leaderPosition = project.leader.jobPositions[0];
  const recruitInterests = project.recruitments.map((recruitment) => ({
    major: recruitment.jobFieldName,
    minor: recruitment.jobPositionName,
    count: recruitment.recruitmentCount,
  }));
  const recruitTechStacks = Object.fromEntries(
    project.recruitments.map((recruitment) => [
      `${recruitment.jobFieldName} - ${recruitment.jobPositionName}`,
      recruitment.techStacks,
    ]),
  );
  const detailMembers =
    project.members?.map((member) => ({
      id: member.memberId ?? member.id ?? project.leader.id,
      name: member.name,
      role: formatJobRole(member.jobFieldName, member.jobPositionName),
      avatarUrl: member.profileImageUrl ?? '',
      isLeader: member.isLeader ?? member.leader ?? member.memberId === project.leader.id,
    })) ?? [];
  const members =
    detailMembers.length > 0
      ? detailMembers
      : [
          {
            id: project.leader.id,
            name: project.leader.name,
            role: leaderPosition?.jobPositionName ?? leaderPosition?.jobFieldName ?? 'Project Lead',
            avatarUrl: project.leader.profileImageUrl ?? '',
            isLeader: true,
          },
        ];

  return {
    id: String(project.id),
    title: project.name,
    subtitle: '프로젝트 상세',
    status: project.recruitmentStatus === 'RECRUITING' ? 'recruiting' : 'closed',
    projectName: project.name,
    githubUrl: project.githubRepositoryUrl ?? '',
    communicationUrl: project.communicationChannelUrl ?? '',
    categoryId: mapCategoryApiValueToId(project.projectCategory),
    description: project.description,
    releasePlatforms: [mapPlatformApiValueToLabel(project.platformCategory)],
    myInterest: {
      major: leaderPosition?.jobFieldName ?? '',
      minor: leaderPosition?.jobPositionName ?? '',
    },
    recruitInterests,
    recruitTechStacks,
    recruitDeadline: project.endDate ?? '',
    isRecruitUntilComplete: project.recruitmentDeadlineType === 'RECRUITMENT_COMPLETED',
    targetMemberCount:
      project.recruitments.reduce((sum, recruitment) => sum + recruitment.recruitmentCount, 0) + 1,
    members,
    applicants: [],
    summary: buildSummary(project.description),
    coverImageUrl: project.imageUrl ?? '',
    createdAt: project.startDate ?? project.endDate ?? '',
    leaderRole: leaderPosition?.jobPositionName ?? leaderPosition?.jobFieldName ?? 'Project Lead',
    recruitmentStatus: project.recruitmentStatus,
    leaderProfileId: project.leader.id,
    isLeader: project.isLeader,
    leaderTechStacks: project.leader.techStacks,
    likeCount: project.likeCount,
    isLiked: project.isLiked,
    recruitmentDetails: project.recruitments.map((recruitment, index) => ({
      id: `${project.id}-${index + 1}`,
      jobFieldCode: recruitment.jobFieldCode,
      jobFieldName: recruitment.jobFieldName,
      jobPositionName: recruitment.jobPositionName,
      recruitmentCount: recruitment.recruitmentCount,
      currentCount: recruitment.currentCount,
      isClosed: recruitment.isClosed,
      techStacks: recruitment.techStacks,
    })),
  };
}
