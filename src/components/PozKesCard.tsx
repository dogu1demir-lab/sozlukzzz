"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  likeEntryAction, 
  createCommentAction, 
  likeCommentAction, 
  deleteCommentAction,
  reportAction
} from "@/app/actions";
import { playBuzzSound } from "@/lib/utils";
import MentionText from "@/components/MentionText";
import ExpandableMentionText from "@/components/ExpandableMentionText";

interface PozKesCardProps {
  entry: {
    id: string;
    content: string;
    imageUrl: string;
    createdAt: Date;
    author: {
      id: string;
      username: string;
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

export default function PozKesCard({ entry, isLoggedIn, currentUserId, isAdmin }: PozKesCardProps) {
  const router = useRouter();
  const [likesCount, setLikesCount] = useState(entry.likesCount);
  const [hasLiked, setHasLiked] = useState(entry.hasLiked);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState(entry.comments);
  const [isPending, startTransition] = useTransition();

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

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    playBuzzSound();

    startTransition(async () => {
      const result = await createCommentAction(entry.id, newComment);
      if (result.error) {
        alert(result.error);
      } else {
        setNewComment("");
        // We will reload or refresh
        router.refresh();
        window.location.reload(); // Fallback for instant update of page content
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
        <Link
          href={`/yazar/${entry.author.username}`}
          className="kd-card-author"
          onClick={() => playBuzzSound()}
        >
          {entry.author.avatarUrl ? (
            <img
              src={entry.author.avatarUrl}
              alt={entry.author.username}
              className="avatar avatar-sm avatar-img"
            />
          ) : (
            <div
              className="avatar avatar-sm"
              aria-label={entry.author.username}
              style={{ backgroundColor: entry.author.avatarColor }}
            >
              {entry.author.username.substring(0, 1).toUpperCase()}
            </div>
          )}
          <span className="kd-card-username">{entry.author.username}</span>
        </Link>
      </div>

      {/* Image body */}
      <div className="kd-card-img-wrap">
        <img
          src={entry.imageUrl}
          alt={`${entry.author.username} tarafından paylaşıldı`}
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
        {entry.content && (
          <div className="mb-2 pb-2 border-b border-zinc-850/50 text-[13px] text-zinc-300 leading-relaxed flex items-start gap-2">
            {entry.author.avatarUrl ? (
              <img
                src={entry.author.avatarUrl}
                alt={entry.author.username}
                className="avatar avatar-xs avatar-img mt-0.5"
              />
            ) : (
              <div
                className="avatar avatar-xs flex items-center justify-center font-bold text-black border border-white/5 text-[9px] shrink-0 mt-0.5"
                style={{ backgroundColor: entry.author.avatarColor }}
              >
                {entry.author.username.substring(0, 1).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <Link
                href={`/yazar/${entry.author.username}`}
                className="font-bold text-white hover:text-teal-400 mr-1.5"
              >
                {entry.author.username}
              </Link>
              <span className="text-zinc-200 block mt-1">
                <ExpandableMentionText content={entry.content} />
              </span>
            </div>
          </div>
        )}

        {comments.length > 0 && (
          <ul className="kd-comment-list">
            {comments.map((comment) => (
              <li key={comment.id} className="kd-comment-item">
                <Link className="kd-comment-avatar" href={`/yazar/${comment.author.username}`}>
                  {comment.author.avatarUrl ? (
                    <img
                      src={comment.author.avatarUrl}
                      alt={comment.author.username}
                      className="avatar avatar-xs avatar-img"
                    />
                  ) : (
                    <div
                      className="avatar avatar-xs flex items-center justify-center font-bold text-black border border-white/5 text-[9px] shrink-0"
                      style={{ backgroundColor: comment.author.avatarColor }}
                    >
                      {comment.author.username.substring(0, 1).toUpperCase()}
                    </div>
                  )}
                </Link>
                <div className="kd-comment-body">
                  <Link
                    href={`/yazar/${comment.author.username}`}
                    className="kd-comment-author"
                  >
                    {comment.author.username}
                  </Link>
                  <span className="kd-comment-text">
                    <MentionText content={comment.content} />
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
                disabled={isPending}
                maxLength={500}
                rows={1}
                className="kd-comment-input"
              />
            </div>
            <button
              type="submit"
              disabled={isPending || !newComment.trim()}
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
