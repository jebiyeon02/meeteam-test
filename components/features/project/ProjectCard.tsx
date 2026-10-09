import Image from 'next/image';
import Link from 'next/link';
import { Users } from 'lucide-react';
import CategoryBadge from '@/components/shared/CategoryBadge';
import { formatJobRole } from '@/components/shared/jobRoleFormat';
import ProfileAvatar from '@/components/shared/ProfileAvatar';
import StatusBadge from '@/components/shared/StatusBadge';
import { getProjectImageSrc } from './projectImage';

interface ProjectCardProps {
  project: {
    id: string | number;
    title: string;
    imageUrl: string;
    category: string;
    deadline?: string;
    currentMembers: number;
    maxMembers: number;
    leader: {
      name: string;
      avatar: string;
    };
    tags?: string[];
    recruitInfo?: Array<{
      id: string | number;
      role: string;
      subRoles?: string[];
      status: string;
      current: number;
      max: number;
    }>;
  };
  compact?: boolean;
}

export function ProjectCard({ project, compact = false }: ProjectCardProps) {
  const percentage =
    project.maxMembers > 0 ? Math.round((project.currentMembers / project.maxMembers) * 100) : 0;

  const recruitInfo = project.recruitInfo ?? [];
  const deadlineLabel = project.deadline?.trim() ? `${project.deadline} 마감` : '상시 모집';
  const imageSrc = getProjectImageSrc(project.imageUrl);

  const heightClass = compact ? 'h-50' : 'h-[380px]';
  const titleClass = compact ? 'mb-3 text-2xl' : 'mb-3 text-2xl';

  return (
    <Link
      data-cy="project-card"
      data-project-id={project.id}
      className={`group relative block ${heightClass} w-full overflow-hidden rounded-3xl bg-mt-bg-soft shadow-sm transition-all duration-300 hover:ring-1 hover:ring-mt-logo-blue/50`}
      href={`/projects/${project.id}`}
    >
      <div className="absolute inset-0 h-full w-full">
        <Image
          alt={project.title}
          className="object-cover object-center transition-transform duration-700 group-hover:scale-110"
          fill
          sizes={compact ? '100vw' : '(max-width: 768px) 100vw, 50vw'}
          src={imageSrc}
        />
        <div className="absolute inset-0 bg-linear-to-b from-mt-text-primary/35 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-linear-to-t from-mt-text-primary/95 via-mt-text-primary/55 to-transparent transition-opacity duration-500" />
        <div className="absolute inset-0 bg-mt-text-primary/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </div>

      <div
        className={`absolute left-0 right-0 top-0 z-10 flex justify-between ${compact ? 'p-4' : 'p-6'}`}
      >
        <CategoryBadge label={project.category} tone="accent" />
        <StatusBadge
          status="deadline"
          label={deadlineLabel}
          className="border-mt-logo-blue/30 bg-mt-logo-blue/30"
        />
      </div>

      <div
        className={`absolute inset-x-0 bottom-0 z-20 flex flex-col justify-end ${compact ? 'p-4' : 'p-6'}`}
      >
        <div className="flex max-h-80 min-h-0 flex-col justify-end">
          <div className="shrink-0 transition-transform duration-500 ease-out group-hover:-translate-y-1">
            <h3
              data-cy="project-card-title"
              className={`${titleClass} line-clamp-1 leading-tight font-bold text-mt-white drop-shadow-md`}
            >
              {project.title}
            </h3>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ProfileAvatar
                  name={project.leader.name}
                  imageUrl={project.leader.avatar}
                  sizeClassName="h-8 w-8"
                  textClassName="text-xs"
                  className="border border-mt-white/30 bg-mt-white/20 text-mt-white"
                  imageClassName="scale-100"
                />
                <span
                  data-cy="project-card-leader"
                  className="text-xs font-medium text-mt-white/90 drop-shadow-sm"
                >
                  {project.leader.name}
                </span>
              </div>

              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1 text-[10px] font-bold text-mt-white/90">
                  <Users className="h-3 w-3" aria-hidden strokeWidth={2} />
                  {project.currentMembers}/{project.maxMembers}명
                </div>
                <div className="h-1.5 w-20 overflow-hidden rounded-full bg-mt-white/25">
                  <div
                    className="h-full bg-mt-mint"
                    style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div
            className={
              compact
                ? 'hidden'
                : 'min-h-0 max-h-0 overflow-hidden opacity-0 transition-all duration-500 ease-out group-hover:mt-4 group-hover:max-h-52 group-hover:opacity-100'
            }
          >
            <div className="min-h-0 overflow-hidden">
              <div className="border-t border-mt-white/20 pt-4">
                <div className="mb-3 flex items-center">
                  <h4 className="border-l-2 border-mt-logo-blue pl-2 text-sm font-bold text-mt-white">
                    모집 현황
                  </h4>
                </div>

                <div className="project-card-scrollbar max-h-32 space-y-2 overflow-y-auto pr-2">
                  {recruitInfo.length > 0 ? (
                    recruitInfo.map((info) => (
                      <div
                        className="flex items-center justify-between rounded-lg border border-mt-logo-blue/25 bg-mt-text-primary/40 p-2.5 transition-colors hover:border-mt-logo-blue/40 hover:bg-mt-text-primary/60"
                        key={info.id}
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-mt-white">
                            {formatJobRole(info.role, info.subRoles?.filter(Boolean).join(', '))}
                          </span>
                          <span className="text-[10px] text-mt-white/70">모집 포지션</span>
                        </div>

                        {info.status === 'open' ? (
                          <div className="flex items-center gap-2">
                            <StatusBadge status="open" label={`${info.current}/${info.max}`} />
                          </div>
                        ) : (
                          <StatusBadge status="closed" />
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="py-2 text-center text-xs text-mt-text-secondary">
                      모집 포지션 없음
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-end">
                  <span className="cursor-pointer text-xs font-bold text-mt-logo-blue transition-colors hover:text-mt-primary">
                    자세히 보기 →
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
