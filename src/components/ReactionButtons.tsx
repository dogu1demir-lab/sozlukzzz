"use client";

import { useState, useTransition } from "react";
import { likeEntryAction, reportAction } from "@/app/actions";
import { playBuzzSound } from "@/lib/utils";
import { useFeedbackModal } from "@/components/FeedbackModal";
import { ThumbsUp, ThumbsDown, MessageSquare, Edit3, Trash2, Flag, Share2 } from "lucide-react";
import Link from "next/link";

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
  const [showShareMenu, setShowShareMenu] = useState(false);
  const { alert: showAlert, prompt: askPrompt, feedbackModal } = useFeedbackModal();

  const handleReaction = async (type: "LIKE" | "DISLIKE") => {
    if (!isLoggedIn) {
      await showAlert("Reaksiyon bırakmak için giriş yapmalısınız zzz.");
      return;
    }

    playBuzzSound(false, "/eylemhareket.mp3");

    if (type === "LIKE" && reaction !== "LIKE") {
      // Trigger canvas confetti on like dynamically!
      import("canvas-confetti").then((mod) => {
        mod.default({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ["#84cc16", "#14b8a6", "#a855f7"],
        });
      });
    }

    // Snapshot current state so a failed request rolls back to the
    // pre-click values instead of the (possibly stale) mount props.
    const prevLikes = likes;
    const prevDislikes = dislikes;
    const prevReaction = reaction;

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
        setLikes(prevLikes);
        setDislikes(prevDislikes);
        setReaction(prevReaction);
        await showAlert(result.error);
      }
    });
  };

  const handleReport = async () => {
    if (!isLoggedIn) {
      await showAlert("Şikayet etmek için giriş yapmalısınız zzz.");
      return;
    }

    const reason = await askPrompt("Lütfen şikayet nedeninizi girin zzz (hakaret, spam, yasa dışı vb.):");
    if (!reason) return; // cancelled or empty

    playBuzzSound();
    startTransition(async () => {
      const result = await reportAction("ENTRY", entryId, reason);
      if (result.error) {
        await showAlert(result.error);
      } else {
        await showAlert("Şikayetiniz başarıyla iletildi zzz. Moderatörlerimiz inceleyecektir.");
      }
    });
  };

  const handleCopyLink = async () => {
    const entryUrl = `${window.location.origin}/baslik/${topicSlug}#entry-${entryId}`;
    try {
      await navigator.clipboard.writeText(entryUrl);
    } catch {
      await showAlert("Bağlantı kopyalanamadı. Lütfen tekrar deneyin.");
    }
    setShowShareMenu(false);
  };

  const handleShareWhatsApp = () => {
    const entryUrl = `${window.location.origin}/baslik/${topicSlug}#entry-${entryId}`;
    const text = encodeURIComponent(`sözlükzzz'deki bu entry'ye göz at: ${entryUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
    setShowShareMenu(false);
  };

  const handleShareX = () => {
    const entryUrl = `${window.location.origin}/baslik/${topicSlug}#entry-${entryId}`;
    const text = encodeURIComponent(`sözlükzzz'de vızıldayan bu entry'ye göz at zzz: ${entryUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
    setShowShareMenu(false);
  };

  return (
    <div className="flex items-center gap-4 mt-4 pt-2 border-t border-zinc-900/50">
      {/* Like Button */}
      <button
        onClick={() => handleReaction("LIKE")}
        disabled={isPending}
        aria-label={`Beğen (${likes})`}
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
        aria-label={`Beğenme (${dislikes})`}
        className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border transition-all active:scale-95 ${
          reaction === "DISLIKE"
            ? "bg-red-500/10 text-red-400 border-red-500/30"
            : "text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-900"
        }`}
      >
        <ThumbsDown className={`h-3.5 w-3.5 ${reaction === "DISLIKE" ? "fill-red-500/20" : ""}`} />
        <span className="font-bold">{dislikes}</span>
      </button>

      {/* Report Button */}
      {!isOwner && (
        <button
          onClick={handleReport}
          title="Şikayet Et"
          aria-label="Şikayet Et"
          disabled={isPending}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border border-transparent text-zinc-500 hover:text-red-400 hover:bg-zinc-900 transition-all active:scale-95"
        >
          <Flag className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Share Button & Dropdown Menu */}
      <div className="relative">
        <button
          onClick={() => { playBuzzSound(); setShowShareMenu(!showShareMenu); }}
          title="Paylaş"
          aria-label="Paylaş"
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border border-transparent text-zinc-500 hover:text-lime-400 hover:bg-zinc-900 transition-all active:scale-95"
        >
          <Share2 className="h-3.5 w-3.5" />
        </button>

        {showShareMenu && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setShowShareMenu(false)} />
            <div className="absolute left-0 bottom-full mb-2 z-30 w-36 rounded-xl border border-zinc-850 bg-zinc-950 p-1.5 shadow-2xl ring-1 ring-black/5 animate-in fade-in slide-in-from-bottom-2 duration-100 flex flex-col gap-0.5">
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-zinc-300 hover:bg-zinc-900 transition-colors text-left font-bold"
              >
                <span>🔗 Linki Kopyala</span>
              </button>
              <button
                onClick={handleShareWhatsApp}
                className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-zinc-300 hover:bg-zinc-900 transition-colors text-left font-bold"
              >
                <span className="text-emerald-500">🟢 WhatsApp</span>
              </button>
              <button
                onClick={handleShareX}
                className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-zinc-300 hover:bg-zinc-900 transition-colors text-left font-bold"
              >
                <span>🐦 X (Twitter)</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Edit/Delete Buttons aligned right next to vızılda */}
      {isLoggedIn && (isOwner || canDelete) && (
        <div className="flex items-center gap-1.5 text-zinc-550 ml-auto mr-1 select-none">
          {onEdit && (
            <button
              onClick={onEdit}
              title="Entry'yi Düzenle"
              aria-label="Entry'yi Düzenle"
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
              aria-label="Entry'yi Sil"
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

      {/* Ortak Geri Bildirim Modalı (alert/confirm/prompt) */}
      {feedbackModal}
    </div>
  );
}
