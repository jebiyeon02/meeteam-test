import { X } from 'lucide-react';
import TechStackIcon from '@/components/shared/TechStackIcon';

type SkillChipVariant = 'primary' | 'neutral' | 'outline';
type SkillChipSize = 'sm' | 'md';

type SkillChipProps = {
  label: string;
  variant?: SkillChipVariant;
  size?: SkillChipSize;
  onRemove?: () => void;
  className?: string;
};

const VARIANT_CLASS: Record<SkillChipVariant, string> = {
  primary: 'border-transparent bg-mt-badge-bg text-mt-primary',
  neutral: 'border-transparent bg-mt-bg-soft text-mt-text-primary',
  outline: 'border-mt-border bg-mt-white text-mt-text-nav',
};

const SIZE_CLASS: Record<SkillChipSize, string> = {
  sm: 'rounded-md px-2.5 py-1 text-xs leading-4',
  md: 'rounded-lg px-3 py-1.5 text-sm leading-5',
};

export default function SkillChip({
  label,
  variant = 'neutral',
  size = 'sm',
  onRemove,
  className = '',
}: SkillChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 border font-medium ${VARIANT_CLASS[variant]} ${SIZE_CLASS[size]} ${className}`}
    >
      <TechStackIcon label={label} size={size === 'md' ? 16 : 14} />
      {label}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="text-mt-text-secondary transition-colors hover:text-mt-hero-blue"
          aria-label={`${label} 삭제`}
        >
          <X className="h-3.5 w-3.5" aria-hidden strokeWidth={2} />
        </button>
      ) : null}
    </span>
  );
}
