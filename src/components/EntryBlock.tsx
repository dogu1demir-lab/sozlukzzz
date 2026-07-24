"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteEntryAction, editEntryAction } from "@/app/actions";
import { playBuzzSound, formatDate } from "@/lib/utils";
import ReactionButtons from "./ReactionButtons";
import MentionText from "./MentionText";
import { Edit3, Trash2, X, Check } from "lucide-react";

interface Author {
  id: string;
  username: string;
  displayName?: string | null;
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
  const canEdit = isOwner || isAdmin;

  const handleInsertBkzEdit = () => {
    const textarea = document.getElementById(`edit-textarea-${entry.id}`) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const selectedText = text.substring(start, end);
    const replacement = `(bkz: ${selectedText})`;

    const newContent = text.substring(0, start) + replacement + text.substring(end);
    setEditContent(newContent);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + 7 + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  };

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

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDelete = () => {
    playBuzzSound();
    setShowDeleteModal(true);
  };

  const confirmDeleteEntry = () => {
    setShowDeleteModal(false);
    startTransition(async () => {
      const result = await deleteEntryAction(entry.id);
      if (result.error) {
        alert(result.error);
      } else {
        if (result.topicDeleted) {
          router.push("/bugun");
        } else {
          router.refresh();
        }
      }
    });
  };

  const formatClientDate = (dateVal: any) => {
    return formatDate(dateVal);
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
                {(entry.author.displayName ?? entry.author.username).substring(0, 2).toUpperCase()}
              </div>
            )}
            <span className="font-semibold">{entry.author.displayName ?? entry.author.username}</span>
          </Link>
          <span>•</span>
          <span className="text-[11px]" suppressHydrationWarning>{formatClientDate(entry.createdAt)}</span>
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
              id={`edit-textarea-${entry.id}`}
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
                onClick={handleInsertBkzEdit}
                disabled={isPending}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-800 text-[11px] font-bold text-zinc-400 hover:text-lime-400 hover:border-lime-500/20 transition-all bg-zinc-950/20 cursor-pointer select-none"
              >
                <span>bkz</span>
              </button>
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

      {/* Modern Custom Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 text-lg shrink-0">
                🗑️
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">Entry Silinsin mi?</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Bu entry kalıcı olarak silinecektir. İşlemi onaylıyor musunuz?</p>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-zinc-900 bg-zinc-900/40 text-xs text-zinc-300 line-clamp-3 italic">
              &ldquo;{entry.content}&rdquo;
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => { playBuzzSound(); setShowDeleteModal(false); }}
                disabled={isPending}
                className="px-4 py-2 text-xs font-extrabold text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all active:scale-95 cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={confirmDeleteEntry}
                disabled={isPending}
                className="px-4 py-2 text-xs font-black text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all active:scale-95 shadow-lg shadow-rose-600/20 flex items-center gap-1.5 cursor-pointer"
              >
                {isPending ? "Siliniyor..." : "Evet, Sil 🗑️"}
              </button>
            </div>

          </div>
        </div>
      )}
    </article>
  );
}
