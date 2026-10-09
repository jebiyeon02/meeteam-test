'use client';

import { useCallback, useState } from 'react';
import { Rocket, Search } from 'lucide-react';

import { useProtectedNavigation } from '@/components/features/auth/useProtectedNavigation';
import BaseModal from '@/components/shared/BaseModal';

interface OptionCardProps {
  title: string;
  icon: 'rocket' | 'search';
  onClick: () => void;
}

function OptionIcon({ type }: { type: OptionCardProps['icon'] }) {
  if (type === 'rocket') {
    return <Rocket aria-hidden className="h-5 w-5" strokeWidth={1.8} />;
  }

  return <Search aria-hidden className="h-6 w-6" strokeWidth={1.8} />;
}

function OptionCard({ title, icon, onClick }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-32 flex-col items-start justify-between rounded-2xl border border-mt-border bg-mt-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-mt-primary hover:shadow-md"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-mt-badge-bg text-mt-primary transition-colors group-hover:bg-mt-primary group-hover:text-mt-white">
        <OptionIcon type={icon} />
      </span>
      <span className="text-base leading-6 font-bold text-mt-text-primary">{title}</span>
    </button>
  );
}

export default function StartJourneyModalTrigger() {
  const [open, setOpen] = useState(false);
  const { navigateWithProtection } = useProtectedNavigation();

  const handleMove = useCallback(
    (path: string) => {
      setOpen(false);
      navigateWithProtection(path);
    },
    [navigateWithProtection],
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hero-primary-cta inline-flex items-center gap-2 rounded-full bg-mt-hero-blue px-7 py-3.5 text-base text-mt-white shadow-lg transition-colors hover:bg-mt-primary"
      >
        프로젝트 시작하기
      </button>

      <BaseModal isOpen={open} onClose={() => setOpen(false)}>
        <section className="rounded-2xl bg-mt-white p-6 shadow-2xl">
          <header className="pb-5">
            <h2 className="text-xl font-extrabold text-mt-text-primary">시작하기</h2>
          </header>

          <div className="grid gap-3 sm:grid-cols-2">
            <OptionCard
              title="프로젝트 생성하기"
              icon="rocket"
              onClick={() => handleMove('/projects/create')}
            />
            <OptionCard title="팀 찾기" icon="search" onClick={() => handleMove('/teammates')} />
          </div>
        </section>
      </BaseModal>
    </>
  );
}
