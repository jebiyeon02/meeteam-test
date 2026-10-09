import BaseTextarea from '@/components/shared/BaseTextarea';
import MarkdownContent from '@/components/shared/MarkdownContent';

interface IntroductionCardProps {
  editable?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}

export default function IntroductionCard({
  editable = false,
  value = '',
  onChange,
}: IntroductionCardProps) {
  if (editable) {
    const characterCount = value.length;

    return (
      <section className="space-y-4">
        <h2 className="text-xl leading-7 font-bold text-mt-text-primary">자기소개</h2>
        <div className="overflow-hidden rounded-2xl border border-mt-border bg-mt-white">
          <BaseTextarea
            rows={8}
            textareaSize="L"
            maxLength={500}
            value={value}
            onChange={(event) => onChange?.(event.target.value)}
            data-cy="profile-introduction-input"
            placeholder="관심 있는 분야, 잘하는 역할, 함께하고 싶은 프로젝트를 적어주세요."
            className="block min-h-56 resize-none rounded-none border-0 px-5 py-5 text-base leading-7 focus:ring-0"
          />
          <div className="flex items-center justify-between border-t border-mt-border bg-mt-bg-soft px-4 py-3 text-sm leading-5 text-mt-text-secondary">
            <p>프로필에 나타낼 짧은 소개를 작성해 주세요.</p>
            <span className="font-semibold text-mt-text-nav">{characterCount} / 500자</span>
          </div>
        </div>
      </section>
    );
  }

  if (value.trim()) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl leading-7 font-bold text-mt-text-primary">자기소개</h2>

        <div className="rounded-2xl border border-mt-border bg-mt-white px-6 py-6">
          <MarkdownContent value={value} />
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="text-xl leading-7 font-bold text-mt-text-primary">자기소개</h2>
      <p className="text-sm leading-6 text-mt-text-secondary">아직 작성된 자기소개가 없어요.</p>
    </section>
  );
}
