import { prisma } from "@/lib/db";
import Link from "next/link";
import { Sparkles, Calendar, TrendingUp } from "lucide-react";
import SidebarLoadMore from "./SidebarLoadMore";
import SidebarPoller from "./SidebarPoller";

export const revalidate = 0; // Disable cache so sidebar stays fresh

export default async function Sidebar() {
  // Fetch topics sorted by the latest entry creation time or update time
  const topics = await prisma.topic.findMany({
    where: {
      slug: { not: "pozkes-galeri" }
    },
    include: {
      poll: {
        select: { id: true }
      },
      _count: {
        select: { entries: true }
      }
    },
    orderBy: {
      updatedAt: "desc"
    },
    take: 35
  });

  return (
    <aside className="w-full md:w-64 lg:w-72 shrink-0 border-r border-zinc-800 bg-zinc-950 p-2.5 md:p-3 md:h-[calc(100vh-88px)] overflow-y-auto sticky top-[88px] order-last md:order-first scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
      {/* Sidebar header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-900 mb-3">
        <h2 className="text-xs font-semibold tracking-wider uppercase text-zinc-450 flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-lime-400" />
          <span>vızıldayanlar</span>
        </h2>
        <span className="text-[9px] bg-lime-500/10 text-lime-400 border border-lime-500/20 px-1.5 py-0.5 rounded-full font-bold">
          canlı
        </span>
      </div>

      {/* Topic List */}
      <div className="flex flex-col space-y-0.5">
        {topics.length === 0 ? (
          <div className="text-center py-8 text-[11px] text-zinc-550 italic">
            Burada henüz vızıltı yok zzz.
          </div>
        ) : (
          <>
            {topics.map((topic) => (
              <Link
                key={topic.id}
                href={`/baslik/${topic.slug}`}
                className="flex items-center justify-between px-2 py-1 rounded-lg text-xs sm:text-sm text-zinc-350 hover:text-white hover:bg-zinc-900 transition-all group active:scale-[0.99]"
              >
                <span className="truncate pr-1.5 group-hover:translate-x-0.5 transition-transform duration-100 flex items-center gap-1">
                  <span className="truncate">{topic.title}</span>
                  {topic.poll && (
                    <span className="text-[10px] shrink-0" title="Anket">📊</span>
                  )}
                </span>
                <span className="shrink-0 text-[10px] font-semibold bg-zinc-900 group-hover:bg-lime-950 border border-zinc-850 group-hover:border-lime-500/30 text-zinc-550 group-hover:text-lime-400 px-1.5 py-0.5 rounded-md min-w-[18px] text-center transition-all">
                  {topic._count.entries}
                </span>
              </Link>
            ))}
            <SidebarLoadMore initialCount={topics.length} />
          </>
        )}
      </div>

      {/* Fun Footer info */}
      <div className="mt-6 pt-3 border-t border-zinc-900 text-center">
        <p className="text-[9px] text-zinc-650">
          sözlükzzz © 2026 • vızzz! • Kurucu Doğu Demir
        </p>
      </div>

      {/* Background poller to refresh active topics/feed automatically */}
      <SidebarPoller />
    </aside>
  );
}
