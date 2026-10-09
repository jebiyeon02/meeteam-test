'use client';

import { Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import BaseInput from '@/components/shared/BaseInput';
import SkillChip from '@/components/shared/SkillChip';
import TechStackIcon from '@/components/shared/TechStackIcon';

type TechStackPickerProps = {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  inputId?: string;
  inputDataCy?: string;
  emptyMessage?: string;
  noOptionsMessage?: string;
  showSelectedChips?: boolean;
  enableSelectedChipReorder?: boolean;
  rankedChipCount?: number;
  selectedChipsDataCy?: string;
  className?: string;
};

export default function TechStackPicker({
  options,
  value,
  onChange,
  placeholder = '기술 스택 검색',
  disabled = false,
  inputId,
  inputDataCy,
  emptyMessage = '검색 결과가 없습니다.',
  noOptionsMessage = '선택 가능한 기술 스택이 없습니다.',
  showSelectedChips = true,
  enableSelectedChipReorder = false,
  rankedChipCount = 0,
  selectedChipsDataCy,
  className = '',
}: TechStackPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, []);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return options
      .filter((option) => !value.includes(option))
      .filter((option) =>
        normalizedQuery.length === 0 ? true : option.toLowerCase().includes(normalizedQuery),
      );
  }, [options, query, value]);

  const handleSelect = (techStack: string) => {
    if (value.includes(techStack)) {
      return;
    }

    onChange([...value, techStack]);
    setQuery('');
    setIsOpen(false);
  };

  const handleRemove = (techStack: string) => {
    onChange(value.filter((item) => item !== techStack));
  };

  const handleDrop = (targetIndex: number) => {
    if (draggingIndex === null || draggingIndex === targetIndex) {
      setDraggingIndex(null);
      setDragOverIndex(null);
      return;
    }

    const next = [...value];
    const [draggedItem] = next.splice(draggingIndex, 1);
    if (!draggedItem) {
      setDraggingIndex(null);
      setDragOverIndex(null);
      return;
    }

    next.splice(targetIndex, 0, draggedItem);
    onChange(next);
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  const showDropdown = isOpen && !disabled;
  const hasOptions = options.length > 0;

  return (
    <div ref={containerRef} className={`space-y-3 ${className}`}>
      <div className="relative">
        <BaseInput
          id={inputId}
          type="search"
          value={query}
          data-cy={inputDataCy}
          disabled={disabled}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setIsOpen(false);
              return;
            }

            if (event.key === 'Enter') {
              event.preventDefault();

              if (filteredOptions[0]) {
                handleSelect(filteredOptions[0]);
              }
            }
          }}
          rightIcon={
            <Search className="h-5 w-5 text-mt-text-secondary" aria-hidden strokeWidth={1.8} />
          }
        />

        {showDropdown ? (
          <div className="absolute top-full z-10 mt-2 max-h-64 w-full overflow-y-auto overscroll-contain rounded-2xl border border-mt-border bg-mt-white p-2 shadow-sm">
            {filteredOptions.length > 0 ? (
              <ul className="flex flex-col gap-1">
                {filteredOptions.map((option) => (
                  <li key={option}>
                    <button
                      type="button"
                      onClick={() => handleSelect(option)}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm leading-5 text-mt-text-nav transition-colors hover:bg-mt-bg-soft hover:text-mt-text-primary"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <TechStackIcon label={option} size={16} />
                        <span className="truncate">{option}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-3 py-2 text-sm leading-5 text-mt-text-secondary">
                {hasOptions ? emptyMessage : noOptionsMessage}
              </p>
            )}
          </div>
        ) : null}
      </div>

      {showSelectedChips && value.length > 0 && enableSelectedChipReorder ? (
        <div className="flex flex-wrap gap-2" data-cy={selectedChipsDataCy}>
          {value.map((techStack, index) => {
            const isRanked = index < rankedChipCount;
            const isDragOver = dragOverIndex === index && draggingIndex !== index;

            return (
              <span key={techStack} className="inline-flex">
                <span
                  draggable={!disabled}
                  onDragStart={() => setDraggingIndex(index)}
                  onDragEnter={() => setDragOverIndex(index)}
                  onDragOver={(event) => event.preventDefault()}
                  onDragEnd={() => {
                    setDraggingIndex(null);
                    setDragOverIndex(null);
                  }}
                  onDrop={() => handleDrop(index)}
                  className={`inline-flex cursor-grab items-center gap-1.5 rounded-lg border bg-mt-white px-3 py-1.5 text-sm leading-5 font-medium text-mt-text-nav shadow-sm transition-colors active:cursor-grabbing ${
                    isDragOver || isRanked
                      ? 'border-mt-logo-blue text-mt-primary'
                      : 'border-mt-border hover:border-mt-logo-blue hover:text-mt-primary'
                  }`}
                >
                  <TechStackIcon label={techStack} size={16} />
                  <span>{techStack}</span>
                  <button
                    type="button"
                    onClick={() => handleRemove(techStack)}
                    className="text-mt-text-secondary transition-colors hover:text-mt-hero-blue"
                    aria-label={`${techStack} 삭제`}
                  >
                    <X className="h-3.5 w-3.5" aria-hidden strokeWidth={2} />
                  </button>
                </span>
              </span>
            );
          })}
        </div>
      ) : showSelectedChips && value.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {value.map((techStack) => (
            <SkillChip
              key={techStack}
              label={techStack}
              variant="outline"
              size="md"
              onRemove={() => handleRemove(techStack)}
              className="shadow-sm transition-colors hover:border-mt-logo-blue hover:text-mt-primary"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
