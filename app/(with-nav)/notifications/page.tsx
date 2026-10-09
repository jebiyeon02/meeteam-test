import RequireAuth from '@/components/features/auth/RequireAuth';
import NotificationsPage from '@/components/features/notification/NotificationsPage';

export default function Page() {
  return (
    <RequireAuth>
      <NotificationsPage />
    </RequireAuth>
  );
}
