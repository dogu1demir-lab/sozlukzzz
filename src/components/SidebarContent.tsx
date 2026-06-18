"use client";

import { useEffect, useState, useTransition } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { getDynamicSidebarTopicsAction } from "@/app/actions";

interface TopicItem {
  id: string;
  title: string;
  slug: string;
  poll: { id: string } | null;
  entryCount: number;
}

export default function SidebarContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const urlTab = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState<string>("bugun");
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // 1. Detect and preserve tab state across page transitions
  useEffect(() => {
    let tab = "bugun";
    
    if (urlTab) {
      tab = urlTab;
      if (typeof window !== "undefined") {
        sessionStorage.setItem("lastActiveTab", urlTab);
      }
    } else if (pathname === "/") {
      // If we go back to the home page root without query params, force reset to "bugun"
      tab = "bugun";
      if (typeof window !== "undefined") {
        sessionStorage.setItem("lastActiveTab", "bugun");
      }
    } else {
      // On other pages (/baslik/[slug], /yazar/[username], etc.), look up sessionStorage
      if (typeof window !== "undefined") {
        const storedTab = sessionStorage.getItem("lastActiveTab");
        if (storedTab) {
          tab = storedTab;
        }
      }
    }
    
    setActiveTab(tab);
  }, [urlTab, pathname]);

  // Fetch topics for the active tab
  const fetchTopics = async (tabName: string, isRefresh = false) => {
    try {
      const result = await getDynamicSidebarTopicsAction(tabName, 0, 35);
      if (result.success && result.topics) {
        const formatted = result.topics as TopicItem[];
        setTopics(formatted);
        setOffset(formatted.length);
        setHasMore(formatted.length >= 35);
      }
    } catch (err) {
      console.error("Sidebar fetch error:", err);
    } finally {
      if (!isRefresh) {
        setIsLoading(false);
      }
    }
  };

  // Trigger fetch when activeTab changes
  useEffect(() => {
    setIsLoading(true);
    setTopics([]);
    setOffset(0);
    setHasMore(true);
    
    startTransition(() => {
      fetchTopics(activeTab);
    });
  }, [activeTab]);

  // Background poller to fetch updates silently
  useEffect(() => {
    let lastActivity = Date.now();

    const handleActivity = () => {
      lastActivity = Date.now();
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keypress", handleActivity);
    window.addEventListener("scroll", handleActivity);
    window.addEventListener("click", handleActivity);

    const interval = setInterval(() => {
      if (document.hidden) return;

      const idleTime = Date.now() - lastActivity;
      if (idleTime > 3 * 60 * 1000) return;

      fetchTopics(activeTab, true);
    }, 30000);

    return () => {
      clearInterval(interval);
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keypress", handleActivity);
      window.removeEventListener("scroll", handleActivity);
      window.removeEventListener("click", handleActivity);
    };
  }, [activeTab]);

  const handleLoadMore = async () => {
    if (isLoading || !hasMore) return;
    
    try {
      const result = await getDynamicSidebarTopicsAction(activeTab, offset, 35);
      if (result.success && result.topics) {
        const newTopics = result.topics as TopicItem[];
        if (newTopics.length === 0) {
          setHasMore(false);
        } else {
          setTopics((prev) => [...prev, ...newTopics]);
          setOffset((prev) => prev + newTopics.length);
          if (newTopics.length < 35) {
            setHasMore(false);
          }
        }
      }
    } catch (err) {
      console.error("Sidebar load more error:", err);
    }
  };

  return (
    <>
      {/* Sidebar header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-900 mb-3">
        <h2 className="text-xs font-semibold tracking-wider uppercase text-zinc-400 flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-lime-400" />
          <span>vızıldayanlar</span>
        </h2>
        <span className="text-[9px] bg-lime-500/10 text-lime-400 border border-lime-500/20 px-1.5 py-0.5 rounded-full font-bold animate-pulse">
          canlı
        </span>
      </div>

      {/* Topic List */}
      <div className="flex flex-col space-y-0.5">
        {isLoading ? (
          <div className="space-y-2 py-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center px-2 py-1">
                <div className="h-4 w-32 bg-zinc-900 animate-pulse rounded"></div>
                <div className="h-4 w-6 bg-zinc-900 animate-pulse rounded"></div>
              </div>
            ))}
          </div>
        ) : topics.length === 0 ? (
          <div className="text-center py-8 text-[11px] text-zinc-500 italic">
            Burada henüz vızıltı yok zzz.
          </div>
        ) : (
          <>
            {topics.map((topic) => (
              <Link
                key={topic.id}
                href={`/baslik/${topic.slug}`}
                className="flex items-center justify-between px-2 py-1 rounded-lg text-xs sm:text-sm text-zinc-300 hover:text-white hover:bg-zinc-900 transition-all group active:scale-[0.99]"
              >
                <span className="truncate pr-1.5 group-hover:translate-x-0.5 transition-transform duration-100 flex items-center gap-1">
                  <span className="truncate">{topic.title}</span>
                  {topic.poll && (
                    <span className="text-[10px] shrink-0" title="Anket">📊</span>
                  )}
                </span>
                <span className="shrink-0 text-[10px] font-semibold bg-zinc-900 group-hover:bg-lime-950 border border-zinc-850 group-hover:border-lime-500/30 text-zinc-500 group-hover:text-lime-400 px-1.5 py-0.5 rounded-md min-w-[18px] text-center transition-all">
                  {topic.entryCount}
                </span>
              </Link>
            ))}

            {/* Load more button */}
            <div className="mt-3 px-1">
              {hasMore ? (
                <button
                  onClick={handleLoadMore}
                  className="w-full text-center py-2 px-3 rounded-lg border border-dashed border-zinc-800 hover:border-lime-500/30 bg-zinc-900/10 hover:bg-lime-500/5 text-[11px] font-bold text-zinc-400 hover:text-lime-400 transition-all active:scale-[0.98] cursor-pointer"
                >
                  daha fazla vızzz
                </button>
              ) : (
                <div className="text-center py-2 text-[10px] text-zinc-600 italic">
                  Tüm vızıltılar yüklendi zzz.
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Fun Footer info */}
      <div className="mt-6 pt-3 border-t border-zinc-900 text-center">
        <p className="text-[9px] text-zinc-650">
          sözlükzzz © 2026 • vızzz! • Kurucu Doğu Demir
        </p>
      </div>
    </>
  );
}
