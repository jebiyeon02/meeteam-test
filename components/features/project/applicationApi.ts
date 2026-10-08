import { ApiError, apiRequest, authenticatedRequest } from '@/components/features/auth/authApi';
import type { ProjectRecord, ProjectRecruitment } from './projectApi';
import { todayLocalDate } from './projectApi';
import type { ProjectApplicationRequest } from './apply/schema';

export type ApplicationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
export type AppliedProject = {
  applicationId: number;
  projectId: number;
  projectName: string;
  projectImageUrl: string | null;
  jobPositionId: number;
  jobPositionName: string;
  status: ApplicationStatus;
  statusDisplayName: string;
  appliedAt: string;
};
export type ApplicationDetail = {
  applicationId: number;
  applicantId: number;
  applicantName: string;
  applicantEmail: string;
  jobPosition: {
    jobPositionId: number;
    jobPositionName: string;
    jobFieldId: number;
    jobFieldName: string;
  };
  motivation: string;
  status: ApplicationStatus | '대기중' | '승인됨' | '거절됨' | '취소됨';
};
export type ApplicationPage = {
  applicant: {
    name: string;
    email: string;
    techStacks: { id: number; name: string; displayOrder: number }[];
  };
  recruitments: {
    id: number;
    jobFieldName: string;
    jobPositionName: string;
    techStacks: string[];
    isClosed: boolean;
  }[];
};

export function applicationStatusLabel(status: string) {
  return (
    (
      { PENDING: '대기중', ACCEPTED: '승인됨', REJECTED: '거절됨', CANCELLED: '취소됨' } as Record<
        string,
        string
      >
    )[status] ?? status
  );
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
export function applicationErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return '로그인이 만료되었습니다. 다시 로그인해 주세요.';
    if (error.status >= 500)
      return '서버에 연결할 수 없습니다. 입력한 내용은 유지됩니다. 잠시 후 다시 시도해 주세요.';
    return error.message;
  }
  return '네트워크 연결을 확인한 뒤 다시 시도해 주세요. 입력한 내용은 유지됩니다.';
}
export function getMyApplications() {
  return authenticatedRequest<AppliedProject[]>('/api/v1/members/me/applications');
}
export function getApplicationPage(projectId: number) {
  return authenticatedRequest<ApplicationPage>(`/api/v1/projects/${projectId}/application`);
}
export function submitApplication(projectId: number, request: ProjectApplicationRequest) {
  return authenticatedRequest<{
    applicationId: number;
    projectId: number;
    applicantId: number;
    status: ApplicationStatus;
  }>(`/api/v1/projects/${projectId}/application`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
}
export function getApplicationDetail(projectId: number, applicationId: number) {
  return authenticatedRequest<ApplicationDetail>(
    `/api/v1/projects/${projectId}/applications/${applicationId}`,
  );
}
export function cancelApplication(applicationId: number) {
  return authenticatedRequest(`/api/v1/members/me/applications/${applicationId}`, {
    method: 'DELETE',
  });
}
export function getProjectLike(projectId: number) {
  return authenticatedRequest<{ isLiked?: boolean; liked?: boolean }>(
    `/api/v1/project/like/${projectId}`,
  );
}
export function toggleProjectLike(projectId: number) {
  return authenticatedRequest<{ liked: boolean; likeCount: number }>(
    `/api/v1/project/like/${projectId}`,
    { method: 'POST' },
  );
}
export type ProjectQna = {
  qnaId: number;
  questionerName: string;
  question: string | null;
  isSecret: boolean;
  answers: { answerId: number; writerName: string; content: string }[];
};
export function getProjectQnas(projectId: number, page: number) {
  return apiRequest<{ content: ProjectQna[]; last: boolean; number: number }>(
    `/api/v1/projects/${projectId}/qna?page=${page}&size=10&sort=createdAt,desc`,
  );
}
