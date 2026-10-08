import { apiRequest, authenticatedRequest } from '@/components/features/auth/authApi';
import { getJobOptions } from '@/components/features/profile/profileApi';

const IS_MOCK_MODE = process.env.NEXT_PUBLIC_API_MODE === 'mock';

export const PROJECT_API_PATH = '/api/v1/projects';

export const PROJECT_CATEGORIES = [
  { code: 'CAPSTONE', label: '캡스톤' },
  { code: 'CREATIVE_SEMESTER', label: '창의학기제' },
  { code: 'CLUB', label: '동아리' },
  { code: 'ETC', label: '기타' },
] as const;

export const PROJECT_PLATFORMS = [
  { code: 'WEB', label: '웹' },
  { code: 'IOS', label: 'iOS' },
  { code: 'ANDROID', label: '안드로이드' },
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number]['code'];
export type ProjectPlatform = (typeof PROJECT_PLATFORMS)[number]['code'];

export type ProjectRecruitment = {
  jobFieldCode: string;
  jobPositionId: number;
  count: number;
  techStackIds: number[];
  jobFieldName?: string;
  jobPositionName?: string;
  techStackNames?: string[];
  currentCount?: number;
  closed?: boolean;
};

export type ProjectCreateRequest = {
  name: string;
  category: ProjectCategory;
  platform: ProjectPlatform;
  description: string;
  githubUrl: string;
  communicationUrl: string;
  leaderPositionId: number;
  recruitments: ProjectRecruitment[];
  deadline: string | null;
  closeWhenFull: boolean;
};

export type ProjectRecord = ProjectCreateRequest & {
  id: number;
  leaderId: number;
  leaderName: string;
  imageUrl: string | null;
  createdAt: string;
  currentMembers: number;
  memberIds?: number[];
  isLeader?: boolean;
  isLiked?: boolean;
  likeCount?: number;
  recruitmentStatus?: 'RECRUITING' | 'CLOSED' | 'SUSPENDED';
};

export type ProjectSearchFilters = {
  keyword: string;
  category: ProjectCategory | '';
  jobField: string;
  techStackId: number | null;
  sort: 'latest' | 'deadline' | 'name';
};

export type ProjectSearchResult = {
  content: ProjectRecord[];
  totalElements: number | null;
  page: number;
  hasMore: boolean;
};

export function todayLocalDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function buildProjectCreateRequest(values: ProjectCreateRequest): ProjectCreateRequest {
  return {
    ...values,
    name: values.name.trim(),
    description: values.description.trim(),
    githubUrl: values.githubUrl.trim(),
    communicationUrl: values.communicationUrl.trim(),
    deadline: values.closeWhenFull ? null : values.deadline,
    recruitments: values.recruitments.map((item) => ({
      ...item,
      techStackIds: [...new Set(item.techStackIds)],
    })),
  };
}

export function categoryLabel(code: ProjectCategory) {
  return PROJECT_CATEGORIES.find((item) => item.code === code)?.label ?? '기타';
}

export function platformLabel(code: ProjectPlatform) {
  return PROJECT_PLATFORMS.find((item) => item.code === code)?.label ?? '웹';
}

type BackendProjectCard = {
  projectId: number;
  projectName: string;
  categoryName: string;
  categoryCode: string | null;
  platformName: string | null;
  imageUrl: string | null;
  endDate: string | null;
  creatorName: string;
  currentCount: number;
  recruitmentCount: number;
  recruitments?: {
    jobFieldName: string;
    jobPositionName: string;
    currentCount: number;
    recruitmentCount: number;
    techStacks: string[];
    closed: boolean;
  }[];
};

function categoryFromBackend(code: string | null, label?: string): ProjectCategory {
  if (PROJECT_CATEGORIES.some((item) => item.code === code)) return code as ProjectCategory;
  return PROJECT_CATEGORIES.find((item) => item.label === label)?.code ?? 'ETC';
}

function platformFromBackend(value: string | null): ProjectPlatform {
  if (PROJECT_PLATFORMS.some((item) => item.code === value)) return value as ProjectPlatform;
  return PROJECT_PLATFORMS.find((item) => item.label === value)?.code ?? 'WEB';
}

function fieldCodeFromName(value: string) {
  const names: Record<string, string> = {
    프론트: 'FRONTEND',
    프론트엔드: 'FRONTEND',
    백엔드: 'BACKEND',
    디자인: 'DESIGN',
    기획: 'PLANNING',
    AI: 'AI',
    '인프라/운영': 'INFRA_OPERATION',
  };
  return names[value] ?? value;
}

function mapBackendCard(card: BackendProjectCard): ProjectRecord {
  return {
    id: card.projectId,
    name: card.projectName,
    category: categoryFromBackend(card.categoryCode, card.categoryName),
    platform: platformFromBackend(card.platformName),
    description: '',
    githubUrl: '',
    communicationUrl: '',
    leaderPositionId: 0,
    recruitments: (card.recruitments ?? []).map((item) => ({
      jobFieldCode: fieldCodeFromName(item.jobFieldName),
      jobPositionId: 0,
      count: item.recruitmentCount,
      techStackIds: [],
      jobFieldName: item.jobFieldName,
      jobPositionName: item.jobPositionName,
      techStackNames: item.techStacks ?? [],
      currentCount: item.currentCount,
      closed: item.closed,
    })),
    deadline: card.endDate,
    closeWhenFull: !card.endDate,
    leaderId: 0,
    leaderName: card.creatorName,
    imageUrl: card.imageUrl,
    createdAt: '',
    currentMembers: card.currentCount,
    recruitmentStatus:
      card.recruitments?.length && card.recruitments.every((item) => item.closed)
        ? 'CLOSED'
        : 'RECRUITING',
  };
}

