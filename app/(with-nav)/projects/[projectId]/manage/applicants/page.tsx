import RequireAuth from '@/components/features/auth/RequireAuth';
import ProjectManageApplicants from '@/components/features/project/manage/ProjectManageApplicants';

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  return (
    <RequireAuth>
      <ProjectManageApplicants projectId={projectId} />
    </RequireAuth>
  );
}
