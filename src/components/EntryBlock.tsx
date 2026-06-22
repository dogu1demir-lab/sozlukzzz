"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteEntryAction, editEntryAction } from "@/app/actions";
import { playBuzzSound } from "@/lib/utils";
import ReactionButtons from "./ReactionButtons";
import MentionText from "./MentionText";
import { Edit3, Trash2, X, Check } from "lucide-react";

interface Author {
  id: string;
  username: string;
  avatarColor: string;
  avatarUrl: string | null;
}

interface EntryItem {
  id: string;
  content: string;
  imageUrl: string | null;
  createdAt: Date;
  likesCount: number;
  dislikesCount: number;
  userReaction: "LIKE" | "DISLIKE" | null;
  author: Author;
  topic: {
    slug: string;
    title: string;
  };
}

interface EntryBlockProps {
  entry: EntryItem;
  index: number;
  isLoggedIn: boolean;
  currentUserId?: string;
  isAdmin: boolean;
}

export default function EntryBlock({
  entry,
  index,
  isLoggedIn,
  currentUserId,
  isAdmin,
}: EntryBlockProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(entry.content);
  const [currentContent, setCurrentContent] = useState(entry.content);
  const [isPending, startTransition] = useTransition();

  const isOwner = currentUserId === entry.author.id;
  const canDelete = isOwner || isAdmin;

  const handleEditToggle = () => {
    setEditContent(currentContent);
    setIsEditing(!isEditing);
  };

  const handleEditSave = () => {
    if (!editContent.trim()) {
      alert("İçerik boş olamaz.");
      return;
    }

    if (editContent.trim().length < 45) {
      alert("İçerik en az 45 karakter olmalıdır zzz.");
      return;
    }

    playBuzzSound();
    startTransition(async () => {
      const result = await editEntryAction(entry.id, editContent);
      if (result.error) {
        alert(result.error);
      } else {
        setCurrentContent(editContent.trim());
        setIsEditing(false);
        router.refresh();
      }
    });
  };

  const handleDelete = () => {
    if (!confirm("Bu entry'yi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) {
      return;
    }

    playBuzzSound();
    startTransition(async () => {
      const result = await deleteEntryAction(entry.id);
      if (result.error) {
        alert(result.error);
      } else {
        if (result.topicDeleted) {
          // If the topic was deleted because this was the only entry, redirect to homepage
          alert("Başlıktaki tek entry silindiği için başlık kaldırıldı zzz.");
          router.push("/bugun");
        } else {
          router.refresh();
        }
      }
    });
  };

  const formatClientDate = (dateVal: any) => {
    try {
      const date = new Date(dateVal);
      return date.toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Istanbul"
      });
    } catch {
      return "";
    }
  };

  return (
    <article
      id={`entry-${entry.id}`}
      className="group relative rounded-xl border border-zinc-950 hover:border-zinc-900/50 bg-zinc-950/20 p-3.5 hover:bg-zinc-900/5 transition-all"
    >
      {/* Entry Header */}
      <div className="flex items-center justify-between gap-4">
        <span className="text-[11px] text-zinc-650 font-mono font-bold select-none">
          #{index + 1}
        </span>

        {/* Author & Date */}
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Link
            href={`/yazar/${entry.author.username}`}
            prefetch={false}
            className="flex items-center gap-1.5 hover:text-zinc-300 transition-colors"
          >
            {entry.author.avatarUrl ? (
              <img
                src={`/api/yazar-image/${encodeURIComponent(entry.author.username)}`}
                alt={entry.author.username}
                width={20}
                height={20}
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
          <span className="text-[11px]">{formatClientDate(entry.createdAt)}</span>
        </div>
      </div>

      {/* Photo Akışı (PozKes) Image rendering if present */}
      {entry.imageUrl && (
        <div className="mt-3 overflow-hidden rounded-xl border border-zinc-900 bg-zinc-900/40 max-w-xl">
          <img
            src={entry.imageUrl}
            alt="PozKes"
            loading="lazy"
            width={600}
            height={400}
            className="w-full max-h-96 object-cover hover:scale-[1.02] transition-transform duration-300"
          />
        </div>
      )}

      {/* Entry Content (Editable) */}
      <div className="mt-3 text-sm sm:text-base text-zinc-200 leading-relaxed whitespace-pre-wrap break-words">
        {isEditing ? (
          <div className="flex flex-col gap-2 mt-2">
            <textarea
              className="w-full p-3 bg-zinc-900 border border-zinc-800 focus:border-teal-500 focus:outline-none rounded-lg text-sm text-zinc-100 placeholder-zinc-550"
              rows={5}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Entry içeriğini düzenleyin..."
              disabled={isPending}
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleEditToggle}
                disabled={isPending}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-800 text-[11px] font-bold text-zinc-400 hover:text-white transition-all bg-zinc-950/20"
              >
                <X className="w-3.5 h-3.5" />
                <span>İptal</span>
              </button>
              <button
                type="button"
                onClick={handleEditSave}
                disabled={isPending || !editContent.trim()}
                className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-[11px] font-bold text-white transition-all disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5 text-white" />
                <span>{isPending ? "Kaydediliyor..." : "Kaydet"}</span>
              </button>
            </div>
          </div>
        ) : (
          <MentionText content={currentContent} />
        )}
      </div>

      {/* Reaction Buttons & Moderation Actions */}
      <div className="relative">
        <ReactionButtons
          entryId={entry.id}
          initialLikesCount={entry.likesCount}
          initialDislikesCount={entry.dislikesCount}
          userReaction={entry.userReaction}
          isLoggedIn={isLoggedIn}
          topicSlug={entry.topic.slug}
          authorUsername={entry.author.username}
          entryIndex={index + 1}
          onEdit={!isEditing ? handleEditToggle : undefined}
          onDelete={handleDelete}
          isOwner={isOwner}
          canDelete={canDelete}
        />
      </div>
    </article>
  );
}
