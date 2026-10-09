import ProfileCard from '@/components/features/profile/ProfileCard';

interface ParticipationStatusCardProps {
  isParticipating: boolean;
  editable?: boolean;
  onToggle?: () => void;
}

export default function ParticipationStatusCard({
  isParticipating,
  editable = false,
  onToggle,
}: ParticipationStatusCardProps) {
  return (
    <ProfileCard className="py-5">
      <div className="space-y-4">
        <div>
          <h2 className="text-base leading-6 font-bold text-mt-text-primary">프로젝트 참여 설정</h2>
          <p className="mt-1 text-xs leading-4 text-mt-text-secondary">
            {isParticipating
              ? '새로운 팀원 제안을 받을 수 있어요.'
              : '현재는 팀원 제안을 받지 않아요.'}
          </p>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span
            className={`text-sm leading-5 font-bold ${
              isParticipating ? 'text-mt-text-primary' : 'text-mt-text-secondary'
            }`}
          >
            {isParticipating ? '프로젝트 참여 가능' : '프로젝트 참여 불가'}
          </span>
          <button
            type="button"
            onClick={editable ? onToggle : undefined}
            data-cy="profile-participation-toggle"
            className={`flex h-7 w-12 items-center rounded-full px-1 transition-colors ${
              isParticipating ? 'bg-mt-primary' : 'bg-mt-shadow-blue'
            } ${editable ? 'cursor-pointer' : 'cursor-default'}`}
            aria-label={isParticipating ? '프로젝트 참여 가능' : '프로젝트 참여 불가'}
            role="switch"
            aria-checked={isParticipating}
          >
            <span
              className={`h-5 w-5 rounded-full bg-mt-white shadow-sm transition-transform ${
                isParticipating ? 'ml-auto' : ''
              }`}
            />
          </button>
        </div>
      </div>
    </ProfileCard>
  );
}
