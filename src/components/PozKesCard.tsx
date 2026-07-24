"use client";

import { useState, useTransition, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  likeEntryAction, 
  createCommentAction, 
  likeCommentAction, 
  deleteCommentAction,
  deleteEntryAction,
  editEntryAction,
  reportAction
} from "@/app/actions";
import { playBuzzSound, formatDate } from "@/lib/utils";
import MentionText from "@/components/MentionText";
import ExpandableMentionText from "@/components/ExpandableMentionText";
import { Trash2, Share2, Edit3, Check, X } from "lucide-react";

interface PozKesCardProps {
  entry: {
    id: string;
    content: string;
    imageUrl: string;
    createdAt: Date;
    topic?: {
      title: string;
      slug: string;
    };
    author: {
      id: string;
      username: string;
      displayName?: string | null;
      avatarColor: string;
      avatarUrl?: string | null;
    };
    likesCount: number;
    hasLiked: boolean;
    comments: Array<{
      id: string;
      content: string;
      createdAt: Date;
      author: {
        id: string;
        username: string;
        displayName?: string | null;
        avatarColor: string;
        avatarUrl?: string | null;
      };
      likesCount: number;
      hasLiked: boolean;
    }>;
  };
  isLoggedIn: boolean;
  currentUserId?: string;
  isAdmin?: boolean;
}

const parsePozKesContent = (rawContent: string | undefined | null) => {
  if (!rawContent) return { title: null, body: "" };
  const match = rawContent.match(/^\*\*(.+?)\*\*\n\n?([\s\S]*)$/);
  if (match) {
    return { title: match[1].trim(), body: match[2].trim() };
  }
  return { title: null, body: rawContent };
};

