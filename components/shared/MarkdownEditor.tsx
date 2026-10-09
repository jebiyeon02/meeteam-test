'use client';

import { Bold, Code2, Eye, Heading2, List, PencilLine, Quote } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import BaseTextarea from '@/components/shared/BaseTextarea';
import MarkdownContent from '@/components/shared/MarkdownContent';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  dataCy?: string;
  textareaClassName?: string;
  previewEmptyText?: string;
  disabled?: boolean;
}

const FORMAT_ACTIONS = [
  { label: '제목', icon: Heading2, kind: 'prefix', marker: '## ' },
  { label: '굵게', icon: Bold, kind: 'wrap', before: '**', after: '**' },
  { label: '목록', icon: List, kind: 'prefix', marker: '- ' },
  { label: '인용', icon: Quote, kind: 'prefix', marker: '> ' },
  { label: '코드', icon: Code2, kind: 'wrap', before: '`', after: '`' },
] as const;

type FormatAction = (typeof FORMAT_ACTIONS)[number];

export default function MarkdownEditor({
  value,
  onChange,
  rows = 6,
  placeholder = '마크다운으로 편하게 적어주세요.',
  dataCy,
  textareaClassName = '',
  previewEmptyText,
  disabled = false,
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const characterCount = value.length;
  const helperText = useMemo(() => {
    if (mode === 'preview') {
      return value.trim()
        ? '읽는 사람에게 이렇게 보여요.'
        : '내용을 쓰면 이곳에서 바로 확인할 수 있어요.';
    }

    return '제목, 목록, 굵은 글씨 정도만 써도 훨씬 읽기 좋아져요.';
  }, [mode, value]);

  const updateSelection = (start: number, end: number) => {
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(start, end);
    });
  };

  const applyWrapFormat = (
    action: Extract<FormatAction, { kind: 'wrap' }>,
    start: number,
    end: number,
  ) => {
    const selectedText = value.slice(start, end);
    const formattedText = `${action.before}${selectedText}${action.after}`;
    const nextValue = `${value.slice(0, start)}${formattedText}${value.slice(end)}`;
    const nextSelectionStart = start + action.before.length;
    const nextSelectionEnd = nextSelectionStart + selectedText.length;

    onChange(nextValue);
    updateSelection(nextSelectionStart, nextSelectionEnd);
  };

  const applyPrefixFormat = (
    action: Extract<FormatAction, { kind: 'prefix' }>,
    start: number,
    end: number,
  ) => {
    const hasSelection = start !== end;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = hasSelection ? end + value.slice(end).search(/\n|$/) : end;
    const targetText = value.slice(lineStart, lineEnd);
    const formattedText = targetText
      .split('\n')
      .map((line) => `${action.marker}${line}`)
      .join('\n');
    const nextValue = `${value.slice(0, lineStart)}${formattedText}${value.slice(lineEnd)}`;
    const addedLength = formattedText.length - targetText.length;

    onChange(nextValue);

    if (hasSelection) {
      updateSelection(start + action.marker.length, end + addedLength);
      return;
    }

    updateSelection(start + action.marker.length, start + action.marker.length);
  };

  const applyFormat = (action: FormatAction) => {
    setMode('write');

    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      const start = textarea?.selectionStart ?? value.length;
      const end = textarea?.selectionEnd ?? value.length;

      if (action.kind === 'wrap') {
        applyWrapFormat(action, start, end);
        return;
      }

      applyPrefixFormat(action, start, end);
    });
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-mt-border bg-mt-white">
      <div className="flex flex-col gap-3 border-b border-mt-border bg-mt-bg-soft px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setMode('write')}
            className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-bold transition-colors ${
              mode === 'write'
                ? 'bg-mt-white text-mt-text-primary shadow-sm'
                : 'text-mt-text-secondary hover:bg-mt-white hover:text-mt-text-primary'
            }`}
          >
            <PencilLine className="h-4 w-4" aria-hidden strokeWidth={1.8} />
            쓰기
          </button>
          <button
            type="button"
            onClick={() => setMode('preview')}
            className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-bold transition-colors ${
              mode === 'preview'
                ? 'bg-mt-white text-mt-text-primary shadow-sm'
                : 'text-mt-text-secondary hover:bg-mt-white hover:text-mt-text-primary'
            }`}
          >
            <Eye className="h-4 w-4" aria-hidden strokeWidth={1.8} />
            미리보기
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {FORMAT_ACTIONS.map((action) => {
            const Icon = action.icon;

            return (
              <button
                key={action.label}
                type="button"
                onClick={() => applyFormat(action)}
                disabled={disabled}
                aria-label={`${action.label} 넣기`}
                title={`${action.label} 넣기`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-mt-text-secondary transition-colors hover:bg-mt-white hover:text-mt-text-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Icon className="h-4 w-4" aria-hidden strokeWidth={1.8} />
              </button>
            );
          })}
        </div>
      </div>

      {mode === 'write' ? (
        <BaseTextarea
          ref={textareaRef}
          textareaSize="L"
          rows={rows}
          value={value}
          data-cy={dataCy}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className={`min-h-60 rounded-none border-0 px-5 py-5 text-base leading-7 focus:ring-0 resize-none ${textareaClassName}`}
        />
      ) : (
        <div className="min-h-60 px-5 py-5">
          <MarkdownContent value={value} emptyText={previewEmptyText} />
        </div>
      )}

      <div className="flex flex-col gap-1 border-t border-mt-border bg-mt-bg-soft px-4 py-3 text-sm leading-5 text-mt-text-secondary sm:flex-row sm:items-center sm:justify-between">
        <p>{helperText}</p>
        <span className="font-semibold text-mt-text-nav">{characterCount.toLocaleString()}자</span>
      </div>
    </div>
  );
}
