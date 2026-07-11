export default function AuthorLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Profile Header Card Skeleton */}
      <div className="border border-zinc-900 bg-zinc-900/10 p-5 space-y-4 rounded-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          {/* Large Avatar with spinning skull */}
          <div className="relative h-16 w-16 flex items-center justify-center shrink-0">
            {/* Spinning neon outer ring */}
            <div className="absolute inset-0 rounded-full border-2 border-zinc-900/80 border-t-lime-500 animate-spin" style={{ animationDuration: "0.8s" }}></div>
            {/* Pulsing avatar background */}
            <div className="absolute inset-1 rounded-full bg-zinc-900 animate-pulse"></div>
            {/* Skull icon */}
            <span className="text-xl select-none z-10 animate-pulse" role="img" aria-label="skull">💀</span>
          </div>
          
          <div className="flex-1 space-y-2 text-center sm:text-left min-w-0">
            {/* Display name */}
            <div className="h-5 w-32 bg-zinc-900 rounded-sm animate-pulse mx-auto sm:mx-0"></div>
            {/* Username */}
            <div className="h-4 w-24 bg-zinc-900/60 rounded-sm animate-pulse mx-auto sm:mx-0"></div>
            {/* Rank info */}
            <div className="h-4 w-40 bg-zinc-900/40 rounded-sm animate-pulse mx-auto sm:mx-0 mt-1"></div>
          </div>

          {/* Action button on right */}
          <div className="h-8 w-24 bg-zinc-900/60 rounded-full animate-pulse shrink-0"></div>
        </div>

        {/* Bio paragraph */}
        <div className="space-y-2 pt-2 border-t border-zinc-900/50">
          <div className="h-3 w-[85%] bg-zinc-900/60 rounded-sm animate-pulse"></div>
          <div className="h-3 w-[60%] bg-zinc-900/40 rounded-sm animate-pulse"></div>
        </div>

        {/* Stats footer (following/followers counters) */}
        <div className="flex justify-center sm:justify-start gap-4 pt-1">
          <div className="h-4 w-20 bg-zinc-900/50 rounded-sm animate-pulse"></div>
          <div className="h-4 w-20 bg-zinc-900/50 rounded-sm animate-pulse"></div>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="border-b border-zinc-900/80 flex gap-4">
        <div className="h-9 w-24 bg-zinc-900/40 rounded-t-sm animate-pulse"></div>
        <div className="h-9 w-24 bg-zinc-900/20 rounded-t-sm animate-pulse"></div>
        <div className="h-9 w-24 bg-zinc-900/20 rounded-t-sm animate-pulse"></div>
      </div>

      {/* Entries items loading list */}
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, idx) => (
          <div key={idx} className="border border-zinc-900/40 bg-zinc-900/5 p-4 space-y-3 rounded-sm">
            <div className="flex justify-between">
              <div className="h-4 w-36 bg-zinc-900 rounded-sm animate-pulse"></div>
              <div className="h-3 w-16 bg-zinc-900/40 rounded-sm animate-pulse"></div>
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-full bg-zinc-900/60 rounded-sm animate-pulse"></div>
              <div className="h-3 w-[90%] bg-zinc-900/60 rounded-sm animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
