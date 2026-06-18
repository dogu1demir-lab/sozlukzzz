"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getMoreEntriesAction } from "@/app/actions";
import { playBuzzSound } from "@/lib/utils";
import ReactionButtons from "./ReactionButtons";
import MentionText from "./MentionText";

interface Author {
  id: string;
  username: string;
  avatarColor: string;
  avatarUrl: string | null;
}

interface Topic {
  id: string;
  title: string;
  slug: string;
  poll: { id: string } | null;
}

interface EntryItem {
  id: string;
  content: string;
  imageUrl: string | null;
  createdAt: Date;
  topic: Topic;
  author: Author;
  likesCount: number;
  dislikesCount: number;
  userReaction: "LIKE" | "DISLIKE" | null;
}

interface FeedLoadMoreProps {
  tab: string;
  initialOffset: number;
  isLoggedIn: boolean;
}

export default function FeedLoadMore({ tab, initialOffset, isLoggedIn }: FeedLoadMoreProps) {
  const [entries, setEntries] = useState<EntryItem[]>([]);
  const [offset, setOffset] = useState(initialOffset);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Reset state when tab changes
  useEffect(() => {
    setEntries([]);
    setOffset(initialOffset);
    setHasMore(true);
  }, [tab, initialOffset]);

  const handleLoadMore = async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    playBuzzSound();

    try {
      const result = await getMoreEntriesAction(tab, offset, 20);
      if (result.success && result.entries) {
        const newEntries = result.entries as unknown as EntryItem[];
        if (newEntries.length === 0) {
          setHasMore(false);
        } else {
          setEntries((prev) => [...prev, ...newEntries]);
          setOffset((prev) => prev + newEntries.length);
          if (newEntries.length < 20) {
            setHasMore(false);
          }
        }
      } else {
        console.error(result.error || "Girdiler yüklenemedi zzz.");
      }
    } catch (err) {
      console.error("Hata:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Date format helper for client rendering
  const formatClientDate = (dateVal: any) => {
    try {
      const date = new Date(dateVal);
      return date.toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "";
    }
  };

  return (
    <>
      {/* Dynamic loaded entries stream */}
      <div className="space-y-6">
        {entries.map((entry) => (
          <article
            key={entry.id}
            className="rounded-xl border border-zinc-900 bg-zinc-950/50 p-3.5 hover:border-zinc-800 transition-all hover:bg-zinc-900/5 animate-in fade-in duration-200"
          >
            {/* Entry Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-1">
              <Link
                href={`/baslik/${entry.topic.slug}`}
                className="text-sm sm:text-base font-bold text-white hover:text-lime-400 transition-colors flex items-center gap-1.5 flex-wrap"
              >
                <span>{entry.topic.title}</span>
                {entry.topic.poll && (
                  <span className="text-xs shrink-0" title="Anket">📊</span>
                )}
              </Link>

              {/* Author / Date */}
              <div className="flex items-center gap-2 text-[11px] sm:text-xs text-zinc-500 shrink-0">
                <Link
                  href={`/yazar/${entry.author.username}`}
                  className="flex items-center gap-1.5 hover:text-zinc-300 transition-colors"
                >
                  {entry.author.avatarUrl ? (
                    <img
                      src={entry.author.avatarUrl}
                      alt={entry.author.username}
                      className="w-5 h-5 rounded-full object-cover border border-white/5"
                    />
                  ) : (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-black border border-white/5"
                      style={{ backgroundColor: entry.author.avatarColor }}
                    >
                      {entry.author.username.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="font-semibold">@{entry.author.username}</span>
                </Link>
                <span>•</span>
                <span>{formatClientDate(entry.createdAt)}</span>
              </div>
            </div>

            {/* Photo Akışı (PozKes) Image rendering */}
            {entry.imageUrl && (
              <div className="mt-3 overflow-hidden rounded-xl border border-zinc-900 bg-zinc-900/40 max-w-xl">
                <img
                  src={entry.imageUrl}
                  alt="PozKes"
                  loading="lazy"
                  className="w-full max-h-96 object-cover hover:scale-[1.02] transition-transform duration-300"
                />
              </div>
            )}

            {/* Entry Content */}
            <div className="mt-3 text-sm sm:text-base text-zinc-200 leading-relaxed whitespace-pre-wrap">
              <MentionText content={entry.content} />
            </div>

            {/* Reactions */}
            <ReactionButtons
              entryId={entry.id}
              initialLikesCount={entry.likesCount}
              initialDislikesCount={entry.dislikesCount}
              userReaction={entry.userReaction}
              isLoggedIn={isLoggedIn}
              topicSlug={entry.topic.slug}
              authorUsername={entry.author.username}
            />
          </article>
        ))}
      </div>

      {/* Button container */}
      <div className="mt-8 flex justify-center">
        {hasMore ? (
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className="px-6 py-2.5 rounded-full border border-zinc-850 hover:border-lime-500/30 bg-zinc-900 hover:bg-zinc-850 text-xs font-bold text-zinc-350 hover:text-white transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoading ? "Vızıldanıyor..." : "daha fazla vızzz"}
          </button>
        ) : (
          <div className="text-center py-4 text-xs text-zinc-600 italic">
            Tüm vızıltılar yüklendi zzz.
          </div>
        )}
      </div>
    </>
  );
}
