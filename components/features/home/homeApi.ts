import { apiRequest } from '@/components/features/auth/authApi';
import { getMemberSummaries, type MemberSummary } from '@/components/features/profile/profileApi';

export async function getHomeMembers(): Promise<MemberSummary[]> {
  if (process.env.NEXT_PUBLIC_API_MODE === 'mock') return (await getMemberSummaries()).slice(0, 4);
  const result = await apiRequest<{
    content: {
      memberId: number;
      name: string;
      profileImageUrl: string | null;
      jobFieldName: string | null;
      projectCount: number;
      techStacks: { id: number; name: string; displayOrder: number }[];
    }[];
  }>('/api/v1/main/members?page=0&size=4&sort=createdAt,desc');
  return result.content.map((member) => ({
    memberId: member.memberId,
    name: member.name,
    profileImageUrl: member.profileImageUrl,
    representativePosition: member.jobFieldName,
    fieldCategory: member.jobFieldName ?? '기타',
    isParticipating: null,
    participatedProjectCount: member.projectCount ?? 0,
    skills: [...(member.techStacks ?? [])]
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .slice(0, 3)
      .map((skill) => skill.name),
  }));
}
