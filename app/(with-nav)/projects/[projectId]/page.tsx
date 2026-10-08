import ProjectSummaryPage from '@/components/features/project/detail/ProjectSummaryPage';

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return <ProjectSummaryPage key={projectId} projectId={Number(projectId)} />;
}
