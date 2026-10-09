import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, GraduationCap } from 'lucide-react';
import HomeMemberSection from '@/components/features/home/HomeMemberSection';
import HomeProjectSection from '@/components/features/home/HomeProjectSection';
import StartJourneyModalTrigger from '@/components/features/home/StartJourneyModalTrigger';

export default function Page() {
  return (
    <div className="pb-8">
      <section className="relative overflow-hidden px-2 py-1 md:px-4 md:py-2">
        <div className="pointer-events-none absolute right-4 top-8 h-64 w-64 rounded-full bg-mt-bg-soft blur-3xl md:right-20 md:h-96 md:w-96" />

        <div className="relative grid items-center gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-5 px-2 hero-fade-up md:px-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-mt-badge-bg px-4 py-2 text-sm font-bold text-mt-primary hero-fade-up hero-delay-1">
              <GraduationCap className="h-4 w-4 text-mt-primary" strokeWidth={1.8} />
              대학생 전용 팀빌딩 플랫폼
            </div>
            <div className="hero-fade-up hero-delay-2">
              <h1 className="font-brand-display text-4xl leading-tight text-mt-text-primary md:text-5xl xl:text-[3.25rem]">
                캠퍼스에서
                <br />
                <span className="text-mt-hero-blue sm:whitespace-nowrap">
                  함께할 팀을 쉽게 찾아요
                </span>
              </h1>
            </div>
            <div className="flex flex-wrap gap-3 hero-fade-up hero-delay-3">
              <StartJourneyModalTrigger />
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 rounded-full border border-mt-border bg-mt-white px-6 py-3 text-base font-bold text-mt-hero-blue transition-colors hover:border-mt-cheek-blue hover:bg-mt-badge-bg hover:text-mt-text-primary"
              >
                프로젝트 둘러보기
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </Link>
            </div>
          </div>

          <div className="relative flex min-h-52 items-center justify-center hero-fade-up hero-delay-2">
            <div className="absolute right-8 top-3 h-52 w-52 rounded-full bg-mt-bg-soft md:h-72 md:w-72" />
            <div className="relative hero-character-float">
              <Image
                src="/brand/meeteam_character_hat.png"
                alt="모자를 쓴 meeTeam 캐릭터"
                width={1536}
                height={1024}
                priority
                className="w-full max-w-56 md:max-w-72"
              />
            </div>
          </div>
        </div>
      </section>

      <HomeProjectSection />

      <HomeMemberSection />
    </div>
  );
}
