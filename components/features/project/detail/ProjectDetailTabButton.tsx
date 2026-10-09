import type { ProjectDetailTab } from './ProjectDetailContent';

interface ProjectDetailTabButtonProps {
  tab: ProjectDetailTab;
  label: string;
  isActive: boolean;
  onSelect: (tab: ProjectDetailTab) => void;
}

export default function ProjectDetailTabButton({
  tab,
  label,
  isActive,
  onSelect,
}: ProjectDetailTabButtonProps) {
  return (
    <button
      type="button"
      data-cy={`project-detail-tab-${tab}`}
      onClick={() => onSelect(tab)}
      className={`shrink-0 border-b-2 pb-4 text-sm leading-5 font-bold transition-colors ${
        isActive
          ? 'border-mt-primary text-mt-primary'
          : 'border-transparent text-mt-text-secondary hover:text-mt-text-primary'
      }`}
    >
      {label}
    </button>
  );
}
