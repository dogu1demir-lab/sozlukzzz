export default function PozKesLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Title Header */}
      <div className="border-b border-zinc-900 pb-3 flex items-center justify-between">
        <div className="h-6 w-32 bg-zinc-900 rounded-sm animate-pulse"></div>
        <div className="h-4 w-44 bg-zinc-900/40 rounded-sm animate-pulse"></div>
      </div>

      {/* Pozkes Grid Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="border border-zinc-900 bg-zinc-950/40 rounded-sm overflow-hidden flex flex-col space-y-3 pb-4"
          >
            {/* Card Header info */}
            <div className="p-3 border-b border-zinc-900/60 flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-full bg-zinc-900 animate-pulse shrink-0"></div>
              <div className="space-y-1 flex-1">
                <div className="h-3 w-20 bg-zinc-900 rounded-sm animate-pulse"></div>
                <div className="h-2 w-12 bg-zinc-900/40 rounded-sm animate-pulse"></div>
              </div>
              <div className="h-3.5 w-12 bg-zinc-900/40 rounded-sm animate-pulse"></div>
            </div>

            {/* Photo Area Box (Aspect Ratio Square) */}
            <div className="w-full aspect-square bg-zinc-900/80 animate-pulse relative flex items-center justify-center">
              {/* Spinning skull loader */}
              <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                <div className="absolute inset-0 rounded-full border-2 border-zinc-900/80 border-t-lime-500 animate-spin" style={{ animationDuration: "0.8s" }}></div>
                <span className="text-base select-none" role="img" aria-label="skull">💀</span>
              </div>
            </div>

            {/* Bottom Actions and Bio */}
            <div className="px-3 space-y-2">
              <div className="flex items-center gap-3 pt-1">
                <div className="h-6 w-16 bg-zinc-900/60 rounded-full animate-pulse"></div>
                <div className="h-6 w-12 bg-zinc-900/60 rounded-full animate-pulse"></div>
                <div className="h-6 w-16 bg-zinc-900/60 rounded-full animate-pulse ml-auto"></div>
              </div>

              {/* Caption text */}
              <div className="h-3 w-[90%] bg-zinc-900/60 rounded-sm animate-pulse mt-2"></div>
              <div className="h-3 w-[60%] bg-zinc-900/40 rounded-sm animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