export default function PozKesCard({ entry, isLoggedIn, currentUserId, isAdmin }: PozKesCardProps) {
  const router = useRouter();
  const { title: customTitle, body: captionBody } = parsePozKesContent(entry.content);
  const [likesCount, setLikesCount] = useState(entry.likesCount);
  const [hasLiked, setHasLiked] = useState(entry.hasLiked);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState(entry.comments);
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(customTitle || "");
  const [editBody, setEditBody] = useState(captionBody || "");

  const handleEditToggle = () => {
    setEditTitle(customTitle || "");
    setEditBody(captionBody || "");
    setIsEditing(!isEditing);
  };

  const handleSavePozKesEdit = () => {
    if (!editBody.trim()) {
      alert("Açıklama boş olamaz.");
      return;
    }

    playBuzzSound();
    startTransition(async () => {
      let finalContent = editBody.trim();
      if (editTitle.trim() && editTitle.trim().toLowerCase() !== "pozkes galeri") {
        finalContent = `**${editTitle.trim()}**\n\n${finalContent}`;
      }

      const result = await editEntryAction(entry.id, finalContent);
      if (result.error) {
        alert(result.error);
      } else {
        setIsEditing(false);
        router.refresh();
      }
    });
  };

  const getShareUrl = () => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/pozkes?e=${entry.id}#entry-${entry.id}`;
  };

  const handleCopyLink = () => {
    playBuzzSound();
    const url = getShareUrl();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    setShowShareMenu(false);
  };

  const handleShareWhatsApp = () => {
    playBuzzSound();
    const url = getShareUrl();
    const titleText = customTitle ? `📸 ${customTitle}` : "📸 PozKes Kareleri";
    const descText = captionBody ? `\n"${captionBody}"` : "";
    const text = `${titleText}${descText}\n\n${url}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
    setShowShareMenu(false);
  };

  const handleShareX = () => {
    playBuzzSound();
    const url = getShareUrl();
    const titleText = customTitle ? `📸 ${customTitle}` : "📸 PozKes Kareleri";
    const descText = captionBody ? `\n"${captionBody}"` : "";
    const text = `${titleText}${descText} @sozlukzzz\n\n${url}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
    setShowShareMenu(false);
  };

  const handleLikePost = () => {
    if (!isLoggedIn) {
      alert("Beğenmek için giriş yapmalısınız zzz.");
      return;
    }

    playBuzzSound();
    
    // Optimistic post like toggle
    setHasLiked(prev => !prev);
    setLikesCount(prev => (hasLiked ? prev - 1 : prev + 1));

    startTransition(async () => {
      const result = await likeEntryAction(entry.id, true);
      if (result.error) {
        // Rollback
        setHasLiked(entry.hasLiked);
        setLikesCount(entry.likesCount);
        alert(result.error);
      }
    });
  };

  const handleLikeComment = (commentId: string, initiallyLiked: boolean) => {
    if (!isLoggedIn) {
      alert("Yorumu beğenmek için giriş yapmalısınız zzz.");
      return;
    }

    playBuzzSound();

    // Optimistic comment like toggle
    setComments(prev =>
      prev.map(c => {
        if (c.id === commentId) {
          return {
            ...c,
            hasLiked: !c.hasLiked,
            likesCount: c.hasLiked ? c.likesCount - 1 : c.likesCount + 1,
          };
        }
        return c;
      })
    );

    startTransition(async () => {
      const result = await likeCommentAction(commentId);
      if (result.error) {
        // Rollback
        setComments(entry.comments);
        alert(result.error);
      }
    });
  };

  const handleDeleteComment = (commentId: string) => {
    if (!confirm("Bu yorumu silmek istediğinize emin misiniz?")) return;

    playBuzzSound();

    // Optimistic comment deletion
    setComments(prev => prev.filter(c => c.id !== commentId));

    startTransition(async () => {
      const result = await deleteCommentAction(commentId);
      if (result.error) {
        alert(result.error);
        // Rollback
        setComments(entry.comments);
      } else {
        router.refresh();
      }
    });
  };

  const handleDeleteEntry = () => {
    if (!confirm("Bu PozKes gönderisini ve tüm yorumlarını kalıcı olarak silmek istediğinize emin misiniz?")) return;

    playBuzzSound();

    startTransition(async () => {
      const result = await deleteEntryAction(entry.id);
      if (result.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    });
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting || isPending) return;

    playBuzzSound();
    setIsSubmitting(true);

    startTransition(async () => {
      try {
        const result = await createCommentAction(entry.id, newComment);
        if (result.error) {
          alert(result.error);
        } else if (result.success && result.comment) {
          setComments(prev => [...prev, result.comment]);
          setNewComment("");
          router.refresh();
        }
      } catch (err) {
        alert("Yorum gönderilirken teknik bir hata oluştu.");
      } finally {
        setIsSubmitting(false);
      }
    });
  };

  const handleReportContent = (targetType: "ENTRY" | "COMMENT", targetId: string) => {
    if (!isLoggedIn) {
      alert("Şikayet etmek için giriş yapmalısınız zzz.");
      return;
    }

    const reason = prompt("Lütfen şikayet nedeninizi girin zzz (hakaret, spam, yasa dışı vb.):");
    if (reason === null) return; // cancelled
    if (!reason.trim()) {
      alert("Şikayet nedeni boş olamaz.");
      return;
    }

    playBuzzSound();
    startTransition(async () => {
      const result = await reportAction(targetType, targetId, reason);
      if (result.error) {
        alert(result.error);
      } else {
        alert("Şikayetiniz başarıyla iletildi zzz. Moderatörlerimiz inceleyecektir.");
      }
    });
  };

  return (
    <article id={`entry-${entry.id}`} className="kd-card">
      {/* Header */}
      <div className="kd-card-header">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href={`/yazar/${entry.author.username}`}
            prefetch={false}
            className="kd-card-author shrink-0"
            onClick={() => playBuzzSound()}
          >
            {entry.author.avatarUrl ? (
              <img
                src={`/api/yazar-image/${encodeURIComponent(entry.author.username)}`}
                alt={entry.author.username}
                width={32}
                height={32}
                className="avatar avatar-sm avatar-img"
              />
            ) : (
              <div
                className="avatar avatar-sm"
                aria-label={entry.author.displayName ?? entry.author.username}
                style={{ backgroundColor: entry.author.avatarColor }}
              >
                {(entry.author.displayName ?? entry.author.username).substring(0, 1).toUpperCase()}
              </div>
            )}
            <span className="kd-card-username">{entry.author.displayName ?? entry.author.username}</span>
          </Link>

          {customTitle ? (
            <div
              className="text-[11px] font-extrabold text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/20 truncate max-w-[140px] sm:max-w-[220px]"
              title={customTitle}
            >
              📌 {customTitle}
            </div>
          ) : entry.topic && entry.topic.slug !== "pozkes-galeri" ? (
            <Link
              href={`/baslik/${entry.topic.slug}#entry-${entry.id}`}
              prefetch={false}
              className="text-[10px] font-bold text-lime-400/90 hover:text-lime-300 hover:underline bg-lime-500/10 px-2 py-0.5 rounded-full border border-lime-500/20 truncate max-w-[160px] sm:max-w-[220px]"
              title={`Konu: ${entry.topic.title}`}
            >
              📌 {entry.topic.title}
            </Link>
          ) : null}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-zinc-500 whitespace-nowrap" suppressHydrationWarning>{formatDate(entry.createdAt)}</span>
          {(isAdmin || currentUserId === entry.author.id) && (
            <>
              <button
                onClick={handleEditToggle}
                disabled={isPending}
                className="p-1 text-zinc-500 hover:text-teal-400 hover:bg-teal-500/10 rounded-lg transition-colors cursor-pointer"
                title="PozKes Açıklamasını/Başlığını Düzenle ✏️"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleDeleteEntry}
                disabled={isPending}
                className="p-1 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                title="PozKes Gönderisini Kalıcı Olarak Sil 🗑️"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Image body */}
      <div className="kd-card-img-wrap">
        <img
          src={entry.imageUrl}
          alt={`${entry.author.username} tarafından paylaşıldı`}
          width={600}
          height={400}
          className="kd-card-img"
          loading="lazy"
        />
      </div>

      {/* Action panel */}
      <div className="kd-card-actions">
        <button
          onClick={handleLikePost}
          disabled={isPending}
          className={`kd-like-btn ${hasLiked ? "liked" : ""}`}
          aria-label="Beğen"
        >
          <span className="kd-like-icon">{hasLiked ? "❤️" : "🤍"}</span>
          <span className="kd-like-count">{likesCount}</span>
        </button>
        
        <span className="kd-comment-count">
          💬 {comments.length}
        </span>

        {/* Share Button & Popup Menu */}
        <div className="relative inline-block">
          <button
            type="button"
            onClick={() => { playBuzzSound(); setShowShareMenu(!showShareMenu); }}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-teal-400 px-2 py-1 rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer select-none"
            title="Fotoğrafı Paylaş"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="font-bold text-[11px]">paylaş</span>
          </button>

          {showShareMenu && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowShareMenu(false)} />
              <div className="absolute left-0 bottom-full mb-2 z-30 w-36 rounded-xl border border-zinc-800 bg-zinc-950 p-1.5 shadow-2xl ring-1 ring-black/5 animate-in fade-in slide-in-from-bottom-2 duration-100 flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-zinc-300 hover:bg-zinc-900 transition-colors text-left font-bold cursor-pointer"
                >
                  <span>🔗 Linki Kopyala</span>
                </button>
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-zinc-300 hover:bg-zinc-900 transition-colors text-left font-bold cursor-pointer"
                >
                  <span className="text-emerald-500">🟢 WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={handleShareX}
                  className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-zinc-300 hover:bg-zinc-900 transition-colors text-left font-bold cursor-pointer"
                >
                  <span>🐦 X (Twitter)</span>
                </button>
              </div>
            </>
          )}
        </div>

        {currentUserId !== entry.author.id && (
          <button
            type="button"
            className="kd-report-btn"
            onClick={() => handleReportContent("ENTRY", entry.id)}
          >
            ⚑ Şikayet
          </button>
        )}
      </div>

      {/* Comments view */}
      <div className="kd-comments">
        {/* Caption/Description inside comments wrapper if exists */}
        {isEditing ? (
          <div className="mb-3 p-3 bg-zinc-950 border border-teal-500/30 rounded-xl space-y-2.5">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="📌 Özel Başlık (İsteğe Bağlı)..."
              className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-bold text-teal-300 placeholder:text-zinc-600 focus:outline-none focus:border-teal-500/50"
            />
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              placeholder="Açıklama..."
              rows={2}
              className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-teal-500/50 resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleEditToggle}
                className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-bold rounded-lg cursor-pointer"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleSavePozKesEdit}
                disabled={isPending || !editBody.trim()}
                className="px-3 py-1 bg-teal-500 hover:bg-teal-400 text-black text-xs font-bold rounded-lg disabled:opacity-50 cursor-pointer"
              >
                {isPending ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        ) : (
          captionBody && (
            <div className="mb-2 pb-2 border-b border-zinc-850/50 text-[13px] text-zinc-300 leading-relaxed flex items-start gap-2">
              {entry.author.avatarUrl ? (
                <img
                  src={`/api/yazar-image/${encodeURIComponent(entry.author.username)}`}
                  alt={entry.author.username}
                  width={22}
                  height={22}
                  className="avatar avatar-xs avatar-img mt-0.5"
                />
              ) : (
                <div
                  className="avatar avatar-xs flex items-center justify-center font-bold text-black border border-white/5 text-[9px] shrink-0 mt-0.5"
                  style={{ backgroundColor: entry.author.avatarColor }}
                >
                  {(entry.author.displayName ?? entry.author.username).substring(0, 1).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/yazar/${entry.author.username}`}
                  prefetch={false}
                  className="font-bold text-white hover:text-teal-400 mr-1.5"
                >
                  {entry.author.displayName ?? entry.author.username}
                </Link>
                <span className="text-zinc-200">
                  <ExpandableMentionText content={captionBody} />
                </span>
              </div>
            </div>
          )
        )}

        {comments.length > 0 && (
          <ul className="kd-comment-list">
            {comments.map((comment) => (
              <li key={comment.id} className="kd-comment-item">
                <Link 
                  className="kd-comment-avatar" 
                  href={`/yazar/${comment.author.username}`}
                  prefetch={false}
                >
                  {comment.author.avatarUrl ? (
                    <img
                      src={`/api/yazar-image/${encodeURIComponent(comment.author.username)}`}
                      alt={comment.author.username}
                      width={24}
                      height={24}
                      className="avatar avatar-xs avatar-img"
                    />
                  ) : (
                    <div
                      className="avatar avatar-xs flex items-center justify-center font-bold text-black border border-white/5 text-[9px] shrink-0"
                      style={{ backgroundColor: comment.author.avatarColor }}
                    >
                      {(comment.author.displayName ?? comment.author.username).substring(0, 1).toUpperCase()}
                    </div>
                  )}
                </Link>
                <div className="kd-comment-body">
                  <Link
                    href={`/yazar/${comment.author.username}`}
                    prefetch={false}
                    className="kd-comment-author"
                  >
                    {comment.author.displayName ?? comment.author.username}
                  </Link>
                  <span className="kd-comment-text">
                    <ExpandableMentionText content={comment.content} limit={150} />
                  </span>
                </div>

                <button
                  onClick={() => handleLikeComment(comment.id, comment.hasLiked)}
                  className={`kd-comment-like-btn ${comment.hasLiked ? "liked" : ""}`}
                  type="button"
                  aria-label="Beğen"
                >
                  {comment.hasLiked ? "❤️" : "🤍"}
                  {comment.likesCount > 0 && (
                    <span className="kd-comment-like-count">{comment.likesCount}</span>
                  )}
                </button>
                
                {(currentUserId === comment.author.id || isAdmin) && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="kd-comment-del"
                    title="Yorumu sil"
                    type="button"
                  >
                    ×
                  </button>
                )}

                {currentUserId !== comment.author.id && (
                  <button
                    onClick={() => handleReportContent("COMMENT", comment.id)}
                    className="kd-comment-report-btn"
                    title="Yorumu şikayet et"
                    type="button"
                  >
                    ⚑
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Comment input form */}
        {isLoggedIn ? (
          <form onSubmit={handleCommentSubmit} className="kd-comment-form">
            <div className="mention-wrap">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Yorum ekle…"
                disabled={isPending || isSubmitting}
                maxLength={500}
                rows={1}
                className="kd-comment-input"
              />
            </div>
            <button
              type="submit"
              disabled={isPending || isSubmitting || !newComment.trim()}
              className="kd-comment-submit"
            >
              Gönder
            </button>
          </form>
        ) : (
          <div className="kd-login-hint">
            Yorum eklemek için lütfen giriş yapın.
          </div>
        )}
      </div>
    </article>
  );
}
