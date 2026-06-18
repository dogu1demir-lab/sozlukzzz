"use client";

import { useState } from "react";
import Link from "next/link";
import { getMoreTopicsAction } from "@/app/actions";
import { playBuzzSound } from "@/lib/utils";

interface TopicItem {
  id: string;
  title: string;
  slug: string;
  poll: { id: string } | null;
  _count: { entries: number };
}

interface SidebarLoadMoreProps {
  initialCount: number;
}

export default function SidebarLoadMore({ initialCount }: SidebarLoadMoreProps) {
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [offset, setOffset] = useState(initialCount);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadMore = async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    playBuzzSound();

    try {
      const result = await getMoreTopicsAction(offset, 35);
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
      } else {
        console.error(result.error || "Başlıklar yüklenemedi zzz.");
      }
    } catch (err) {
      console.error("Hata:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Dynamic loaded topics list */}
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

      {/* Button container */}
      <div className="mt-3 px-1">
        {hasMore ? (
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className="w-full text-center py-2 px-3 rounded-lg border border-dashed border-zinc-800 hover:border-lime-500/30 bg-zinc-900/10 hover:bg-lime-500/5 text-[11px] font-bold text-zinc-400 hover:text-lime-400 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Vızıldanıyor..." : "daha fazla vızzz"}
          </button>
        ) : (
          <div className="text-center py-2 text-[10px] text-zinc-650 italic">
            Tüm vızıltılar yüklendi zzz.
          </div>
        )}
      </div>
    </>
  );
}
