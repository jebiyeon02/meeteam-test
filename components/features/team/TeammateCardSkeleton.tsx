export function TeammateCardSkeleton() {
  return (
    <div className="min-h-72 rounded-2xl border border-mt-border bg-mt-white px-6 pt-6 pb-14 shadow-sm animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="h-16 w-16 rounded-2xl bg-mt-bg-soft" />
        <div className="h-6 w-20 rounded-lg bg-mt-bg-soft" />
      </div>

      <div className="mt-4 space-y-2">
        <div className="h-6 w-24 rounded-md bg-mt-bg-soft" />
        <div className="h-4 w-32 rounded-md bg-mt-bg-soft" />
      </div>

      <div className="mt-5 space-y-2">
        <div className="h-4 w-20 rounded-md bg-mt-bg-soft" />
        <div className="flex gap-2">
          <div className="h-6 w-14 rounded-md bg-mt-badge-bg" />
          <div className="h-6 w-16 rounded-md bg-mt-bg-soft" />
        </div>
      </div>
    </div>
  );
}
