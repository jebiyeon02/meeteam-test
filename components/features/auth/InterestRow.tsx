import { useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { Interest, JobFieldOption } from '@/types/auth';
import BaseDropdown from '@/components/shared/BaseDropdown';

type OpenDropdown = 'major' | 'minor' | null;

type InterestRowProps = {
  index: number;
  jobFields: JobFieldOption[];
  value: Interest;
  onChange: (next: Interest) => void;
  onRemove?: () => void;
  length: number;
  disabled?: boolean;
};

export default function InterestRow({
  index,
  jobFields,
  value,
  onChange,
  onRemove,
  length,
  disabled = false,
}: InterestRowProps) {
  const [openDropdown, setOpenDropdown] = useState<OpenDropdown>(null);

  const majorNameByCode = useMemo(
    () => new Map(jobFields.map((item) => [item.code, item.name])),
    [jobFields],
  );
  const fieldByName = useMemo(
    () => new Map(jobFields.map((item) => [item.name, item])),
    [jobFields],
  );
  const majors = jobFields.map((item) => item.name);
  const minors = useMemo(() => {
    const selected = jobFields.find((item) => item.code === value.major);
    return selected?.positions.map((position) => position.name) ?? [];
  }, [jobFields, value.major]);

  const positionCodeByName = useMemo(() => {
    const selected = jobFields.find((item) => item.code === value.major);
    return new Map(selected?.positions.map((position) => [position.name, position.code]) ?? []);
  }, [jobFields, value.major]);

  const toggleDropdown = (key: Exclude<OpenDropdown, null>) => {
    setOpenDropdown((prev) => (prev === key ? null : key));
  };

  const handleSelectMajor = (opt: string) => {
    const selectedField = fieldByName.get(opt);
    if (!selectedField) return;

    onChange({ major: selectedField.code, minor: '' });
    setOpenDropdown(null);
  };

  const handleSelectMinor = (opt: string) => {
    const nextMinor = positionCodeByName.get(opt);
    if (!nextMinor) return;

    onChange({ ...value, minor: nextMinor });
    setOpenDropdown(null);
  };

  return (
    <div className="flex gap-2">
      <BaseDropdown
        value={majorNameByCode.get(value.major)}
        placeholder="직군"
        open={openDropdown === 'major'}
        items={majors}
        onToggle={() => !disabled && toggleDropdown('major')}
        onSelect={handleSelectMajor}
        disabled={disabled}
        containerClassName="max-w-30 flex-1"
        buttonClassName="flex-1 justify-evenly pt-3.5 pb-3.5"
        textClassName="font-medium text-sm whitespace-nowrap"
        dataCy={`signup-interest-major-${index}`}
      />

      <BaseDropdown
        value={
          jobFields
            .find((item) => item.code === value.major)
            ?.positions.find((position) => position.code === value.minor)?.name
        }
        placeholder="상세 분야"
        open={openDropdown === 'minor'}
        items={minors}
        onToggle={() => value.major && !disabled && toggleDropdown('minor')}
        onSelect={handleSelectMinor}
        disabled={!value.major || disabled}
        containerClassName="max-w-78 flex-1"
        buttonClassName="justify-between pt-3.5 pb-3.5 pl-4 pr-4"
        textClassName="font-normal text-sm"
        dataCy={`signup-interest-minor-${index}`}
      />

      {length > 1 && value.major && value.minor && onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          data-cy={`signup-interest-remove-${index}`}
          className="ml-1 flex items-center"
          aria-label="분야 삭제"
        >
          <Trash2 className="h-5 w-5 text-mt-hero-blue" />
        </button>
      ) : null}
    </div>
  );
}
