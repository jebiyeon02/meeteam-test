import SkeletonBlock from '@/components/shared/SkeletonBlock';

export default function ProjectDetailSkeleton() {
  return (
    <section className="mx-auto w-full max-w-6xl pb-20">
      <header className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex gap-2">
            <SkeletonBlock className="h-8 w-24 rounded-full" />
            <SkeletonBlock className="h-8 w-20 rounded-full" />
          </div>
          <SkeletonBlock className="mt-5 h-11 w-full max-w-md" />
          <SkeletonBlock className="mt-3 h-6 w-full max-w-xl" />
          <div className="mt-4 flex items-center gap-2">
            <SkeletonBlock className="h-8 w-8 rounded-2xl" />
            <SkeletonBlock className="h-5 w-40" />
          </div>
        </div>

        <div className="grid w-full grid-cols-2 gap-3 md:w-72">
          <SkeletonBlock className="h-11 w-full rounded-xl" />
          <SkeletonBlock className="h-11 w-full rounded-xl" />
        </div>
      </header>

      <div className="mt-6 space-y-4">
        <div className="rounded-3xl border border-mt-border bg-mt-white p-3 shadow-sm">
          <SkeletonBlock className="aspect-[16/6] w-full rounded-2xl" />
        </div>

        <div className="rounded-3xl border border-mt-border bg-mt-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="grid gap-4 sm:grid-cols-3 lg:flex lg:gap-8">
              <SkeletonBlock className="h-12 w-28" />
              <SkeletonBlock className="h-12 w-28" />
              <SkeletonBlock className="h-12 w-36" />
            </div>
            <SkeletonBlock className="h-12 w-full rounded-xl lg:w-28" />
          </div>
        </div>
      </div>

      <div className="mt-10 space-y-6 pb-14">
        <SkeletonBlock className="h-14 w-full rounded-2xl" />
        <article className="rounded-3xl border border-mt-border bg-mt-white p-6 shadow-sm">
          <SkeletonBlock className="h-6 w-32" />
          <div className="mt-5 space-y-3">
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-4/5" />
          </div>
        </article>
      </div>
    </section>
  );
}
