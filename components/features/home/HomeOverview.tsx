import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const AREAS = [
  { href: '/projects', title: '프로젝트 찾기' },
  { href: '/profile', title: '내 프로필' },
  { href: '/teammates', title: '팀원 찾기' },
  { href: '/notifications', title: '알림' },
];

export default function HomeOverview() {
  return (
    <div className="space-y-10 pb-12">
      <section className="rounded-3xl border border-mt-border bg-mt-white p-8 sm:p-12">
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
          함께할 팀을 찾는 공간,
          <br />
          <span className="text-mt-primary">meeTeam</span>
        </h1>
        <Link
          href="/showcase"
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-mt-primary px-5 py-3 text-sm font-bold text-mt-white"
        >
          공통 UI 살펴보기 <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {AREAS.map((area) => (
          <Link
            key={area.href}
            href={area.href}
            className="flex items-center justify-between rounded-2xl border border-mt-border bg-mt-white p-5 font-bold transition-colors hover:bg-mt-bg-soft"
          >
            {area.title}
            <ArrowRight className="h-4 w-4 text-mt-primary" />
          </Link>
        ))}
      </section>
    </div>
  );
}
