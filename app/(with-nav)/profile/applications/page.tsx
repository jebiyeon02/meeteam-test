import RequireAuth from '@/components/features/auth/RequireAuth';
import MyApplicationsPage from '@/components/features/profile/MyApplicationsPage';

export default function Page() {
  return (
    <RequireAuth>
      <MyApplicationsPage />
    </RequireAuth>
  );
}
