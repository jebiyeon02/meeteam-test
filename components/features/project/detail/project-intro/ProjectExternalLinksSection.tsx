'use client';

import { Copy, Github, Globe, Link2 } from 'lucide-react';
import type { ReactNode } from 'react';
import IntroSectionHeading from './IntroSectionHeading';

type ProjectExternalLinksSectionProps = {
  githubUrl: string;
  communicationUrl: string;
  onCopy: (url: string, label: string) => void;
};

type ExternalProjectLinkProps = {
  label: string;
  url: string;
  icon: ReactNode;
  onCopy: (url: string, label: string) => void;
};

function ExternalProjectLink({ label, url, icon, onCopy }: ExternalProjectLinkProps) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-mt-border bg-mt-bg-soft px-4 py-4">
      <div className="flex min-w-0 items-center gap-2 overflow-hidden">
        {icon}
        <div className="min-w-0 overflow-hidden">
          <p className="text-xs leading-4 font-bold text-mt-text-secondary">{label}</p>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="mt-0.5 block max-w-full break-all text-sm leading-5 font-medium text-mt-primary hover:underline sm:truncate"
          >
            {url}
          </a>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onCopy(url, label)}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-mt-text-secondary transition-colors hover:bg-mt-badge-bg hover:text-mt-primary"
        aria-label={`${label} 복사`}
      >
        <Copy className="h-4 w-4" aria-hidden strokeWidth={1.8} />
      </button>
    </div>
  );
}

export default function ProjectExternalLinksSection({
  githubUrl,
  communicationUrl,
  onCopy,
}: ProjectExternalLinksSectionProps) {
  return (
    <section className="flex w-full min-w-0 flex-col gap-4 rounded-3xl border border-mt-border bg-mt-white p-4 shadow-sm sm:p-6">
      <IntroSectionHeading
        title="외부 채널 및 저장소"
        icon={<Globe className="h-5 w-5" aria-hidden strokeWidth={1.8} />}
      />

      <div className="grid min-w-0 gap-3 md:grid-cols-2">
        {githubUrl ? (
          <ExternalProjectLink
            label="GitHub 저장소"
            url={githubUrl}
            onCopy={onCopy}
            icon={<Github className="h-4 w-4 shrink-0 text-mt-text-primary" aria-hidden />}
          />
        ) : null}
        {communicationUrl ? (
          <ExternalProjectLink
            label="소통 채널"
            url={communicationUrl}
            onCopy={onCopy}
            icon={<Link2 className="h-4 w-4 shrink-0 text-mt-primary" aria-hidden />}
          />
        ) : null}
      </div>
    </section>
  );
}
