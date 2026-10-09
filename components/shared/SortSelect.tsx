import { ChevronDown } from 'lucide-react';

type SortSelectOption<TValue extends string> = {
  label: string;
  value: TValue;
};

type SortSelectProps<TValue extends string> = {
  value: TValue;
  options: readonly SortSelectOption<TValue>[];
  onChange: (value: TValue) => void;
  dataCy: string;
  ariaLabel?: string;
};

export default function SortSelect<TValue extends string>({
  value,
  options,
  onChange,
  dataCy,
  ariaLabel = '정렬 기준',
}: SortSelectProps<TValue>) {
  return (
    <div className="relative w-full sm:w-auto">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as TValue)}
        data-cy={dataCy}
        aria-label={ariaLabel}
        className="h-10 w-full appearance-none rounded-lg border border-transparent bg-mt-white py-2 pl-3 pr-9 text-sm leading-5 font-bold text-mt-text-nav outline-none transition-colors focus:border-transparent"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mt-text-secondary"
        aria-hidden
        strokeWidth={1.8}
      />
    </div>
  );
}
