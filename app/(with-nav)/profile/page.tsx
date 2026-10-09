import RequireAuth from '@/components/features/auth/RequireAuth';
import ProfileOverview from '@/components/features/profile/ProfileOverview';

export default function Page() {
  return (
    <RequireAuth>
      <ProfileOverview />
    </RequireAuth>
  );
}
