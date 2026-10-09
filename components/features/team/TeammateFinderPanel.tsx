import { Search } from 'lucide-react';
import TechStackPicker from '@/components/shared/TechStackPicker';
import { TEAMMATE_PAGE_COPY } from './constants';
import { TEAMMATE_ROLE_OPTIONS } from './constants';
import { TeammateFilterChip } from './TeammateFilterChip';

type TeammateFinderPanelProps = {
  searchValue: string;
  selectedRole: (typeof TEAMMATE_ROLE_OPTIONS)[number];
  selectedSkills: string[];
  availableSkills: string[];
  onSearchChange: (value: string) => void;
  onRoleChange: (value: (typeof TEAMMATE_ROLE_OPTIONS)[number]) => void;
  onSelectedSkillsChange: (value: string[]) => void;
};

export function TeammateFinderPanel({
  searchValue,
  selectedRole,
  selectedSkills,
  availableSkills,
  onSearchChange,
  onRoleChange,
  onSelectedSkillsChange,
}: TeammateFinderPanelProps) {
  return (
    <div className="space-y-6 pt-4">
      <label className="relative block">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-mt-text-secondary"
          aria-hidden
          strokeWidth={1.8}
        />
        <input
          type="search"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={TEAMMATE_PAGE_COPY.searchPlaceholder}
          data-cy="teammate-search-input"
          className="h-14 w-full rounded-xl border border-mt-border bg-mt-white py-4 pl-12 pr-5 text-base leading-6 text-mt-text-primary shadow-sm outline-none placeholder:text-mt-text-secondary focus:border-mt-logo-blue focus:ring-2 focus:ring-mt-logo-blue/15"
        />
      </label>

      <div className="rounded-2xl border border-mt-border bg-mt-white p-6 shadow-sm">
        <div className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-8">
            <span className="w-16 shrink-0 text-sm leading-5 font-semibold text-mt-text-primary">
              분야
            </span>
            <div className="flex flex-wrap gap-x-2 gap-y-2">
              {TEAMMATE_ROLE_OPTIONS.map((role) => (
                <TeammateFilterChip
                  key={role}
                  label={role}
                  active={selectedRole === role}
                  onClick={() => onRoleChange(role)}
                />
              ))}
            </div>
          </div>

          <div className="h-px w-full bg-mt-border" />

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-8">
            <span className="w-16 shrink-0 text-sm leading-5 font-semibold text-mt-text-primary">
              기술 스택
            </span>
            <div className="w-full max-w-md">
              <TechStackPicker
                inputId="teammate-skill-input"
                inputDataCy="teammate-skill-input"
                options={availableSkills}
                value={selectedSkills}
                onChange={onSelectedSkillsChange}
                placeholder={TEAMMATE_PAGE_COPY.skillPlaceholder}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
