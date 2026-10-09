import type { ReactNode } from 'react';

interface ProfileCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export default function ProfileCard({ title, children, className = '' }: ProfileCardProps) {
  return (
    <section
      className={`rounded-2xl border border-mt-border bg-mt-white p-6 shadow-sm ${className}`}
    >
      {title ? <h2 className="text-lg leading-7 font-bold text-mt-text-primary">{title}</h2> : null}
      {children}
    </section>
  );
}
