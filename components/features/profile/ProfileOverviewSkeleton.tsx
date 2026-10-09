import SkeletonBlock from '@/components/shared/SkeletonBlock';

export default function ProfileOverviewSkeleton() {
  return (
    <section className="bg-mt-white px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="rounded-3xl border border-mt-border bg-mt-white p-6 shadow-md">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <SkeletonBlock className="h-28 w-28 rounded-full" />
            <div className="flex-1 space-y-4">
              <SkeletonBlock className="h-8 w-48" />
              <SkeletonBlock className="h-5 w-64 max-w-full" />
              <SkeletonBlock className="h-10 w-36 rounded-2xl" />
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[309px_minmax(0,1fr)]">
          <div className="flex flex-col gap-6">
            <article className="rounded-2xl border border-mt-border bg-mt-white p-5 shadow-sm">
              <SkeletonBlock className="h-5 w-28" />
              <SkeletonBlock className="mt-4 h-12 w-full rounded-2xl" />
            </article>

            <article className="rounded-2xl border border-mt-border bg-mt-white p-5 shadow-sm">
              <SkeletonBlock className="h-5 w-24" />
              <div className="mt-5 space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={`profile-info-skeleton-${index}`} className="space-y-2">
                    <SkeletonBlock className="h-4 w-20" />
                    <SkeletonBlock className="h-6 w-full" />
                  </div>
                ))}
              </div>
            </article>
          </div>

          <div className="flex flex-col gap-6">
            <article className="rounded-2xl border border-mt-border bg-mt-white p-5 shadow-sm">
              <SkeletonBlock className="h-5 w-32" />
              <div className="mt-5 flex flex-wrap gap-2">
                {Array.from({ length: 8 }).map((_, index) => (
                  <SkeletonBlock
                    key={`profile-skill-skeleton-${index}`}
                    className="h-8 w-20 rounded-md"
                  />
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-mt-border bg-mt-white p-5 shadow-sm">
              <SkeletonBlock className="h-5 w-36" />
              <div className="mt-5 space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <SkeletonBlock
                    key={`profile-project-skeleton-${index}`}
                    className="h-24 w-full rounded-2xl"
                  />
                ))}
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
