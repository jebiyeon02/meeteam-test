import { BriefcaseBusiness } from 'lucide-react';
import AuthLink from '@/components/features/auth/AuthLink';
import ProfileAvatar from '@/components/shared/ProfileAvatar';
import SkillChip from '@/components/shared/SkillChip';

export interface UserCardProps {
  userId: string | number;
  name: string;
  role: string;
  experience: string;
  skills: string[];
  imageUrl: string;
  className?: string;
  dataCy?: string;
  dataUserId?: string | number;
  dataTeammateId?: string | number;
  nameDataCy?: string;
  experienceDataCy?: string;
}

export default function UserCard({
  userId,
  name,
  role,
  experience,
  skills,
  imageUrl,
  className = '',
  dataCy,
  dataUserId,
  dataTeammateId,
  nameDataCy,
  experienceDataCy,
}: UserCardProps) {
  const visibleSkills = skills.slice(0, 3);

  return (
    <AuthLink
      href={`/profile/${userId}`}
      data-cy={dataCy}
      data-user-id={dataUserId}
      data-teammate-id={dataTeammateId}
      className={`group block h-full rounded-2xl border border-mt-border bg-mt-white px-6 pt-6 pb-14 shadow-sm transition-shadow hover:shadow-md ${className}`}
    >
      <div className="relative h-16 w-full">
        <ProfileAvatar
          name={name}
          imageUrl={imageUrl}
          sizeClassName="h-16 w-16"
          shape="rounded"
          textClassName="text-xl"
          className="shadow-sm"
          imageClassName="transition-transform duration-400 group-hover:scale-108"
        />

        <span className="absolute top-0 right-0 rounded-lg bg-mt-badge-bg px-2 py-1 text-xs font-medium text-mt-primary">
          {role}
        </span>
      </div>

      <div className="mt-6 space-y-1">
        <h3 data-cy={nameDataCy} className="text-base font-bold text-mt-text-primary">
          {name}
        </h3>

        <div className="flex items-center gap-1.5 text-xs text-mt-text-secondary">
          <BriefcaseBusiness
            aria-hidden
            className="h-3.5 w-3.5 text-mt-text-secondary"
            strokeWidth={1.8}
          />
          <p data-cy={experienceDataCy}>{experience}</p>
        </div>
      </div>

      <div className="mt-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-mt-text-secondary">
          기술 스택
        </p>
        <div className="flex flex-wrap gap-2">
          {visibleSkills.map((skill, index) => (
            <SkillChip key={`${skill}-${index}`} label={skill} variant="primary" />
          ))}
        </div>
      </div>
    </AuthLink>
  );
}
