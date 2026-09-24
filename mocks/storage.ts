import { INITIAL_MEMBERS, type MockMember } from '@/mocks/fixtures';

const MEMBERS_KEY = 'meeteam-week4-members';
const SESSION_KEY = 'meeteam-week4-session';

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
