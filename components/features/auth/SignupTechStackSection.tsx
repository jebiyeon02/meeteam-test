import { useMemo } from 'react';

import BaseField from '@/components/shared/BaseField';
import { formatJobRole } from '@/components/shared/jobRoleFormat';
import TechStackPicker from '@/components/shared/TechStackPicker';
import type { Interest, JobFieldOption } from '@/types/auth';

import { collectOrderedTechStackNames } from './jobOptionUtils';
import { getInterestKey } from './signupTransform';

type SignupTechStackSectionProps = {
  label?: string;
  jobFields: JobFieldOption[];
  interests: Interest[];
  value: Record<string, string[]>;
  onChange: (next: Record<string, string[]>) => void;
  errorText?: string;
  disabled?: boolean;
};

export default function SignupTechStackSection({
  label = '기술 스택',
  jobFields,
  interests,
  value,
  onChange,
  errorText,
  disabled = false,
}: SignupTechStackSectionProps) {
  const currentItem = useMemo(() => {
    const interest = interests.find((item) => item.major && item.minor);
    if (!interest) return null;

    const field = jobFields.find((jobField) => jobField.code === interest.major);
    const position = field?.positions.find((jobPosition) => jobPosition.code === interest.minor);

    return {
      key: getInterestKey(interest),
      label: formatJobRole(field?.name ?? interest.major, position?.name ?? interest.minor),
      fieldCode: interest.major,
    };
  }, [interests, jobFields]);

  const selectedJobField = useMemo(
    () => jobFields.find((item) => item.code === currentItem?.fieldCode) ?? null,
    [currentItem?.fieldCode, jobFields],
  );
  const techStackOptions = useMemo(
    () => collectOrderedTechStackNames(jobFields, selectedJobField),
    [jobFields, selectedJobField],
  );
  const selectedTechStacks = useMemo(
    () => (currentItem ? (value[currentItem.key] ?? []) : []),
    [currentItem, value],
  );

  const handleChangeTechStacks = (nextSelectedTechStacks: string[]) => {
    if (!currentItem) {
      return;
    }

    if (nextSelectedTechStacks.length === 0) {
      const rest = Object.fromEntries(
        Object.entries(value).filter(([key]) => key !== currentItem.key),
      );
      onChange(rest);
      return;
    }

    onChange({ ...value, [currentItem.key]: nextSelectedTechStacks });
  };

  return (
    <BaseField
      label={label}
      htmlFor="tech"
      required={false}
      hintText="상위 3개 기술 스택이 프로필에 먼저 보여요. 드래그해서 우선순위를 바꿀 수 있어요."
      errorText={errorText}
    >
      <TechStackPicker
        inputId="tech"
        inputDataCy="signup-tech-input"
        options={techStackOptions}
        value={selectedTechStacks}
        onChange={handleChangeTechStacks}
        disabled={!selectedJobField || disabled}
        enableSelectedChipReorder={true}
        rankedChipCount={3}
        selectedChipsDataCy="signup-tech-selected"
        noOptionsMessage="분야를 선택하면 기술 스택을 검색할 수 있습니다."
      />
    </BaseField>
  );
}
