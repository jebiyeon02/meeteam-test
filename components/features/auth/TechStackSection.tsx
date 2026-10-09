import BaseField from '@/components/shared/BaseField';
import { formatJobRole } from '@/components/shared/jobRoleFormat';
import type { Interest, JobFieldOption } from '@/types/auth';
import { useEffect, useMemo } from 'react';
import TechStackPicker from '@/components/shared/TechStackPicker';
import { collectOrderedTechStackNames, findJobFieldByName } from './jobOptionUtils';

type TechStackSectionProps = {
  label?: string;
  jobFields: JobFieldOption[];
  interests: Interest[];
  value: Record<string, string[]>;
  onChange: (next: Record<string, string[]>) => void;
  errorText?: string;
  disabled?: boolean;
};

export default function TechStackSection({
  label = '기술 스택',
  jobFields,
  interests,
  value,
  onChange,
  errorText,
  disabled = false,
}: TechStackSectionProps) {
  const interestItems = useMemo(
    () => interests.filter((it) => it.major && it.minor).map((it) => `${it.major} - ${it.minor}`),
    [interests],
  );

  useEffect(() => {
    const nextValue = Object.fromEntries(
      Object.entries(value).filter(([key]) => interestItems.includes(key)),
    );

    if (Object.keys(nextValue).length !== Object.keys(value).length) {
      onChange(nextValue);
      return;
    }

    const hasChangedValue = Object.entries(nextValue).some(([key, items]) => value[key] !== items);
    if (hasChangedValue) {
      onChange(nextValue);
    }
  }, [interestItems, onChange, value]);

  const sections = useMemo(
    () =>
      interestItems.map((item) => {
        const [major, minor] = item.split(' - ');
        const field = findJobFieldByName(jobFields, major?.trim() ?? '') ?? null;

        return {
          key: item,
          major,
          minor,
          field,
          options: collectOrderedTechStackNames(jobFields, field),
          selected: value[item] ?? [],
        };
      }),
    [interestItems, jobFields, value],
  );

  return (
    <BaseField label={label} htmlFor="tech" required={false} errorText={errorText}>
      {sections.length > 0 ? (
        <div className="divide-y divide-mt-border">
          {sections.map((section, index) => (
            <div key={`${section.key}-${index}`} className="py-4 first:pt-0 last:pb-0">
              <p className="mb-3 text-sm leading-5 font-bold text-mt-text-primary">
                {formatJobRole(section.major, section.minor)}
              </p>

              <TechStackPicker
                inputId={index === 0 ? 'tech' : `tech-${index}`}
                inputDataCy={`project-form-tech-input-${index}`}
                options={section.options}
                value={section.selected}
                onChange={(nextSelectedTechStacks) => {
                  if (nextSelectedTechStacks.length === 0) {
                    const rest = Object.fromEntries(
                      Object.entries(value).filter(([key]) => key !== section.key),
                    );
                    onChange(rest);
                    return;
                  }

                  onChange({ ...value, [section.key]: nextSelectedTechStacks });
                }}
                disabled={!section.field || disabled}
                noOptionsMessage="이 분야에 연결된 기술 스택이 없습니다."
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="border-y border-mt-border py-4 text-sm leading-5 text-mt-text-secondary">
          모집 분야를 먼저 선택해 주세요.
        </div>
      )}
    </BaseField>
  );
}
