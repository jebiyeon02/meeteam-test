import { apiRequest, authenticatedRequest } from '@/components/features/auth/authApi';

const IS_MOCK_MODE = process.env.NEXT_PUBLIC_API_MODE === 'mock';

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

type BackendProjectCard = {
  projectId: number;
  projectName: string;
  categoryName: string;
  creatorName: string;
  currentCount: number;
  recruitmentCount: number;
};

function mapProjectCards(
  cards: BackendProjectCard[] | ProfileProjectCard[] | undefined,
): ProfileProjectCard[] {
  return (cards ?? []).map((card) =>
    'projectId' in card
      ? {
          id: card.projectId,
          title: card.projectName,
          category: card.categoryName,
          leader: card.creatorName,
          currentMembers: card.currentCount,
          maxMembers: card.recruitmentCount,
        }
      : card,
  );
}

export async function getMyProfile(): Promise<MyProfileResponse> {
  const profile = await authenticatedRequest<
    MyProfileResponse & { projectCards?: BackendProjectCard[] }
  >(`${PROFILE_API_PATH}/me`);
  return { ...profile, projectCards: mapProjectCards(profile.projectCards) };
}

export async function getMemberDetail(memberId: number): Promise<MemberDetailResponse> {
  const profile = await apiRequest<
    MemberDetailResponse & { participatedProjects?: BackendProjectCard[] }
  >(`${PROFILE_API_PATH}/${memberId}`);
  return { ...profile, participatedProjects: mapProjectCards(profile.participatedProjects) };
}

export async function getMemberSummaries(): Promise<MemberSummary[]> {
  if (IS_MOCK_MODE) return apiRequest<MemberSummary[]>(PROFILE_API_PATH);
  type BackendMemberCard = {
    memberId: number;
    profileImageUrl: string | null;
    name: string;
    jobFieldName: string | null;
    projectCount: number;
    techStacks: { id: number; name: string }[];
  };
  const members: MemberSummary[] = [];
  let page = 0;
  let last = false;
  while (!last) {
    const result = await apiRequest<{ content: BackendMemberCard[]; last: boolean }>(
      `${PROFILE_API_PATH}/search?page=${page}&size=100`,
    );
    members.push(
      ...result.content.map((member) => ({
        memberId: member.memberId,
        profileImageUrl: member.profileImageUrl,
        name: member.name,
        representativePosition: member.jobFieldName,
        fieldCategory: member.jobFieldName ?? '기타',
        isParticipating: null,
        participatedProjectCount: member.projectCount,
        skills: member.techStacks?.map((skill) => skill.name) ?? [],
      })),
    );
    last = result.last || result.content.length === 0;
    page += 1;
  }
  return members;
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
