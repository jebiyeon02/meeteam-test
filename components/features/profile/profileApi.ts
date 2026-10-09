import type { ApiEnvelope, JobFieldOption } from '@/types/auth';

import { API_BASE_URL, apiFetch } from '@/components/features/auth/apiClient';
import { createApiError } from '@/components/features/auth/authError';
import { extractApiData, normalizeUrl } from '@/components/features/auth/signupTransform';
import { profileFormSchema, profileImageSchema } from './schema';

export type ProfileGender = 'MALE' | 'FEMALE';

export interface ProfileProjectCard {
  projectId: number;
  projectName: string;
  categoryName: string;
  imageUrl: string | null;
  creatorName: string;
  creatorImageUrl: string | null;
  currentCount: number;
  recruitmentCount: number;
}

export interface MemberProfileResponse {
  name: string;
  memberId: number;
  birthDate?: string | null;
  age?: number | null;
  gender: ProfileGender;
  email: string;
  githubUrl: string | null;
  blogUrl: string | null;
  representativePosition: string | null;
  representativePositionEn?: string | null;
  skills: string[];
  isParticipating: boolean;
  projectCount?: number;
  introduce: string | null;
  profileImageUrl: string | null;
  profileImageName?: string | null;
  projectCards: ProfileProjectCard[];
}

interface MemberDetailResponse {
  memberId: number;
  profileImageUrl: string | null;
  name: string;
  age: number | null;
  gender: ProfileGender;
  representativePosition: string | null;
  jobPositions: string[];
  email: string;
  githubUrl: string | null;
  blogUrl: string | null;
  isParticipating: boolean;
  introduce: string | null;
  participatedProjectCount: number;
  participatedProjects: ProfileProjectCard[];
  skills: string[];
}

export interface UpdateMemberProfilePayload {
  name: string;
  age: number;
  gender: ProfileGender;
  jobPositionIds: number[];
  techStacks: Array<{
    id: number;
    displayOrder: number;
  }>;
  isParticipating: boolean;
  introduction?: string;
  githubUrl?: string;
  blogUrl?: string;
  profileImage?: File | null;
}

async function readEnvelope<T>(response: Response) {
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok) {
    throw createApiError(response, payload, '프로필 정보를 처리하는 중 오류가 발생했습니다.');
  }

  if (!payload) {
    throw new Error('응답 형식을 해석할 수 없습니다.');
  }

  return extractApiData(payload);
}

export async function fetchMyProfile() {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/members/me`, {
    method: 'GET',
    cache: 'no-store',
  });

  return readEnvelope<MemberProfileResponse>(response);
}

export async function fetchMemberProfile(memberId: number) {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/members/${memberId}`, {
    method: 'GET',
    cache: 'no-store',
  });

  return mapMemberDetailToProfile(await readEnvelope<MemberDetailResponse>(response));
}

export async function updateMyProfile(payload: UpdateMemberProfilePayload) {
  const parsed = profileFormSchema.safeParse({
    ...payload,
    age: String(payload.age),
    techStackIds: payload.techStacks.map((skill) => skill.id),
    introduction: payload.introduction ?? '',
    githubUrl: normalizeUrl(payload.githubUrl ?? '') ?? '',
    blogUrl: normalizeUrl(payload.blogUrl ?? '') ?? '',
  });
  if (!parsed.success)
    throw new Error(parsed.error.issues[0]?.message ?? '프로필 입력값을 확인해 주세요.');
  if (payload.profileImage) {
    const image = profileImageSchema.safeParse(payload.profileImage);
    if (!image.success)
      throw new Error(image.error.issues[0]?.message ?? '프로필 이미지를 확인해 주세요.');
  }
  const formData = new FormData();

  formData.append(
    'memberInfo',
    new Blob(
      [
        JSON.stringify({
          name: payload.name.trim(),
          age: payload.age,
          gender: payload.gender,
          jobPositionIds: payload.jobPositionIds,
          techStacks: payload.techStacks,
          isParticipating: payload.isParticipating,
          introduction: payload.introduction?.trim() ? payload.introduction : '',
          githubUrl: normalizeUrl(payload.githubUrl ?? ''),
          blogUrl: normalizeUrl(payload.blogUrl ?? ''),
        }),
      ],
      { type: 'application/json' },
    ),
  );

  if (payload.profileImage) {
    formData.append('profileImage', payload.profileImage);
  }

  const response = await apiFetch(`${API_BASE_URL}/api/v1/members/me`, {
    method: 'PUT',
    body: formData,
  });

  return readEnvelope<{
    memberId: number;
    name: string;
    message: string;
    profileImageUrl: string | null;
  }>(response);
}

export function findFieldByName(jobFields: JobFieldOption[], fieldName: string) {
  return jobFields.find((field) => field.name === fieldName);
}

export function findPositionByName(
  jobFields: JobFieldOption[],
  fieldName: string,
  positionName: string,
) {
  return findFieldByName(jobFields, fieldName)?.positions.find(
    (position) => position.name === positionName,
  );
}

function mapMemberDetailToProfile(detail: MemberDetailResponse): MemberProfileResponse {
  return {
    name: detail.name,
    memberId: detail.memberId,
    birthDate: null,
    age: detail.age,
    gender: detail.gender,
    email: detail.email,
    githubUrl: detail.githubUrl,
    blogUrl: detail.blogUrl,
    representativePosition: detail.representativePosition,
    representativePositionEn: detail.representativePosition,
    skills: detail.skills,
    isParticipating: detail.isParticipating,
    projectCount: detail.participatedProjectCount,
    introduce: detail.introduce,
    profileImageUrl: detail.profileImageUrl,
    profileImageName: null,
    projectCards: detail.participatedProjects,
  };
}
