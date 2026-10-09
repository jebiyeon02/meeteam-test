import { ChevronsLeftRight, X } from 'lucide-react';

type TechStackListSection = {
  key: string;
  label: string;
  items: string[];
};

type TechStackListProps = {
  sections: TechStackListSection[];
  onRemove: (key: string, tech: string) => void;
};

export default function TechStackList({ sections, onRemove }: TechStackListProps) {
  if (sections.length === 0) return null;

  return (
    <div className="rounded-2xl border border-mt-border bg-mt-bg-soft p-6">
      <div className="flex flex-col gap-4">
        {sections.map((section, sectionIndex) => (
          <div key={`${section.key}-${sectionIndex}`} className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-mt-text-secondary font-bold text-[12px]">
              <ChevronsLeftRight className="h-4 w-4" />
              <span>{section.label}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {section.items.map((tech, techIndex) => (
                <button
                  key={`${tech}-${techIndex}`}
                  type="button"
                  className="flex items-center gap-1.5 rounded-xl border border-mt-border bg-mt-white px-3 py-1.5 text-mt-text-nav shadow-sm"
                >
                  <span className="font-bold text-[12px]">{tech}</span>
                  <X
                    className="h-3 w-3 text-mt-text-secondary"
                    onClick={() => onRemove(section.key, tech)}
                  />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
