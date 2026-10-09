'use client';

import { create } from 'zustand';
import {
  getProjectCategoryLabel,
  PROJECT_CATEGORIES,
  RELEASE_PLATFORMS,
} from '@/components/features/project/constants';
import { formatJobRole } from '@/components/shared/jobRoleFormat';
import type {
  ProjectApplicant,
  ProjectFormValues,
  ProjectMember,
  ProjectRecord,
  ProjectStatus,
} from '@/types/project';

type ProjectState = {
  projectsById: Record<string, ProjectRecord>;
  getProject: (projectId: string) => ProjectRecord | null;
  getProjects: () => ProjectRecord[];
  createProject: (values: ProjectFormValues) => string;
  updateProjectStatus: (projectId: string, status: ProjectStatus) => void;
  updateProject: (projectId: string, values: ProjectFormValues) => void;
  removeMember: (projectId: string, memberId: number) => void;
  approveApplicant: (projectId: string, applicantId: number) => void;
  rejectApplicant: (projectId: string, applicantId: number) => void;
};

const toMember = (applicant: ProjectApplicant): ProjectMember => ({
  id: applicant.id,
  name: applicant.name,
  role: formatJobRole(applicant.position, applicant.specialty),
  avatarUrl: applicant.avatarUrl,
});

function buildSummary(description: string) {
  return description.length > 56 ? `${description.slice(0, 56).trim()}...` : description;
}

function createProjectRecord(input: ProjectRecord): ProjectRecord {
  return {
    ...input,
    title: input.projectName,
    summary: input.summary || buildSummary(input.description),
  };
}

function buildProjectFromForm(id: string, values: ProjectFormValues): ProjectRecord {
  const category =
    PROJECT_CATEGORIES.find((item) => item.id === values.categoryId) ?? PROJECT_CATEGORIES[0];
  const leaderRole = values.myInterest.major || 'Project Lead';

  return createProjectRecord({
    id,
    title: values.projectName,
    subtitle: '프로젝트 통합 관리',
    status: 'recruiting',
    projectName: values.projectName,
    githubUrl: values.githubUrl,
    communicationUrl: values.communicationUrl,
    categoryId: values.categoryId || category.id,
    description: values.description,
    releasePlatforms:
      values.releasePlatforms.length > 0 ? values.releasePlatforms : [RELEASE_PLATFORMS[0]],
    myInterest: values.myInterest,
    recruitInterests: values.recruitInterests,
    recruitTechStacks: values.recruitTechStacks,
    recruitDeadline: values.recruitDeadline,
    isRecruitUntilComplete: values.isRecruitUntilComplete,
    targetMemberCount: values.recruitInterests.reduce((sum, item) => sum + item.count, 1) + 1,
    members: [
      {
        id: Number(`${id}1`),
        name: '프로젝트 리더',
        role: leaderRole,
        avatarUrl: '',
        isLeader: true,
      },
    ],
    applicants: [],
    summary: buildSummary(
      values.description || `${getProjectCategoryLabel(category.id)} 프로젝트입니다.`,
    ),
    coverImageUrl: '',
    createdAt: new Date().toISOString().slice(0, 10),
    leaderRole,
  });
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projectsById: {},
  getProject: (projectId) => get().projectsById[projectId] ?? null,
  getProjects: () =>
    Object.values(get().projectsById).sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt),
    ),
  createProject: (values) => {
    const nextId = String(
      Math.max(0, ...Object.keys(get().projectsById).map((id) => Number(id))) + 1,
    );

    set((state) => ({
      projectsById: {
        ...state.projectsById,
        [nextId]: buildProjectFromForm(nextId, values),
      },
    }));

    return nextId;
  },
  updateProjectStatus: (projectId, status) =>
    set((state) => {
      const project = state.projectsById[projectId];
      if (!project) return state;

      return {
        projectsById: {
          ...state.projectsById,
          [projectId]: { ...project, status },
        },
      };
    }),
  updateProject: (projectId, values) =>
    set((state) => {
      const project = state.projectsById[projectId];
      if (!project) return state;

      return {
        projectsById: {
          ...state.projectsById,
          [projectId]: {
            ...project,
            ...values,
            title: values.projectName,
            summary: buildSummary(values.description),
          },
        },
      };
    }),
  removeMember: (projectId, memberId) =>
    set((state) => {
      const project = state.projectsById[projectId];
      if (!project) return state;

      return {
        projectsById: {
          ...state.projectsById,
          [projectId]: {
            ...project,
            members: project.members.filter((member) => member.id !== memberId),
          },
        },
      };
    }),
  approveApplicant: (projectId, applicantId) =>
    set((state) => {
      const project = state.projectsById[projectId];
      if (!project) return state;

      const applicant = project.applicants.find((item) => item.id === applicantId);
      if (!applicant || applicant.status !== 'pending') return state;

      return {
        projectsById: {
          ...state.projectsById,
          [projectId]: {
            ...project,
            members: [...project.members, toMember(applicant)],
            applicants: project.applicants.map((item) =>
              item.id === applicantId ? { ...item, status: 'approved' } : item,
            ),
          },
        },
      };
    }),
  rejectApplicant: (projectId, applicantId) =>
    set((state) => {
      const project = state.projectsById[projectId];
      if (!project) return state;

      return {
        projectsById: {
          ...state.projectsById,
          [projectId]: {
            ...project,
            applicants: project.applicants.map((item) =>
              item.id === applicantId ? { ...item, status: 'rejected' } : item,
            ),
          },
        },
      };
    }),
}));
