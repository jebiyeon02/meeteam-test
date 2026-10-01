import { INITIAL_MEMBERS, INITIAL_PROJECTS, type MockMember } from '@/mocks/fixtures';
import type { ProjectRecord } from '@/components/features/project/projectApi';

const MEMBERS_KEY = 'meeteam-week4-members';
const SESSION_KEY = 'meeteam-week4-session';
const PROJECTS_KEY = 'meeteam-week5-projects';

export function getProjects(): ProjectRecord[] {
  try {
    const stored = localStorage.getItem(PROJECTS_KEY);
    if (!stored) return INITIAL_PROJECTS;
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as ProjectRecord[]) : INITIAL_PROJECTS;
  } catch {
    return INITIAL_PROJECTS;
  }
}

export function saveProject(project: ProjectRecord) {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify([project, ...getProjects()]));
}

export function getMembers(): MockMember[] {
  try {
    const stored = localStorage.getItem(MEMBERS_KEY);
    if (!stored) return INITIAL_MEMBERS;
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as MockMember[]) : INITIAL_MEMBERS;
  } catch {
    return INITIAL_MEMBERS;
  }
}

export function saveMember(member: MockMember) {
  const members = getMembers().filter((item) => item.memberId !== member.memberId);
  localStorage.setItem(MEMBERS_KEY, JSON.stringify([...members, member]));
}

export function getSessionMember() {
  const memberId = Number(localStorage.getItem(SESSION_KEY));
  return getMembers().find((member) => member.memberId === memberId) ?? null;
}

export function setSession(memberId: number) {
  localStorage.setItem(SESSION_KEY, String(memberId));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
