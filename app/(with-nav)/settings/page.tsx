import RequireAuth from '@/components/features/auth/RequireAuth';
import ProfileSettingsPage from '@/components/features/profile/ProfileSettingsPage';

export default function Page() {
  return (
    <RequireAuth>
      <ProfileSettingsPage />
    </RequireAuth>
  );
}
