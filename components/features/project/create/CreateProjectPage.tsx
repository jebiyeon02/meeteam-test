'use client';

import { useRouter } from 'next/navigation';
import ProjectForm from '@/components/features/project/create/ProjectForm';
import { buildProjectCreatePayload, createProject } from '@/components/features/project/projectApi';

export default function CreateProjectPage() {
  const router = useRouter();

  return (
    <ProjectForm
      variant="create"
      onSubmit={async (values, { jobFields }) => {
        const payload = buildProjectCreatePayload(values, jobFields);
        const response = await createProject(payload, values.coverImage);

        router.push(`/projects/${response.id}`);
      }}
    />
  );
}
