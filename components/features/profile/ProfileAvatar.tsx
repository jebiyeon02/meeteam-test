import Image from 'next/image';

export default function ProfileAvatar({ name, src }: { name: string; src: string | null }) {
  return src ? (
    <Image
      src={src}
      alt={`${name} 프로필 사진`}
      width={80}
      height={80}
      unoptimized
      className="h-20 w-20 shrink-0 rounded-full border border-mt-border object-cover"
    />
  ) : (
    <div
      aria-label={`${name} 프로필 사진 없음`}
      className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-mt-badge-bg text-2xl font-bold text-mt-primary"
    >
      {name.slice(0, 1)}
    </div>
  );
}
