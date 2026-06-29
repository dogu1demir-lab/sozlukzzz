"use client";

import { useEffect, useState, useTransition, useRef } from "react";
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
  lastEntryAt?: string;
  isYesterday?: boolean;
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
  const [buzzingTopics, setBuzzingTopics] = useState<Record<string, boolean>>({});

  // Ref to track topics length in background interval to avoid stale closures
  const topicsLengthRef = useRef(0);
  useEffect(() => {
    topicsLengthRef.current = topics.length;
  }, [topics]);

  // Listen to live topic-buzz events (anlık sinyaller)
  useEffect(() => {
    const handleBuzz = (e: Event) => {
      const topicId = (e as CustomEvent).detail?.topicId;
      if (topicId) {
        setBuzzingTopics(prev => ({ ...prev, [topicId]: true }));
        setTimeout(() => {
          setBuzzingTopics(prev => {
            const copy = { ...prev };
            delete copy[topicId];
            return copy;
          });
        }, 60000); // 60 seconds
      }
    };

    window.addEventListener("topic-buzz", handleBuzz);
    return () => window.removeEventListener("topic-buzz", handleBuzz);
  }, []);

  // Check recently updated topics on initial mount / page load
  useEffect(() => {
    const now = Date.now();
    const timeouts: NodeJS.Timeout[] = [];

    topics.forEach((topic) => {
      if (!topic.lastEntryAt) return;
      const updatedTime = new Date(topic.lastEntryAt).getTime();
      const elapsed = now - updatedTime;
      const remaining = 60000 - elapsed; // 60 seconds window

      if (remaining > 0) {
        setBuzzingTopics((prev) => ({ ...prev, [topic.id]: true }));
        const t = setTimeout(() => {
          setBuzzingTopics((prev) => {
            const copy = { ...prev };
            delete copy[topic.id];
            return copy;
          });
        }, remaining);
        timeouts.push(t);
      }
    });

    return () => {
      timeouts.forEach((t) => clearTimeout(t));
    };
  }, [topics]);

  // 1. Detect and preserve tab state across page transitions
  useEffect(() => {
    let tab = "bugun";
    const cleanPath = pathname.replace(/^\//, "");
    const VALID_TABS = ["bugun", "gundem", "takip", "begenilen", "goruntulenen"];

    if (VALID_TABS.includes(cleanPath)) {
      tab = cleanPath;
      if (typeof window !== "undefined") {
        sessionStorage.setItem("lastActiveTab", cleanPath);
      }
    } else if (pathname === "/" || cleanPath === "") {
      tab = "bugun";
      if (typeof window !== "undefined") {
        sessionStorage.setItem("lastActiveTab", "bugun");
      }
    } else {
      // On other pages (/baslik/[slug], /yazar/[username], etc.), look up sessionStorage
      if (typeof window !== "undefined") {
        const storedTab = sessionStorage.getItem("lastActiveTab");
        if (storedTab && VALID_TABS.includes(storedTab)) {
          tab = storedTab;
        }
      }
    }
    
    setActiveTab(tab);
  }, [pathname]);

  const getMaxTopicsLimit = (tab: string): number => {
    if (tab === "gundem" || tab === "goruntulenen" || tab === "begenilen") {
      return 100;
    }
    if (tab === "pozkes") {
      return 50;
    }
    return Infinity; // Today and Follow are unlimited
  };

  // Fetch topics for the active tab
  const fetchTopics = async (tabName: string, isRefresh = false) => {
    try {
      const initialLimit = tabName === "bugun" ? 30 : 12;
      const result = await getDynamicSidebarTopicsAction(tabName, 0, initialLimit);
      if (result.success && result.topics) {
        let formatted = result.topics as TopicItem[];
        const maxLimit = getMaxTopicsLimit(tabName);
        
        if (formatted.length >= maxLimit) {
          formatted = formatted.slice(0, maxLimit);
          setTopics(formatted);
          setOffset(formatted.length);
          setHasMore(false);
        } else {
          setTopics(formatted);
          setOffset(formatted.length);
          setHasMore(formatted.length >= initialLimit);
        }
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
      if (topicsLengthRef.current > 30) return; // Skip background poller refresh if user has loaded page 2+

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
    
    const maxLimit = getMaxTopicsLimit(activeTab);
    const remainingAllowed = maxLimit - offset;
    
    if (remainingAllowed <= 0) {
      setHasMore(false);
      return;
    }
    
    const fetchLimit = Math.min(12, remainingAllowed);
    
    try {
      const result = await getDynamicSidebarTopicsAction(activeTab, offset, fetchLimit);
      if (result.success && result.topics) {
        const newTopics = result.topics as TopicItem[];
        if (newTopics.length === 0) {
          setHasMore(false);
        } else {
          const combinedTopics = [...topics, ...newTopics];
          
          if (combinedTopics.length >= maxLimit) {
            const truncated = combinedTopics.slice(0, maxLimit);
            setTopics(truncated);
            setOffset(truncated.length);
            setHasMore(false);
          } else {
            setTopics(combinedTopics);
            setOffset(combinedTopics.length);
            if (newTopics.length < fetchLimit) {
              setHasMore(false);
            }
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
        <span className="text-[9px] bg-lime-500/10 text-lime-300 border border-lime-500/20 px-1.5 py-0.5 rounded-none font-bold animate-pulse">
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
            {topics.map((topic, index) => {
              const showYesterdayDivider = activeTab === "bugun" && topic.isYesterday && (index === 0 || !topics[index - 1].isYesterday);
              return (
                <div key={topic.id}>
                  {showYesterdayDivider && (
                    <div className="flex items-center justify-center gap-2 my-4 px-2 select-none">
                      <div className="h-[1px] flex-1 bg-zinc-900"></div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-950 px-2.5 py-0.5 border border-zinc-900 rounded-sm">
                        dünküler
                      </span>
                      <div className="h-[1px] flex-1 bg-zinc-900"></div>
                    </div>
                  )}
                  <Link
                    href={`/baslik/${topic.slug}`}
                    prefetch={false}
                    className="sidebar-topic-item flex items-center justify-between px-3 py-2 rounded-none text-xs sm:text-sm transition-all group active:scale-[0.99] mb-1.5 border text-zinc-300 hover:text-white bg-zinc-900/10 hover:bg-zinc-900/30 hover:border-zinc-800/80"
                  >
                    <span className="pr-1.5 flex-1 min-w-0 group-hover:translate-x-0.5 transition-transform duration-100 flex items-center gap-1.5 flex-wrap">
                      <span className="break-words whitespace-normal">{topic.title}</span>
                      {buzzingTopics[topic.id] && (
                        <span className="text-[11px] animate-bounce select-none shrink-0" title="Yeni vızıltı! zzz">🔥</span>
                      )}
                      {topic.poll && (
                        <span className="text-[10px] shrink-0 pt-0.5" title="Anket">📊</span>
                      )}
                    </span>
                    <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-none min-w-[18px] text-center transition-all border font-semibold bg-zinc-900/60 group-hover:bg-lime-950 border-zinc-850 group-hover:border-lime-500/30 text-zinc-400 group-hover:text-lime-400">
                      {topic.entryCount}
                    </span>
                  </Link>
                </div>
              );
            })}

            {/* Load more button */}
            <div className="mt-3">
              {hasMore ? (
                <button
                  onClick={handleLoadMore}
                  className="w-full text-center py-2 px-3 rounded-none border border-dashed border-zinc-800 hover:border-lime-500/30 bg-zinc-900/10 hover:bg-lime-500/5 text-[11px] font-bold text-zinc-400 hover:text-lime-400 transition-all active:scale-[0.98] cursor-pointer"
                >
                  daha fazla vızzz
                </button>
              ) : (
                <div className="text-center py-2 text-[10px] text-zinc-400 italic">
                  Tüm vızıltılar yüklendi zzz.
                </div>
              )}
            </div>
          </>
        )}
      </div>

    </>
  );
}
