import SkeletonBlock from '@/components/shared/SkeletonBlock';

export function ProjectManageOverviewSkeleton() {
  return (
    <div className="space-y-6 md:space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <article
            key={`project-manage-summary-skeleton-${index}`}
            className="rounded-2xl border border-mt-border/40 bg-mt-white p-5 shadow-sm"
          >
            <SkeletonBlock className="h-5 w-24" />
            <SkeletonBlock className="mt-2 h-8 w-20" />
          </article>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-mt-border/40 bg-mt-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-mt-border/40 bg-mt-bg-soft/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <SkeletonBlock className="h-6 w-24" />
          <SkeletonBlock className="h-4 w-32" />
        </div>

        <ul>
          {Array.from({ length: 4 }).map((_, index) => (
            <li
              key={`project-member-row-skeleton-${index}`}
              className={`${index === 0 ? '' : 'border-t border-mt-border/40'} px-6 py-6`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <SkeletonBlock className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <SkeletonBlock className="h-5 w-28" />
                    <SkeletonBlock className="h-4 w-40" />
                  </div>
                </div>
                <SkeletonBlock className="h-8 w-16 rounded-lg" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function ProjectManageEditSkeleton() {
  return (
    <section className="mx-auto w-full max-w-5xl rounded-4xl bg-mt-white px-6 py-8 shadow-sm md:px-10 md:py-12">
      <div className="mb-8 space-y-3 text-center">
        <SkeletonBlock className="mx-auto h-8 w-56" />
        <SkeletonBlock className="mx-auto h-5 w-80 max-w-full" />
      </div>

      <div className="space-y-8">
        <SkeletonBlock className="h-56 w-full rounded-3xl" />

        <div className="grid gap-5 md:grid-cols-2">
          <SkeletonBlock className="h-14 w-full rounded-2xl" />
          <SkeletonBlock className="h-14 w-full rounded-2xl" />
        </div>

        <SkeletonBlock className="h-32 w-full rounded-2xl" />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonBlock
              key={`project-category-skeleton-${index}`}
              className="h-24 w-full rounded-2xl"
            />
          ))}
        </div>

        <div className="space-y-4">
          <SkeletonBlock className="h-5 w-32" />
          <SkeletonBlock className="h-16 w-full rounded-2xl" />
          <SkeletonBlock className="h-16 w-full rounded-2xl" />
        </div>

        <SkeletonBlock className="mx-auto h-14 w-full max-w-md rounded-2xl" />
      </div>
    </section>
  );
}
