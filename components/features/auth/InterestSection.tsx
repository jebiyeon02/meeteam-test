import InterestRow from '@/components/features/auth/InterestRow';
import { Interest } from '@/types/auth';
import type { JobFieldOption } from '@/types/auth';

type InterestSectionProps = {
  jobFields: JobFieldOption[];
  interests: Interest[];
  onChange: (index: number, next: Interest) => void;
  errorText?: string;
  disabled?: boolean;
};

export default function InterestSection({
  jobFields,
  interests,
  onChange,
  errorText,
  disabled = false,
}: InterestSectionProps) {
  const interest = interests[0] ?? { major: '', minor: '' };

  return (
    <div className="flex w-full flex-col gap-2">
      <label className="text-lg font-bold leading-7 text-mt-text-primary">분야</label>

      <div className="flex flex-col gap-2">
        <InterestRow
          index={0}
          jobFields={jobFields}
          value={interest}
          onChange={(next) => onChange(0, next)}
          length={1}
          disabled={disabled}
        />
      </div>

      {errorText ? <p className="text-sm text-mt-hero-blue">{errorText}</p> : null}
    </div>
  );
}
