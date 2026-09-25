import Link from 'next/link';
import { BriefcaseBusiness, CheckCircle2, CircleSlash2, Github, Link2, Users } from 'lucide-react';
import ProfileAvatar from '@/components/features/profile/ProfileAvatar';
import type { ProfileProjectCard } from '@/components/features/profile/profileApi';
import BaseButton from '@/components/shared/BaseButton';

type ProfileViewProps = {
  name: string;
  imageUrl: string | null;
  role: string | null;
  skills: string[];
  isParticipating: boolean;
  introduction: string;
  projectCount: number;
  projects: ProfileProjectCard[];
  githubUrl: string | null;
  blogUrl: string | null;
  onEdit?: () => void;
  editHref?: string;
  showTeammatesLink?: boolean;
};

export default function ProfileView({
  name,
  imageUrl,
  role,
  skills,
  isParticipating,
  introduction,
  projectCount,
  projects,
  githubUrl,
  blogUrl,
  onEdit,
  editHref,
  showTeammatesLink = false,
}: ProfileViewProps) {
  const StatusIcon = isParticipating ? CheckCircle2 : CircleSlash2;
  const contacts = [
    { label: 'GitHub', href: githubUrl, icon: Github },
    { label: '블로그', href: blogUrl, icon: Link2 },
  ].filter((item) => item.href && /^https?:\/\//.test(item.href));

  return (
    <section className="bg-mt-white px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="min-w-0 space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-4">
            <div className="mx-auto h-40 w-40 rounded-full border-4 border-mt-white bg-mt-white shadow-lg sm:h-44 sm:w-44 lg:h-56 lg:w-56">
              <ProfileAvatar name={name} src={imageUrl} sizeClassName="h-full w-full" />
            </div>
            <div className="text-center lg:text-left">
              <h1 className="text-2xl font-bold leading-8 text-mt-text-primary">{name}</h1>
              {role && <p className="mt-1 text-base font-medium text-mt-text-secondary">{role}</p>}
            </div>
            {onEdit && (
              <BaseButton size="M" full onClick={onEdit}>
                프로필 수정
              </BaseButton>
            )}
            {editHref && (
              <Link
                href={editHref}
                className="flex h-10 w-full items-center justify-center rounded-xl bg-mt-primary text-sm font-bold text-mt-white"
              >
                프로필 수정
              </Link>
            )}
            {showTeammatesLink && (
              <Link
                href="/teammates"
                className="flex h-10 w-full items-center justify-center rounded-xl border border-mt-border text-sm font-semibold text-mt-primary"
              >
                다른 팀원 프로필 보기
              </Link>
            )}
          </div>

          <div className="space-y-4">
            <div className="border-t border-mt-border pt-4">
              <div className="flex items-center gap-2 text-sm font-medium text-mt-text-primary">
                <StatusIcon className="h-5 w-5 text-mt-primary" aria-hidden strokeWidth={1.8} />
                {isParticipating ? '프로젝트 참여 가능' : '프로젝트 참여 불가'}
              </div>
            </div>
            {contacts.length > 0 && (
              <div className="space-y-2 border-t border-mt-border pt-4">
                {contacts.map(({ label, href, icon: Icon }) => (
                  <a
                    key={label}
                    href={href!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-mt-text-secondary hover:text-mt-primary"
                  >
                    <Icon className="h-4 w-4" aria-hidden strokeWidth={1.8} />
                    {label}
                  </a>
                ))}
              </div>
            )}
            <div className="space-y-3 border-t border-mt-border pt-4">
              <h2 className="text-base font-bold text-mt-text-primary">기술 스택</h2>
              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-lg bg-mt-badge-bg px-3 py-1.5 text-sm text-mt-primary"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-mt-text-secondary">등록된 기술 스택이 없습니다.</p>
              )}
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-8">
          <section className="space-y-4">
            <h2 className="text-xl font-bold leading-7 text-mt-text-primary">자기소개</h2>
            {introduction.trim() ? (
              <div className="rounded-2xl border border-mt-border bg-mt-white px-6 py-6">
                <p className="whitespace-pre-wrap text-sm leading-7 text-mt-text-primary">
                  {introduction}
                </p>
              </div>
            ) : (
              <p className="text-sm text-mt-text-secondary">아직 작성된 자기소개가 없어요.</p>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-baseline gap-2">
              <h2 className="text-xl font-bold leading-7 text-mt-text-primary">참여 프로젝트</h2>
              <span className="text-lg text-mt-text-secondary">{projectCount}</span>
            </div>
            {projects.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {projects.map((project) => (
                  <article
                    key={project.id}
                    className="flex min-h-70 flex-col justify-between rounded-3xl bg-linear-to-br from-mt-primary to-mt-logo-blue p-6 text-mt-white shadow-lg"
                  >
                    <span className="w-fit rounded-lg bg-mt-white/20 px-3 py-1 text-xs font-semibold">
                      {project.category}
                    </span>
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold leading-7">{project.title}</h3>
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span>{project.leader}</span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3" aria-hidden />
                          {project.currentMembers}/{project.maxMembers}명
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="flex min-h-76 flex-col items-center justify-center rounded-2xl border border-dashed border-mt-border bg-mt-bg-soft/50 px-6 py-16 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full border border-mt-border bg-mt-white text-mt-primary shadow-sm">
                  <BriefcaseBusiness className="h-8 w-8" aria-hidden strokeWidth={1.8} />
                </span>
                <p className="mt-4 text-sm text-mt-text-secondary">
                  참여중인 프로젝트가 존재하지 않습니다.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
