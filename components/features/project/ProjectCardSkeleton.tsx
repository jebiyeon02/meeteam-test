export function ProjectCardSkeleton() {
  return (
    <div className="flex h-95 w-full flex-col justify-between overflow-hidden rounded-3xl border border-mt-border bg-mt-white p-6 shadow-sm animate-pulse">
      <div className="space-y-4">
        <div className="h-40 w-full rounded-2xl bg-mt-bg-soft" />

        <div className="flex items-center justify-between gap-4">
          <div className="h-7 w-20 rounded-full bg-mt-bg-soft" />
          <div className="h-5 w-24 rounded-md bg-mt-bg-soft" />
        </div>

        <div className="space-y-2">
          <div className="h-7 w-4/5 rounded-md bg-mt-bg-soft" />
          <div className="h-7 w-2/3 rounded-md bg-mt-bg-soft" />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-mt-bg-soft" />
          <div className="h-4 w-20 rounded-md bg-mt-bg-soft" />
        </div>

        <div className="space-y-2">
          <div className="h-4 w-16 rounded-md bg-mt-bg-soft" />
          <div className="h-1.5 w-20 rounded-full bg-mt-bg-soft" />
        </div>
      </div>
    </div>
  );
}
