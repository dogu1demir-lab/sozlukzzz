"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import { getMoreViewedTopicsAction } from "@/app/actions";
import ReactionButtons from "./ReactionButtons";
import ExpandableMentionText from "./ExpandableMentionText";

interface ViewedTopicEntry {
  id: string;
  content: string;
  createdAt: Date | string;
  author: {
    id: string;
    username: string;
    displayName?: string | null;
    avatarColor: string;
    avatarUrl: string | null;
  };
  likes: { userId: string; isLike: boolean }[];
}

interface ViewedTopic {
  id: string;
  title: string;
  slug: string;
  viewCount: number;
  poll: { id: string } | null;
  entries: ViewedTopicEntry[];
}

interface GoruntulenenLoadMoreProps {
  initialOffset: number;
  isLoggedIn: boolean;
  currentUserId?: string;
}

export default function GoruntulenenLoadMore({ initialOffset, isLoggedIn, currentUserId }: GoruntulenenLoadMoreProps) {
  const [topics, setTopics] = useState<ViewedTopic[]>([]);
  const [offset, setOffset] = useState(initialOffset);
  const [cursorId, setCursorId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadMore = async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);

    try {
      const result = await getMoreViewedTopicsAction(offset, 7, cursorId);
      if (result.success && result.topics) {
        const newTopics = result.topics as unknown as ViewedTopic[];
        if (newTopics.length === 0) {
          setHasMore(false);
        } else {
          setTopics((prev) => [...prev, ...newTopics]);
          setOffset((prev) => prev + newTopics.length);
          setCursorId(newTopics[newTopics.length - 1].id);
          if (newTopics.length < 7) {
            setHasMore(false);
          }
        }
      } else {
        console.error("Konular yüklenemedi.");
      }
    } catch (err) {
      console.error("Hata:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {topics.map((topic) => {
        const firstEntry = topic.entries[0];
        if (!firstEntry) return null;

        const likesCount = firstEntry.likes.filter((l) => l.isLike).length;
        const dislikesCount = firstEntry.likes.filter((l) => !l.isLike).length;
        const userLike = currentUserId ? firstEntry.likes.find((l) => l.userId === currentUserId) : null;
        const userReaction = userLike ? (userLike.isLike ? ("LIKE" as const) : ("DISLIKE" as const)) : null;

        return (
          <article
            key={topic.id}
            className="rounded-xl border border-zinc-900 bg-zinc-950/50 p-3.5 hover:border-zinc-800 transition-all hover:bg-zinc-900/5 animate-in fade-in duration-200"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-1">
              <Link
                href={`/baslik/${topic.slug}`}
                className="text-sm sm:text-base font-bold text-white hover:text-lime-400 transition-colors flex items-center gap-1.5 flex-wrap min-w-0"
              >
                <span className="break-words block min-w-0">{topic.title}</span>
                {topic.poll && (
                  <span className="text-xs shrink-0" title="Anket">📊</span>
                )}
              </Link>

              <div className="flex items-center gap-3 text-[11px] sm:text-xs text-zinc-400 shrink-0">
                <span className="flex items-center gap-1.5 text-zinc-400 font-medium">
                  <Eye className="h-3.5 w-3.5 text-lime-400" />
                  <span>{topic.viewCount} görüntülenme</span>
                </span>
                <span>•</span>
                <Link
                  href={`/yazar/${firstEntry.author.username}`}
                  className="flex items-center gap-1 hover:text-zinc-300"
                >
                  <span className="font-semibold">@{firstEntry.author.username}</span>
                </Link>
              </div>
            </div>

            <div className="mt-3 text-sm sm:text-base text-zinc-300 leading-relaxed">
              <ExpandableMentionText content={firstEntry.content} />
            </div>

            <ReactionButtons
              entryId={firstEntry.id}
              initialLikesCount={likesCount}
              initialDislikesCount={dislikesCount}
              userReaction={userReaction}
              isLoggedIn={isLoggedIn}
              topicSlug={topic.slug}
              authorUsername={firstEntry.author.username}
              entryIndex={1}
            />
          </article>
        );
      })}

      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-350 hover:text-white rounded-lg transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isLoading ? "yükleniyor..." : "daha fazla yükle"}
          </button>
        </div>
      )}
    </>
  );
}
