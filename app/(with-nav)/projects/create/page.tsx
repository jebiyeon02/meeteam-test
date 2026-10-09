import RequireAuth from '@/components/features/auth/RequireAuth';
import CreateProjectPage from '@/components/features/project/create/CreateProjectPage';

export default function Page() {
  return (
    <RequireAuth>
      <CreateProjectPage />
    </RequireAuth>
  );
}
