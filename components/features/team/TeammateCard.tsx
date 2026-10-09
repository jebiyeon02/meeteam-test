import UserCard from '@/components/shared/UserCard';
import type { Teammate } from '@/types/team';

export function TeammateCard({ teammate }: { teammate: Teammate }) {
  return (
    <UserCard
      userId={teammate.id}
      name={teammate.name}
      role={teammate.role}
      experience={`참여 프로젝트 ${teammate.experienceCount}개`}
      skills={teammate.skills}
      imageUrl={teammate.imageUrl}
      className="min-h-72"
      dataCy="teammate-card"
      dataUserId={teammate.id}
      dataTeammateId={teammate.id}
      nameDataCy="teammate-card-name"
      experienceDataCy="teammate-card-experience"
    />
  );
}
