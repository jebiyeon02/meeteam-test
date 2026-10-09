import type { ApiEnvelope } from '@/types/auth';
import type { Teammate } from '@/types/team';

import { API_BASE_URL, apiFetch } from '@/components/features/auth/apiClient';
import { createApiError } from '@/components/features/auth/authError';
import { extractApiData } from '@/components/features/auth/signupTransform';

interface MemberCardResponse {
  memberId: number;
  name: string;
  profileImageUrl: string | null;
  jobFieldName: string | null;
  projectCount: number;
  projectExperienceCount?: number;
  techStacks: MemberTechStackResponse[];
}

interface MemberTechStackResponse {
  id: number;
  name: string;
  displayOrder: number;
}

interface MemberPageResponse {
  content: MemberCardResponse[];
  last: boolean;
  number: number;
  size: number;
  empty: boolean;
  totalElements?: number;
}

export interface FetchTeammatesParams {
  name?: string;
  jobFieldId?: number;
  techStackNames?: string[];
  sort?: TeammateSort;
  page?: number;
  size?: number;
}

export type TeammateSort = 'projectCount' | 'name';

export interface FetchTeammatesResult {
  teammates: Teammate[];
  totalCount: number;
  page: number;
  last: boolean;
}

export async function fetchTeammates({
  name = '',
  jobFieldId,
  techStackNames = [],
  sort = 'projectCount',
  page = 0,
  size = 15,
}: FetchTeammatesParams = {}): Promise<FetchTeammatesResult> {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  const trimmedName = name.trim();
  if (trimmedName) {
    params.set('name', trimmedName);
  }

  if (typeof jobFieldId === 'number') {
    params.set('jobFieldId', String(jobFieldId));
  }

  techStackNames.forEach((techStackName) => {
    params.append('techStackNames', techStackName);
  });

  params.append('sort', mapTeammateSort(sort));

  const response = await apiFetch(`${API_BASE_URL}/api/v1/members/search?${params.toString()}`, {
    method: 'GET',
    cache: 'no-store',
  });

  const payload = (await response
    .json()
    .catch(() => null)) as ApiEnvelope<MemberPageResponse> | null;

  if (!response.ok) {
    throw createApiError(response, payload, '팀원 목록을 불러오지 못했습니다.');
  }

  if (!payload) {
    throw new Error('응답 형식을 해석할 수 없습니다.');
  }

  const result = extractApiData(payload);

  return {
    teammates: result.content.map(mapTeammateCard),
    totalCount: result.totalElements ?? result.content.length,
    page: result.number,
    last: result.last || result.empty,
  };
}

function mapTeammateSort(sort: TeammateSort) {
  switch (sort) {
    case 'name':
      return 'realName,asc';
    case 'projectCount':
    default:
      return 'projectCount,desc';
  }
}

export async function fetchAllTeammates() {
  const teammates: Teammate[] = [];
  const pageSize = 100;
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const result = await fetchTeammates({ page, size: pageSize });

    teammates.push(...result.teammates);
    hasMore = !result.last && result.teammates.length > 0;
    page += 1;
  }

  return teammates;
}

function mapTeammateCard(member: MemberCardResponse): Teammate {
  return {
    id: member.memberId,
    name: member.name,
    role: mapJobFieldToRole(member.jobFieldName),
    experienceCount: member.projectCount ?? member.projectExperienceCount ?? 0,
    skills: mapTopTechStackNames(member.techStacks),
    imageUrl: member.profileImageUrl ?? '',
  };
}

function mapTopTechStackNames(techStacks: MemberTechStackResponse[]) {
  return [...techStacks]
    .sort((left, right) => left.displayOrder - right.displayOrder)
    .slice(0, 3)
    .map((techStack) => techStack.name);
}

function mapJobFieldToRole(jobFieldName: string | null): Teammate['role'] {
  switch (jobFieldName) {
    case '프론트':
      return '프론트엔드';
    case '백엔드':
      return '백엔드';
    case '디자인':
      return '디자이너';
    case '기획':
      return 'PM/기획';
    case 'AI':
      return 'AI';
    case '인프라/운영':
      return '인프라/운영';
    default:
      return '기타';
  }
}
