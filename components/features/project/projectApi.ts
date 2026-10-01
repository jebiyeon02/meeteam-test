import { apiRequest, authenticatedRequest } from '@/components/features/auth/authApi';

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
  totalElements: number;
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

export function createProject(request: ProjectCreateRequest, image: File | null) {
  const body = new FormData();
  body.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }));
  if (image) body.append('file', image);
  return authenticatedRequest<{ id: number }>(PROJECT_API_PATH, { method: 'POST', body });
}

export function searchProjects(
  filters: ProjectSearchFilters,
  page: number,
  size: number,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort: filters.sort,
  });
  if (filters.keyword.trim()) params.set('keyword', filters.keyword.trim());
  if (filters.category) params.set('category', filters.category);
  if (filters.jobField) params.set('jobField', filters.jobField);
  if (filters.techStackId) params.set('techStackId', String(filters.techStackId));
  return apiRequest<ProjectSearchResult>(`${PROJECT_API_PATH}/search?${params}`, { signal });
}

export function getProject(id: number) {
  return apiRequest<ProjectRecord>(`${PROJECT_API_PATH}/${id}`);
}
