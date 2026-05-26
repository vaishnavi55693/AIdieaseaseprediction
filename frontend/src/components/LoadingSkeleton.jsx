export function SkeletonBlock({ className = "" }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-200/80 dark:bg-slate-800 ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="glass-panel p-5">
      <SkeletonBlock className="h-4 w-28" />
      <SkeletonBlock className="mt-4 h-10 w-24" />
      <SkeletonBlock className="mt-6 h-24 w-full rounded-3xl" />
    </div>
  );
}
