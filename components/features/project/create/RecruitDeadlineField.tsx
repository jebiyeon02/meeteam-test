'use client';

import { Check } from 'lucide-react';
import DateSelector from './DateSelector';

interface RecruitDeadlineFieldProps {
  deadline: string;
  onDeadlineChange: (nextValue: string) => void;
  untilComplete: boolean;
  onUntilCompleteChange: (nextValue: boolean) => void;
  minDate?: string;
  maxDate?: string;
  errorText?: string;
  showUntilComplete?: boolean;
}

export default function RecruitDeadlineField({
  deadline,
  onDeadlineChange,
  untilComplete,
  onUntilCompleteChange,
  minDate,
  maxDate,
  errorText,
  showUntilComplete = true,
}: RecruitDeadlineFieldProps) {
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex w-full flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-bold leading-5 text-mt-text-primary">모집 마감일</p>
        {showUntilComplete ? (
          <label
            className={`inline-flex cursor-pointer select-none items-center gap-2 text-xs font-bold leading-4 ${
              untilComplete ? 'text-mt-primary' : 'text-mt-text-secondary'
            }`}
          >
            <input
              type="checkbox"
              checked={untilComplete}
              data-cy="project-form-until-complete"
              onChange={(event) => onUntilCompleteChange(event.target.checked)}
              className="peer sr-only"
            />
            <span
              className={`flex size-4 items-center justify-center rounded-sm border p-px transition peer-focus-visible:ring-2 peer-focus-visible:ring-mt-logo-blue/30 ${
                untilComplete ? 'border-mt-primary bg-mt-primary' : 'border-mt-border bg-mt-white'
              }`}
            >
              <Check
                className={`size-3.5 text-mt-white transition-opacity ${
                  untilComplete ? 'opacity-100' : 'opacity-0'
                }`}
                strokeWidth={3}
                aria-hidden="true"
              />
            </span>
            모집 완료 시까지
          </label>
        ) : null}
      </div>

      <DateSelector
        value={deadline}
        dataCy="project-form-deadline"
        onChange={onDeadlineChange}
        minDate={minDate}
        maxDate={maxDate}
        disabled={untilComplete}
      />

      {errorText ? <p className="text-sm leading-5 text-mt-hero-blue">{errorText}</p> : null}
    </div>
  );
}
