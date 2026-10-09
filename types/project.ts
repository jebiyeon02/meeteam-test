import type { Interest } from './auth';

export type RecruitInterest = Interest & {
  count: number;
  recruitmentStateId?: number | null;
  currentCount?: number;
  pendingApplicationCount?: number;
  minRecruitmentCount?: number;
  deletable?: boolean;
  notDeletableReason?: string | null;
};

export type ProjectStatus = 'recruiting' | 'closed';
export type ProjectRecruitmentStatus = 'RECRUITING' | 'CLOSED' | 'SUSPENDED';

export type ProjectCategoryId = 'capstone' | 'creative-semester' | 'club' | 'other';

export type ReleasePlatform = '웹' | 'iOS' | '안드로이드';

export type ProjectMember = {
  id: number;
  name: string;
  role: string;
  avatarUrl: string;
  isLeader?: boolean;
};

export type ProjectApplicantStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export type ProjectApplicantTechStack = {
  id: number;
  name: string;
  displayOrder: number;
};

export type ProjectApplicant = {
  id: number;
  applicantId?: number;
  name: string;
  position: string;
  specialty: string;
  appliedAt: string;
  email: string;
  introduction: string;
  avatarUrl: string;
  status: ProjectApplicantStatus;
  age?: number | null;
  gender?: 'MALE' | 'FEMALE' | string | null;
  techStacks?: ProjectApplicantTechStack[];
  currentCount?: number;
  recruitmentCount?: number;
  isRecruitmentFull?: boolean;
};

export type ProjectFormValues = {
  projectName: string;
  githubUrl: string;
  communicationUrl: string;
  categoryId: ProjectCategoryId | '';
  description: string;
  releasePlatforms: ReleasePlatform[];
  myInterest: Interest;
  recruitInterests: RecruitInterest[];
  recruitTechStacks: Record<string, string[]>;
  recruitDeadline: string;
  isRecruitUntilComplete: boolean;
  coverImage?: File | null;
};

export type ProjectRecruitmentDetail = {
  id: string;
  jobFieldCode: string;
  jobFieldName: string;
  jobPositionName: string;
  recruitmentCount: number;
  currentCount: number;
  isClosed: boolean;
  techStacks: string[];
};

export type ManagedProject = ProjectFormValues & {
  id: string;
  title: string;
  subtitle: string;
  status: ProjectStatus;
  targetMemberCount: number;
  members: ProjectMember[];
  applicants: ProjectApplicant[];
};

export type ProjectRecord = ManagedProject & {
  summary: string;
  coverImageUrl: string;
  createdAt: string;
  leaderRole: string;
  recruitmentStatus?: ProjectRecruitmentStatus;
  leaderProfileId?: number;
  isLeader?: boolean;
  leaderTechStacks?: string[];
  likeCount?: number;
  isLiked?: boolean;
  recruitmentDetails?: ProjectRecruitmentDetail[];
};
