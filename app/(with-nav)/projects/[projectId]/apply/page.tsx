import RequireAuth from '@/components/features/auth/RequireAuth';
import ProjectApplyPage from '@/components/features/project/apply/ProjectApplyPage';

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{
    jobField?: string;
    jobPosition?: string;
    jobPositionCode?: string;
  }>;
}) {
  const { projectId } = await params;
  const { jobField, jobPosition, jobPositionCode } = await searchParams;

  return (
    <RequireAuth>
      <ProjectApplyPage
        projectId={projectId}
        initialJobField={jobField}
        initialJobPosition={jobPosition}
        initialJobPositionCode={jobPositionCode}
      />
    </RequireAuth>
  );
}
