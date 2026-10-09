'use client';

import { CodeXml } from 'lucide-react';
import ProfileCard from '@/components/features/profile/ProfileCard';
import { formatJobRole } from '@/components/shared/jobRoleFormat';
import SkillChip from '@/components/shared/SkillChip';
import TechStackPicker from '@/components/shared/TechStackPicker';

interface SkillGroupData {
  category?: string;
  role?: string;
  skills: string[];
}

interface SkillsCardProps {
  editable?: boolean;
  skillGroups: SkillGroupData[];
  availableSkills?: string[];
  onSkillsChange?: (groupIndex: number, skills: string[]) => void;
}

export default function SkillsCard({
  editable = false,
  skillGroups,
  availableSkills = [],
  onSkillsChange,
}: SkillsCardProps) {
  return (
    <ProfileCard className={editable ? 'min-h-[297px]' : 'min-h-56'}>
      <h2 className="text-lg leading-7 font-bold text-mt-text-primary">기술 스택</h2>
      {editable ? (
        <p className="mt-1 text-sm leading-5 text-mt-text-secondary">
          대표 기술은 앞의 3개가 먼저 표시돼요. 드래그해서 순서를 바꿀 수 있어요.
        </p>
      ) : null}

      <div className="mt-4 space-y-5">
        {skillGroups.map((group, groupIndex) => (
          <div key={`${group.category}-${group.role}-${groupIndex}`} className="space-y-3">
            {group.category && group.role ? (
              <div className="flex items-center gap-1.5 text-sm leading-5 text-mt-text-secondary">
                <CodeXml className="h-3 w-3" aria-hidden strokeWidth={2} />
                <p>{formatJobRole(group.category, group.role)}</p>
              </div>
            ) : null}

            {!editable ? (
              <div className="flex flex-wrap gap-2">
                {group.skills.length > 0 ? (
                  group.skills.map((skill, skillIndex) => (
                    <SkillChip
                      key={`${group.category ?? 'skill'}-${skill}-${skillIndex}`}
                      label={skill}
                      size="md"
                    />
                  ))
                ) : (
                  <p className="text-sm leading-5 text-mt-text-secondary">
                    등록된 기술 스택이 없습니다.
                  </p>
                )}
              </div>
            ) : null}

            {editable ? (
              <TechStackPicker
                inputId={`profile-skills-${groupIndex}`}
                inputDataCy={`profile-skills-input-${groupIndex}`}
                options={availableSkills}
                value={group.skills}
                onChange={(nextSkills) => onSkillsChange?.(groupIndex, nextSkills)}
                placeholder="기술 스택 검색"
                enableSelectedChipReorder={true}
                rankedChipCount={3}
                selectedChipsDataCy={`profile-skills-selected-${groupIndex}`}
              />
            ) : null}
          </div>
        ))}
      </div>
    </ProfileCard>
  );
}
