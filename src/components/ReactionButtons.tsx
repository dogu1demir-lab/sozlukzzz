"use client";

import { useState, useTransition } from "react";
import { likeEntryAction } from "@/app/actions";
import { playBuzzSound } from "@/lib/utils";
import { ThumbsUp, ThumbsDown, MessageSquare, Edit3, Trash2 } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";

interface ReactionButtonsProps {
  entryId: string;
  initialLikesCount: number;
  initialDislikesCount: number;
  userReaction: "LIKE" | "DISLIKE" | null;
  isLoggedIn: boolean;
  topicSlug?: string;
  authorUsername?: string;
  entryIndex?: number;
}

export default function ReactionButtons({
  entryId,
  initialLikesCount,
  initialDislikesCount,
  userReaction,
  isLoggedIn,
  topicSlug,
  authorUsername,
  entryIndex,
  onEdit,
  onDelete,
  isOwner,
  canDelete,
}: ReactionButtonsProps & {
  onEdit?: () => void;
  onDelete?: () => void;
  isOwner?: boolean;
  canDelete?: boolean;
}) {
  const [likes, setLikes] = useState(initialLikesCount);
  const [dislikes, setDislikes] = useState(initialDislikesCount);
  const [reaction, setReaction] = useState<"LIKE" | "DISLIKE" | null>(userReaction);
  const [isPending, startTransition] = useTransition();

  const handleReaction = (type: "LIKE" | "DISLIKE") => {
    if (!isLoggedIn) {
      alert("Reaksiyon bırakmak için giriş yapmalısınız zzz.");
      return;
    }

    playBuzzSound();

    if (type === "LIKE" && reaction !== "LIKE") {
      // Trigger canvas confetti on like!
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ["#84cc16", "#14b8a6", "#a855f7"],
      });
    }

    // Optimistic UI updates
    if (type === "LIKE") {
      if (reaction === "LIKE") {
        setLikes(prev => prev - 1);
        setReaction(null);
      } else {
        setLikes(prev => prev + 1);
        if (reaction === "DISLIKE") setDislikes(prev => prev - 1);
        setReaction("LIKE");
      }
    } else {
      if (reaction === "DISLIKE") {
        setDislikes(prev => prev - 1);
        setReaction(null);
      } else {
        setDislikes(prev => prev + 1);
        if (reaction === "LIKE") setLikes(prev => prev - 1);
        setReaction("DISLIKE");
      }
    }

    startTransition(async () => {
      const result = await likeEntryAction(entryId, type === "LIKE");
      if (result.error) {
        // Rollback on error
        setLikes(initialLikesCount);
        setDislikes(initialDislikesCount);
        setReaction(userReaction);
        alert(result.error);
      }
    });
  };

  return (
    <div className="flex items-center gap-4 mt-4 pt-2 border-t border-zinc-900/50">
      {/* Like Button */}
      <button
        onClick={() => handleReaction("LIKE")}
        disabled={isPending}
        className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border transition-all active:scale-95 ${
          reaction === "LIKE"
            ? "bg-lime-500/10 text-lime-400 border-lime-500/30"
            : "text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-900"
        }`}
      >
        <ThumbsUp className={`h-3.5 w-3.5 ${reaction === "LIKE" ? "fill-lime-500/20" : ""}`} />
        <span className="font-bold">{likes}</span>
      </button>

      {/* Dislike Button */}
      <button
        onClick={() => handleReaction("DISLIKE")}
        disabled={isPending}
        className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border transition-all active:scale-95 ${
          reaction === "DISLIKE"
            ? "bg-red-500/10 text-red-400 border-red-500/30"
            : "text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-900"
        }`}
      >
        <ThumbsDown className={`h-3.5 w-3.5 ${reaction === "DISLIKE" ? "fill-red-500/20" : ""}`} />
        <span className="font-bold">{dislikes}</span>
      </button>

      {/* Edit/Delete Buttons aligned right next to vızılda */}
      {isLoggedIn && (isOwner || canDelete) && (
        <div className="flex items-center gap-1.5 text-zinc-550 ml-auto mr-1 select-none">
          {isOwner && onEdit && (
            <button
              onClick={onEdit}
              title="Entry'yi Düzenle"
              className="p-1.5 hover:text-teal-400 hover:bg-zinc-900 rounded-lg transition-colors active:scale-90"
              disabled={isPending}
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
          {canDelete && onDelete && (
            <button
              onClick={onDelete}
              title="Entry'yi Sil"
              className="p-1.5 hover:text-red-400 hover:bg-zinc-900 rounded-lg transition-colors active:scale-90"
              disabled={isPending}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {topicSlug && (
        <Link
          href={`/baslik/${topicSlug}?replyTo=${authorUsername || ""}&replyIndex=${entryIndex || ""}#reply-form`}
          onClick={() => playBuzzSound()}
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border border-transparent text-zinc-550 hover:text-lime-400 hover:bg-zinc-900 transition-all active:scale-95 ${
            isOwner || canDelete ? "ml-1" : "ml-auto"
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span>vızılda</span>
        </Link>
      )}
    </div>
  );
}
