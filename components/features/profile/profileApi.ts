import { apiRequest, authenticatedRequest } from '@/components/features/auth/authApi';

export const PROFILE_API_PATH = '/api/v1/members';

export type JobOption = {
  fields: {
    code: string;
    name: string;
    positions: { id: number; code: string; name: string }[];
    techStacks: { id: number; name: string }[];
  }[];
};

export type ProfileProjectCard = {
  id: number;
  title: string;
  category: string;
  leader: string;
  currentMembers: number;
  maxMembers: number;
};

export type MyProfileResponse = {
  memberId: number;
  name: string;
  birthDate: string | null;
  gender: 'MALE' | 'FEMALE' | null;
  email: string;
  githubUrl: string | null;
  blogUrl: string | null;
  representativePosition: string | null;
  skills: string[];
  isParticipating: boolean | null;
  projectCount: number;
  introduce: string | null;
  profileImageUrl: string | null;
  projectCards: ProfileProjectCard[];
};

export type MemberDetailResponse = {
  memberId: number;
  profileImageUrl: string | null;
  name: string;
  age: number | null;
  gender: 'MALE' | 'FEMALE' | null;
  representativePosition: string | null;
  jobPositions: string[];
  email: string | null;
  githubUrl: string | null;
  blogUrl: string | null;
  isParticipating: boolean | null;
  introduce: string | null;
  participatedProjectCount: number;
  skills: string[];
  participatedProjects: ProfileProjectCard[];
};

export type MemberSummary = Pick<
  MemberDetailResponse,
  'memberId' | 'profileImageUrl' | 'name' | 'representativePosition' | 'isParticipating' | 'skills'
> & { fieldCategory: string; participatedProjectCount: number };

export type ProfileUpdateRequest = {
  name: string;
  age: number;
  gender: 'MALE' | 'FEMALE';
  jobPositionIds: number[];
  techStacks: { id: number; displayOrder: number }[];
  isParticipating: boolean;
  introduction: string;
  githubUrl: string;
  blogUrl: string;
};

export function getMyProfile() {
  return authenticatedRequest<MyProfileResponse>(`${PROFILE_API_PATH}/me`);
}

export function getMemberDetail(memberId: number) {
  return apiRequest<MemberDetailResponse>(`${PROFILE_API_PATH}/${memberId}`);
}

export function getMemberSummaries() {
  return apiRequest<MemberSummary[]>(PROFILE_API_PATH);
}

export function getJobOptions() {
  return apiRequest<JobOption>('/api/v1/jobs/options');
}

export function updateMyProfile(request: ProfileUpdateRequest, image?: File | null) {
  const formData = new FormData();
  formData.append('memberInfo', new Blob([JSON.stringify(request)], { type: 'application/json' }));
  if (image) formData.append('profileImage', image);
  return authenticatedRequest<{
    memberId: number;
    name: string;
    message: string;
    profileImageUrl: string | null;
  }>(`${PROFILE_API_PATH}/me`, { method: 'PUT', body: formData });
}
