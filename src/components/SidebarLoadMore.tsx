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
          className="flex items-center justify-between px-3 py-2 rounded-none text-xs sm:text-sm transition-all group active:scale-[0.99] mb-1.5 border text-zinc-300 hover:text-white bg-zinc-900/10 border-zinc-900/30 hover:bg-zinc-900/30 hover:border-zinc-800/80"
        >
          <span className="pr-1.5 flex-1 min-w-0 group-hover:translate-x-0.5 transition-transform duration-100 flex items-start gap-1.5">
            <span className="break-words block whitespace-normal min-w-0">{topic.title}</span>
            {topic.poll && (
              <span className="text-[10px] shrink-0 pt-0.5" title="Anket">📊</span>
            )}
          </span>
          <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-none min-w-[18px] text-center transition-all border font-semibold bg-zinc-900/60 group-hover:bg-lime-950 border-zinc-850 group-hover:border-lime-500/30 text-zinc-400 group-hover:text-lime-400">
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
          <div className="text-center py-2 text-[10px] text-zinc-400 italic">
            Tüm vızıltılar yüklendi zzz.
          </div>
        )}
      </div>
    </>
  );
}
