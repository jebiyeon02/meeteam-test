import { FileText } from 'lucide-react';
import MarkdownContent from '@/components/shared/MarkdownContent';
import IntroSectionHeading from './IntroSectionHeading';

export default function ProjectDetailDescriptionSection({ description }: { description: string }) {
  return (
    <section className="flex w-full min-w-0 flex-col gap-4 rounded-3xl border border-mt-border bg-mt-white p-4 shadow-sm sm:p-6">
      <IntroSectionHeading
        title="프로젝트 소개"
        icon={<FileText className="h-5 w-5" aria-hidden strokeWidth={1.8} />}
      />
      <MarkdownContent
        value={description}
        emptyText="아직 프로젝트 소개가 준비되지 않았어요."
        className="break-words text-mt-text-nav"
      />
    </section>
  );
}
