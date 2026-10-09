import Link from 'next/link';
import { ArrowRight, GraduationCap } from 'lucide-react';
import { HomeMembersSection, HomeProjectsSection } from './HomeDiscovery';

export default function HomeOverview() {
  return (
    <div className="space-y-10 pb-12">
      <section className="rounded-3xl border border-mt-border bg-mt-white p-8 sm:p-12">
        <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-mt-badge-bg px-4 py-2 text-sm font-bold text-mt-primary">
          <GraduationCap className="h-4 w-4" aria-hidden />
          대학생을 위한 팀빌딩 플랫폼
        </p>
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
          캠퍼스에서
          <br />
          <span className="text-mt-hero-blue">함께할 팀을 쉽게 찾아요</span>
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-mt-text-secondary">
          관심 있는 프로젝트를 찾고, 나와 맞는 팀원과 함께 아이디어를 실현해 보세요.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 rounded-xl bg-mt-primary px-5 py-3 text-sm font-bold text-mt-white"
          >
            프로젝트 둘러보기 <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="/projects/create"
            className="inline-flex items-center gap-2 rounded-xl border border-mt-border bg-mt-white px-5 py-3 text-sm font-bold text-mt-primary hover:bg-mt-bg-soft"
          >
            내 프로젝트 등록하기
          </Link>
        </div>
      </section>
      <HomeProjectsSection />
      <HomeMembersSection />
    </div>
  );
}
