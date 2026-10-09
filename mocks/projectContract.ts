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

export function todayLocalDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
export function isRecruitmentOpen(item: ProjectRecruitment) {
  return !item.closed && (item.currentCount ?? 0) < item.count;
}
export function isProjectOpen(project: ProjectRecord) {
  return (
    (!project.recruitmentStatus || project.recruitmentStatus === 'RECRUITING') &&
    (!project.deadline || project.deadline.slice(0, 10) >= todayLocalDate()) &&
    project.recruitments.some(isRecruitmentOpen)
  );
}
export type AppliedProject = {
  applicationId: number;
  projectId: number;
  projectName: string;
  projectImageUrl: string | null;
  jobPositionId: number;
  jobPositionName: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  statusDisplayName: string;
  appliedAt: string;
};
