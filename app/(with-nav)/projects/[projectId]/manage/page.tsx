import RequireAuth from '@/components/features/auth/RequireAuth';
import ProjectManageOverview from '@/components/features/project/manage/ProjectManageOverview';

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  return (
    <RequireAuth>
      <ProjectManageOverview projectId={projectId} />
    </RequireAuth>
  );
}
