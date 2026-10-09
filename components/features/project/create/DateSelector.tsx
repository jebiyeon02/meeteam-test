'use client';

import { Calendar } from 'lucide-react';
import { useRef } from 'react';

interface DateSelectorProps {
  id?: string;
  dataCy?: string;
  value: string;
  onChange: (nextValue: string) => void;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
  disabled?: boolean;
  className?: string;
}

export default function DateSelector({
  id,
  dataCy,
  value,
  onChange,
  placeholder = 'YYYY년 MM월 DD일',
  minDate,
  maxDate,
  disabled = false,
  className = '',
}: DateSelectorProps) {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleOpenPicker = () => {
    if (disabled) return;
    dateInputRef.current?.showPicker?.();
    dateInputRef.current?.focus();
  };

  const handleChange = (nextValue: string) => {
    onChange(nextValue);
  };

  const displayDate = value
    ? (() => {
        const [year, month, day] = value.split('-');
        if (!year || !month || !day) {
          return placeholder;
        }
        return `${year}년 ${month.padStart(2, '0')}월 ${day.padStart(2, '0')}일`;
      })()
    : placeholder;

  return (
    <div className={`relative w-full ${className}`}>
      <input
        ref={dateInputRef}
        id={id}
        type="date"
        value={value}
        data-cy={dataCy}
        min={minDate}
        max={maxDate}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => handleChange(event.target.value)}
      />

      <button
        type="button"
        onClick={handleOpenPicker}
        disabled={disabled}
        className={`flex h-15 w-full items-center justify-between rounded-xl border border-mt-border bg-mt-white px-5.25 py-4.25 text-left text-base leading-6 transition-all duration-200 ease-out
          focus:border-mt-primary focus:outline-none focus:ring-2 focus:ring-mt-logo-blue/20
          disabled:cursor-not-allowed disabled:bg-mt-bg-soft
          ${value ? 'text-mt-text-primary' : 'text-mt-text-secondary'}`}
        aria-label="모집 마감일 선택"
      >
        <span className="truncate font-normal">{displayDate}</span>
        <Calendar
          className={`h-4 w-4 shrink-0 ${disabled ? 'text-mt-text-secondary' : 'text-mt-text-primary'}`}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
