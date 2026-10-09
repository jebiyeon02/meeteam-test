import SkillChip from '@/components/shared/SkillChip';

interface IntroSkillChipProps {
  label: string;
}

export default function IntroSkillChip({ label }: IntroSkillChipProps) {
  return <SkillChip label={label} variant="primary" size="md" className="font-bold" />;
}
