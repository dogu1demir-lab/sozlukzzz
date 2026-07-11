export default function TopicLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Topic Title Header Skeleton */}
      <div className="border-b border-zinc-900 pb-3 flex items-center justify-between gap-4">
        <div className="h-7 w-[45%] min-w-[150px] bg-zinc-900 rounded-sm animate-pulse"></div>
        <div className="h-5 w-12 bg-zinc-900/60 rounded-sm animate-pulse"></div>
      </div>

      {/* Entries List Skeleton */}
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div
            key={idx}
            className="border-b border-zinc-900/40 pb-5 space-y-3"
          >
            {/* Header info */}
            <div className="flex items-center gap-2">
              {/* Avatar circle */}
              <div className="h-6 w-6 rounded-full bg-zinc-900 animate-pulse shrink-0"></div>
              {/* Author name */}
              <div className="h-3.5 w-24 bg-zinc-900 rounded-sm animate-pulse"></div>
              {/* Rank label */}
              <div className="h-3 w-10 bg-zinc-900/40 rounded-sm animate-pulse"></div>
              {/* Date */}
              <div className="h-3.5 w-16 bg-zinc-900/40 rounded-sm animate-pulse ml-auto"></div>
            </div>

            {/* Content paragraph */}
            <div className="space-y-2">
              <div className="h-3 w-full bg-zinc-900 rounded-sm animate-pulse"></div>
              <div className="h-3 w-[95%] bg-zinc-900 rounded-sm animate-pulse"></div>
              <div className="h-3 w-[80%] bg-zinc-900 rounded-sm animate-pulse"></div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-4 pt-2">
              <div className="h-7 w-12 bg-zinc-900/60 rounded-full animate-pulse"></div>
              <div className="h-7 w-12 bg-zinc-900/60 rounded-full animate-pulse"></div>
              <div className="h-7 w-8 bg-zinc-900/60 rounded-full animate-pulse"></div>
              <div className="h-7 w-16 bg-zinc-900/40 rounded-full animate-pulse ml-auto"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
