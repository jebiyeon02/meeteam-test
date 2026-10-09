import Link from 'next/link';
import Image from 'next/image';
import { BriefcaseBusiness, Users } from 'lucide-react';
import { getProjectImageSrc } from '@/components/features/project/projectImage';
import CategoryBadge from '@/components/shared/CategoryBadge';
import ProfileAvatar from '@/components/shared/ProfileAvatar';

interface JoinedProjectData {
  id: number;
  title: string;
  category: string;
  leader: string;
  currentMembers: number;
  maxMembers: number;
  imageUrl: string | null;
  leaderImageUrl: string | null;
}

interface JoinedProjectCardProps {
  projects?: JoinedProjectData[];
  disabled?: boolean;
}

export default function JoinedProjectCard({
  projects = [],
  disabled = false,
}: JoinedProjectCardProps) {
  const shouldScroll = projects.length > 4;

  if (projects.length === 0) {
    return (
      <section className="space-y-4">
        <div className="flex items-baseline gap-2">
          <h2 className="text-xl leading-7 font-bold text-mt-text-primary">참여 프로젝트</h2>
          <span className="text-lg leading-7 font-medium text-mt-text-secondary">0</span>
        </div>

        <div
          className={`flex min-h-76 flex-col items-center justify-center rounded-2xl border border-dashed border-mt-shadow-blue bg-mt-bg-soft/50 px-6 py-16 text-center ${
            disabled ? 'pointer-events-none opacity-70' : ''
          }`}
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full border border-mt-border bg-mt-white text-mt-shadow-blue shadow-sm">
            <BriefcaseBusiness className="h-8 w-8" aria-hidden strokeWidth={1.8} />
          </span>

          <p className="mt-4 text-sm leading-5 font-normal text-mt-text-secondary">
            참여중인 프로젝트가 존재하지 않습니다.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-baseline gap-2">
        <h2 className="text-xl leading-7 font-bold text-mt-text-primary">참여 프로젝트</h2>
        <span className="text-lg leading-7 font-medium text-mt-text-secondary">
          {projects.length}
        </span>
      </div>

      <div
        className={
          shouldScroll ? 'profile-project-scrollbar max-h-[36rem] overflow-y-auto pr-2' : undefined
        }
      >
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <li key={project.id}>
              <JoinedProjectItem project={project} disabled={disabled} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function JoinedProjectItem({
  project,
  disabled,
}: {
  project: JoinedProjectData;
  disabled: boolean;
}) {
  const memberRatio = `${project.currentMembers}/${project.maxMembers}명`;
  const progressWidth =
    project.maxMembers > 0 ? `${(project.currentMembers / project.maxMembers) * 100}%` : '0%';
  const imageSrc = getProjectImageSrc(project.imageUrl);

  return (
    <Link
      href={`/projects/${project.id}`}
      data-cy="profile-joined-project"
      className={`group relative block w-full overflow-hidden rounded-3xl bg-mt-bg-soft shadow-2xl ${
        disabled ? 'pointer-events-none opacity-70' : ''
      }`}
    >
      {disabled ? (
        <div
          aria-hidden
          className="absolute inset-0 z-10 rounded-3xl bg-mt-white/50 backdrop-blur-sm"
        />
      ) : null}

      <div className="absolute inset-0">
        <Image
          alt={project.title}
          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
          fill
          sizes="(max-width: 640px) 100vw, 50vw"
          src={imageSrc}
        />
        <div className="absolute inset-0 bg-mt-text-primary/28" />
        <div className="absolute inset-0 bg-linear-to-t from-mt-text-primary/75 via-transparent to-transparent" />
      </div>

      <div className="relative flex min-h-70 flex-col justify-between p-6">
        <div>
          <CategoryBadge label={project.category} tone="onDark" />
        </div>

        <div className="space-y-4">
          <h3 className="text-xl leading-7 font-bold text-mt-white">{project.title}</h3>

          <div className="flex items-end justify-between gap-4">
            <div className="flex min-w-0 items-center gap-2">
              <ProfileAvatar
                name={project.leader}
                imageUrl={project.leaderImageUrl}
                sizeClassName="h-8 w-8"
                textClassName="text-xs"
                className="border border-mt-white/30 bg-mt-white/20 text-mt-white"
              />
              <span className="truncate text-xs leading-4 font-medium text-mt-white/90">
                {project.leader}
              </span>
            </div>

            <div className="shrink-0 space-y-1">
              <div className="flex items-center justify-end gap-1 text-[10px] leading-4 font-bold text-mt-white/90">
                <Users className="h-3 w-3" aria-hidden strokeWidth={1.8} />
                <span>{memberRatio}</span>
              </div>

              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-mt-white/20">
                <div
                  className="h-full rounded-full bg-mt-logo-blue"
                  style={{ width: progressWidth }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
