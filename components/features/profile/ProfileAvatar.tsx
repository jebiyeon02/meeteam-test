import Image from 'next/image';

export default function ProfileAvatar({
  name,
  src,
  sizeClassName = 'h-20 w-20',
  shape = 'circle',
}: {
  name: string;
  src: string | null;
  sizeClassName?: string;
  shape?: 'circle' | 'rounded';
}) {
  const shapeClassName = shape === 'circle' ? 'rounded-full' : 'rounded-2xl';
  return src ? (
    <Image
      src={src}
      alt={`${name} 프로필 사진`}
      width={224}
      height={224}
      unoptimized
      className={`${sizeClassName} ${shapeClassName} shrink-0 border border-mt-border object-cover`}
    />
  ) : (
    <div
      aria-label={`${name} 프로필 사진 없음`}
      className={`flex ${sizeClassName} ${shapeClassName} shrink-0 items-center justify-center bg-mt-badge-bg text-2xl font-bold text-mt-primary`}
    >
      {name.slice(0, 1)}
    </div>
  );
}
