import RequireAuth from '@/components/features/auth/RequireAuth';
import ProjectApplicationDetailPage from '@/components/features/project/apply/ProjectApplicationDetailPage';

export default async function Page({
  params,
}: {
  params: Promise<{ projectId: string; applicationId: string }>;
}) {
  const { projectId, applicationId } = await params;

  return (
    <RequireAuth>
      <ProjectApplicationDetailPage projectId={projectId} applicationId={applicationId} />
    </RequireAuth>
  );
}
