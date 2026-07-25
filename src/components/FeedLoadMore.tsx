"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getMoreEntriesAction } from "@/app/actions";
import { formatDate } from "@/lib/utils";
import ReactionButtons from "./ReactionButtons";
import ClickableImage from "./ClickableImage";
import ExpandableMentionText from "./ExpandableMentionText";

interface Author {
  id: string;
  username: string;
  displayName?: string | null;
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
  topEntryUrl?: string | null;
  topLikeCount?: number;
}

interface FeedLoadMoreProps {
  tab: string;
  initialOffset: number;
  isLoggedIn: boolean;
}

export default function FeedLoadMore({ tab, initialOffset, isLoggedIn }: FeedLoadMoreProps) {
  const [entries, setEntries] = useState<EntryItem[]>([]);
  const [offset, setOffset] = useState(initialOffset);
  const [cursorId, setCursorId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Reset state when tab changes (render sırasında prop değişimine ayak uydurma)
  const tabKey = `${tab}:${initialOffset}`;
  const [prevTabKey, setPrevTabKey] = useState(tabKey);
  if (prevTabKey !== tabKey) {
    setPrevTabKey(tabKey);
    setEntries([]);
    setOffset(initialOffset);
    setCursorId(null);
    setHasMore(true);
  }

  const handleLoadMore = async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);

    try {
      const result = await getMoreEntriesAction(tab, offset, 7, cursorId);
      if (result.success && result.entries) {
        const newEntries = result.entries as unknown as EntryItem[];
        if (newEntries.length === 0) {
          setHasMore(false);
        } else {
          setEntries((prev) => [...prev, ...newEntries]);
          setOffset((prev) => prev + newEntries.length);
          // Continue after the last shown topic so rows inserted meanwhile are not repeated
          setCursorId(newEntries[newEntries.length - 1].topic.id);
          if (newEntries.length < 7) {
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
  const formatClientDate = (dateVal: Date | string) => {
    return formatDate(dateVal);
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
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <Link
                  href={`/baslik/${entry.topic.slug}`}
                  className="text-sm sm:text-base font-bold text-white hover:text-lime-400 transition-colors flex items-center gap-1.5 flex-wrap"
                >
                  <span>{entry.topic.title}</span>
                  {entry.topic.poll && (
                    <span className="text-xs shrink-0" title="Anket">📊</span>
                  )}
                </Link>
                {tab === "begenilen" && entry.topEntryUrl && (entry.topLikeCount ?? 0) > 0 && (
                  <Link
                    href={entry.topEntryUrl}
                    title={`En çok beğenilen entry'ye git (${entry.topLikeCount} beğeni)`}
                    className="shrink-0 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
                  >
                    🔥 {entry.topLikeCount}
                  </Link>
                )}
              </div>

              {/* Author / Date */}
              <div className="flex items-center gap-2 text-[11px] sm:text-xs text-zinc-400 shrink-0">
                <Link
                  href={`/yazar/${entry.author.username}`}
                  className="flex items-center gap-1.5 hover:text-zinc-300 transition-colors"
                >
                  {entry.author.avatarUrl ? (
                    <Image
                      src={entry.author.avatarUrl}
                      alt={entry.author.username}
                      width={20}
                      height={20}
                      unoptimized
                      className="w-5 h-5 rounded-full object-cover border border-white/5"
                    />
                  ) : (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-black border border-white/5"
                      style={{ backgroundColor: entry.author.avatarColor }}
                    >
                      {(entry.author.displayName ?? entry.author.username).substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="font-semibold">{entry.author.displayName ?? entry.author.username}</span>
                </Link>
                <span>•</span>
                <span suppressHydrationWarning>{formatClientDate(entry.createdAt)}</span>
              </div>
            </div>

            {/* Photo Akışı (PozKes) Image rendering */}
            {entry.imageUrl && (
              <div className="mt-3 overflow-hidden rounded-xl border border-zinc-900 bg-zinc-900/40 max-w-xl">
                <ClickableImage
                  src={entry.imageUrl}
                  alt="PozKes"
                  sizes="(max-width: 640px) 100vw, 576px"
                  className="w-full max-h-96 object-cover hover:scale-[1.02] transition-transform duration-300"
                />
              </div>
            )}

            {/* Entry Content */}
            <div className="mt-3 text-sm sm:text-base text-zinc-200 leading-relaxed">
              <ExpandableMentionText content={entry.content} />
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