export async function createProject(request: ProjectCreateRequest, image: File | null) {
  const body = new FormData();
  if (IS_MOCK_MODE) {
    body.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }));
  } else {
    const options = await getJobOptions();
    const positions = options.fields.flatMap((field) => field.positions);
    const leaderCode = positions.find((position) => position.id === request.leaderPositionId)?.code;
    if (!leaderCode) throw new Error('리더의 직무 정보를 확인할 수 없습니다.');
    const recruitments = request.recruitments.map((item) => {
      const field = options.fields.find((option) => option.code === item.jobFieldCode);
      const position = field?.positions.find((option) => option.id === item.jobPositionId);
      if (!position) throw new Error('모집 직무 정보를 확인할 수 없습니다.');
      return {
        jobFieldCode: item.jobFieldCode,
        jobPositionCode: position.code,
        recruitmentCount: item.count,
        techStackIds: item.techStackIds,
      };
    });
    const payload = {
      projectName: request.name,
      projectCategory: request.category,
      platformCategory: request.platform,
      description: request.description,
      ...(request.githubUrl ? { githubRepositoryUrl: request.githubUrl } : {}),
      ...(request.communicationUrl ? { communicationChannelUrl: request.communicationUrl } : {}),
      creatorJobPositionCode: leaderCode,
      recruitments,
      recruitmentDeadlineType: request.closeWhenFull ? 'RECRUITMENT_COMPLETED' : 'END_DATE',
      ...(request.closeWhenFull ? {} : { endDate: request.deadline }),
    };
    body.append('request', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
  }
  if (image) body.append('file', image);
  return authenticatedRequest<{ id: number }>(PROJECT_API_PATH, { method: 'POST', body });
}

export async function searchProjects(
  filters: ProjectSearchFilters,
  page: number,
  size: number,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort: IS_MOCK_MODE ? filters.sort : filters.sort === 'deadline' ? 'DEADLINE' : 'LATEST',
  });
  if (filters.keyword.trim().length >= (IS_MOCK_MODE ? 1 : 2))
    params.set('keyword', filters.keyword.trim());
  if (filters.category) params.set(IS_MOCK_MODE ? 'category' : 'projectCategory', filters.category);
  if (filters.jobField) params.set('jobField', filters.jobField);
  if (IS_MOCK_MODE && filters.techStackId) params.set('techStackId', String(filters.techStackId));
  if (IS_MOCK_MODE)
    return apiRequest<ProjectSearchResult>(`${PROJECT_API_PATH}/search?${params}`, { signal });
  const result = await apiRequest<{ content: BackendProjectCard[]; number: number; last: boolean }>(
    `${PROJECT_API_PATH}/search?${params}`,
    { signal },
  );
  return {
    content: result.content.map(mapBackendCard),
    totalElements: null,
    page: result.number,
    hasMore: !result.last,
  };
}

export async function getProject(id: number): Promise<ProjectRecord> {
  if (IS_MOCK_MODE) return apiRequest<ProjectRecord>(`${PROJECT_API_PATH}/${id}`);
  const detail = await apiRequest<{
    id: number;
    name: string;
    description: string;
    projectCategory: string;
    platformCategory: string;
    imageUrl: string | null;
    recruitmentStatus: ProjectRecord['recruitmentStatus'];
    recruitmentDeadlineType: 'END_DATE' | 'RECRUITMENT_COMPLETED';
    endDate: string | null;
    githubRepositoryUrl: string | null;
    communicationChannelUrl: string | null;
    leader: { id: number; name: string };
    members?: { memberId: number }[];
    isLeader?: boolean;
    isLiked?: boolean;
    likeCount?: number;
    recruitments: {
      jobFieldCode: string;
      jobFieldName: string;
      jobPositionName: string;
      recruitmentCount: number;
      currentCount: number;
      isClosed: boolean;
      techStacks: string[];
    }[];
  }>(`${PROJECT_API_PATH}/${id}`);
  return {
    id: detail.id,
    name: detail.name,
    description: detail.description,
    category: categoryFromBackend(detail.projectCategory),
    platform: platformFromBackend(detail.platformCategory),
    imageUrl: detail.imageUrl,
    recruitmentStatus: detail.recruitmentStatus,
    deadline: detail.endDate,
    closeWhenFull: detail.recruitmentDeadlineType === 'RECRUITMENT_COMPLETED',
    githubUrl: detail.githubRepositoryUrl ?? '',
    communicationUrl: detail.communicationChannelUrl ?? '',
    leaderId: detail.leader.id,
    leaderName: detail.leader.name,
    memberIds: detail.members?.map((member) => member.memberId) ?? [],
    isLeader: detail.isLeader,
    isLiked: detail.isLiked,
    likeCount: detail.likeCount,
    leaderPositionId: 0,
    recruitments: detail.recruitments.map((item) => ({
      jobFieldCode: item.jobFieldCode,
      jobPositionId: 0,
      count: item.recruitmentCount,
      techStackIds: [],
      jobFieldName: item.jobFieldName,
      jobPositionName: item.jobPositionName,
      techStackNames: item.techStacks ?? [],
      currentCount: item.currentCount,
      closed: item.isClosed,
    })),
    currentMembers:
      detail.members?.length ??
      1 + detail.recruitments.reduce((count, item) => count + item.currentCount, 0),
    createdAt: '',
  };
}
