import ProjectApplicationDetailPage from '@/components/features/project/apply/ProjectApplicationDetailPage';

export default async function Page({
  params,
}: {
  params: Promise<{ projectId: string; applicationId: string }>;
}) {
  const { projectId, applicationId } = await params;
  return (
    <ProjectApplicationDetailPage
      key={`${projectId}-${applicationId}`}
      projectId={Number(projectId)}
      applicationId={Number(applicationId)}
    />
  );
}
