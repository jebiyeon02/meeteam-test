type ProjectFormSection = {
  title: string;
  description: string;
};

type ProjectFormSectionNavProps = {
  sections: readonly ProjectFormSection[];
  activeIndex: number;
  onSelect: (index: number) => void;
};

export default function ProjectFormSectionNav({
  sections,
  activeIndex,
  onSelect,
}: ProjectFormSectionNavProps) {
  return (
    <aside className="min-w-0 lg:sticky lg:top-24">
      <div className="rounded-3xl border border-mt-border bg-mt-white p-3 shadow-sm sm:p-4">
        <h2 className="px-2 text-lg leading-7 font-extrabold text-mt-text-primary sm:text-xl">
          프로젝트 수정
        </h2>

        <nav className="mt-4" aria-label="프로젝트 수정 섹션">
          <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            {sections.map((section, index) => {
              const selected = activeIndex === index;

              return (
                <li key={section.title} className="min-w-40 sm:min-w-48 lg:min-w-0">
                  <button
                    type="button"
                    onClick={() => onSelect(index)}
                    aria-pressed={selected}
                    className={`w-full rounded-2xl px-3 py-2.5 text-left transition-colors sm:py-3 ${
                      selected
                        ? 'bg-mt-badge-bg text-mt-primary'
                        : 'text-mt-text-secondary hover:bg-mt-bg-soft hover:text-mt-text-primary'
                    }`}
                  >
                    <span className="block text-sm leading-5 font-bold">{section.title}</span>
                    <span className="mt-1 block text-xs leading-4">{section.description}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
