import ProfileOverview from '@/components/features/profile/ProfileOverview';

export default async function Page({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;

  return <ProfileOverview memberId={Number(userId)} editable={false} />;
}
