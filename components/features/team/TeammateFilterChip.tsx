type TeammateFilterChipProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

export function TeammateFilterChip({ label, active, onClick }: TeammateFilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-cy="teammate-role-filter"
      data-role={label}
      aria-pressed={active}
      className={`rounded-full border px-3.5 py-1.5 text-sm leading-5 transition-all ${
        active
          ? 'border-mt-border bg-mt-white font-bold text-mt-primary shadow-sm'
          : 'border-transparent font-normal text-mt-text-secondary hover:bg-mt-badge-bg hover:text-mt-primary'
      }`}
    >
      {label}
    </button>
  );
}
