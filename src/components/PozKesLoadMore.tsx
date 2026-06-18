"use client";

import { useState } from "react";
import { getMorePozKesAction } from "@/app/actions";
import { playBuzzSound } from "@/lib/utils";
import PozKesCard from "./PozKesCard";

interface Author {
  id: string;
  username: string;
  avatarColor: string;
  avatarUrl?: string | null;
}

interface CommentItem {
  id: string;
  content: string;
  createdAt: Date;
  author: Author;
  likesCount: number;
  hasLiked: boolean;
}

interface PozKesEntry {
  id: string;
  content: string;
  imageUrl: string;
  createdAt: Date;
  author: Author;
  likesCount: number;
  hasLiked: boolean;
  comments: CommentItem[];
}

interface PozKesLoadMoreProps {
  initialOffset: number;
  isLoggedIn: boolean;
  currentUserId?: string;
  isAdmin?: boolean;
}

export default function PozKesLoadMore({
  initialOffset,
  isLoggedIn,
  currentUserId,
  isAdmin,
}: PozKesLoadMoreProps) {
  const [entries, setEntries] = useState<PozKesEntry[]>([]);
  const [offset, setOffset] = useState(initialOffset);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadMore = async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    playBuzzSound();

    try {
      const result = await getMorePozKesAction(offset, 10);
      if (result.success && result.entries) {
        const newEntries = result.entries as unknown as PozKesEntry[];
        if (newEntries.length === 0) {
          setHasMore(false);
        } else {
          setEntries((prev) => [...prev, ...newEntries]);
          setOffset((prev) => prev + newEntries.length);
          if (newEntries.length < 10) {
            setHasMore(false);
          }
        }
      } else {
        console.error(result.error || "Görseller yüklenemedi zzz.");
      }
    } catch (err) {
      console.error("Hata:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Dynamic loaded PozKes entries */}
      {entries.map((entry) => (
        <PozKesCard
          key={entry.id}
          entry={entry}
          isLoggedIn={isLoggedIn}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
        />
      ))}

      {/* Button container */}
      <div className="kd-load-more mt-4 flex justify-center">
        {hasMore ? (
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className="px-6 py-2.5 rounded-full border border-zinc-850 hover:border-lime-500/30 bg-zinc-900 hover:bg-zinc-850 text-xs font-bold text-zinc-350 hover:text-white transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoading ? "Vızıldanıyor..." : "daha fazla fotoğraf yükle zzz"}
          </button>
        ) : (
          <div className="text-center py-4 text-xs text-zinc-600 italic">
            Tüm fotoğraflar yüklendi zzz.
          </div>
        )}
      </div>
    </>
  );
}
