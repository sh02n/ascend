type SkeletonPlaceholderProps = {
  variant: "upload" | "table" | "metrics" | "analysis" | "mapping" | "ready";
};

function SkeletonLine({ width = "w-full" }: { width?: string }) {
  return <div className={`h-3 rounded-full bg-slate-200 ${width}`} />;
}

export function SkeletonPlaceholder({ variant }: SkeletonPlaceholderProps) {
  if (variant === "upload") {
    return (
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
          <div className="w-full max-w-sm space-y-3">
            <div className="mx-auto h-10 w-10 rounded-lg border border-slate-200 bg-white" />
            <SkeletonLine />
            <SkeletonLine width="mx-auto w-2/3" />
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="space-y-3">
            <SkeletonLine />
            <SkeletonLine width="w-5/6" />
            <SkeletonLine width="w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "table" || variant === "mapping") {
    return (
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {Array.from({ length: variant === "mapping" ? 5 : 4 }).map((_, index) => (
          <div
            key={index}
            className="grid grid-cols-4 gap-4 border-b border-slate-200 px-4 py-3 last:border-b-0"
          >
            <SkeletonLine />
            <SkeletonLine />
            <SkeletonLine />
            <SkeletonLine width="w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "metrics" || variant === "ready") {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <SkeletonLine width="w-1/2" />
            <div className="mt-5 h-8 rounded-md bg-slate-200" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="space-y-3">
        <SkeletonLine width="w-1/3" />
        <SkeletonLine />
        <SkeletonLine width="w-11/12" />
        <SkeletonLine width="w-2/3" />
      </div>
    </div>
  );
}
