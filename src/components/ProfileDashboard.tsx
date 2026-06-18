"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Calendar, Shield, MessageSquare, BookOpen, ThumbsUp, Users, ArrowRight } from "lucide-react";
import { playBuzzSound } from "@/lib/utils";
import MentionText from "@/components/MentionText";
import FollowButton from "@/components/FollowButton";
import FlyRankBadge, { getRankByScore } from "@/components/FlyRankBadge";
import { createPozKesEntryAction } from "@/app/actions";

interface ProfileDashboardProps {
  author: {
    id: string;
    username: string;
    avatarColor: string;
    avatarUrl: string | null;
    role: string;
    bio: string | null;
    createdAt: Date;
  };
  sessionUser: {
    id: string;
    username: string;
    role: string;
  } | null;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  score: number;
  entries: Array<{
    id: string;
    content: string;
    imageUrl: string | null;
    createdAt: Date;
    topic: {
      title: string;
      slug: string;
    };
    likesCount: number;
    dislikesCount: number;
    userReaction: "LIKE" | "DISLIKE" | null;
  }>;
  comments: Array<{
    id: string;
    content: string;
    createdAt: Date;
    entry: {
      id: string;
      topic: {
        title: string;
        slug: string;
      };
    };
    likesCount: number;
  }>;
  followers: Array<{
    id: string;
    username: string;
    avatarColor: string;
    avatarUrl: string | null;
    role: string;
  }>;
  following: Array<{
    id: string;
    username: string;
    avatarColor: string;
    avatarUrl: string | null;
    role: string;
  }>;
}

export default function ProfileDashboard({
  author,
  sessionUser,
  followersCount,
  followingCount,
  isFollowing,
  score,
  entries,
  comments,
  followers,
  following,
}: ProfileDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"girdiler" | "yanitlar" | "fotograflar" | "takipci" | "takip">("girdiler");
  const [isPending, startTransition] = useTransition();

  const isSelf = sessionUser?.id === author.id;
  const currentRank = getRankByScore(score);

  // Filter entries
  const textEntries = entries.filter((e) => !e.imageUrl);
  const photoEntries = entries.filter((e) => !!e.imageUrl);

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    playBuzzSound();
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1.5 * 1024 * 1024) {
      alert("Görsel boyutu 1.5MB'dan küçük olmalıdır zzz.");
      return;
    }

    const desc = window.prompt("Fotoğraf açıklaması girin (en az 5 karakter):");
    if (!desc || desc.trim().length < 5) {
      alert("Açıklama geçersiz veya çok kısa.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      startTransition(async () => {
        const result = await createPozKesEntryAction("pozkes galeri", desc, base64);
        if (result.error) {
          alert(result.error);
        } else {
          playBuzzSound();
          router.refresh();
          window.location.reload();
        }
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="profile-page flex flex-col gap-5 animate-in fade-in duration-300">
      
      {/* Profile Card */}
      <div className="profile-card">
        <div className="profile-banner"></div>
        <div className="profile-card-body">
          {/* Avatar Icon */}
          <div className="profile-avatar-wrap">
            {author.avatarUrl ? (
              <img
                src={author.avatarUrl}
                alt={author.username}
                className="w-20 h-20 rounded-full object-cover border-4 border-slate-800 shadow-md shrink-0"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center font-bold text-black border-4 border-slate-800 text-3xl shadow-inner select-none shrink-0"
                style={{ backgroundColor: author.avatarColor }}
              >
                {author.username.substring(0, 1).toUpperCase()}
              </div>
            )}
          </div>

          <div className="profile-identity">
            <div className="profile-identity-top">
              <div className="profile-name-row">
                <h1 className="profile-username flex items-center gap-1.5">
                  <span>@{author.username}</span>
                  {author.role === "ADMIN" && (
                    <span title="Yönetici (Admin)">
                      <Shield className="h-4 w-4 text-teal-400" />
                    </span>
                  )}
                </h1>
              </div>
              <div className="profile-actions">
                {isSelf ? (
                  <Link className="btn btn-outline btn-sm text-xs font-bold px-4 py-2 border border-slate-700 hover:border-teal-500 rounded-lg text-slate-350 hover:text-white transition-all bg-slate-900/60" href="/settings">
                    Profili Düzenle
                  </Link>
                ) : (
                  sessionUser && (
                    <div className="flex items-center gap-2">
                      <FollowButton
                        targetUserId={author.id}
                        initialIsFollowing={isFollowing}
                        isLoggedIn={!!sessionUser}
                      />
                      <Link
                        href={`/mesajlar?u=${author.username}`}
                        className="flex items-center gap-1 px-4 py-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-teal-500 text-white text-xs font-bold transition-all"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-teal-400" />
                        <span>Mesaj</span>
                      </Link>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Biography */}
            {author.bio && (
              <p className="text-xs sm:text-sm text-slate-300 mt-1 mb-2 max-w-lg leading-relaxed italic border-l-2 border-slate-700 pl-2.5">
                &ldquo;{author.bio}&rdquo;
              </p>
            )}

            {/* Rank badge Row */}
            <div className="profile-badge-row flex items-center gap-3">
              <FlyRankBadge score={score} />
              <div className="flex flex-col select-none">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">
                  Seviye {currentRank.level}
                </span>
                <span className="text-sm font-black text-lime-400 mt-0.5">
                  {currentRank.name} {currentRank.emoji}
                </span>
                <span className="text-[11px] text-zinc-400 mt-0.5 italic">
                  &ldquo;{currentRank.description}&rdquo;
                </span>
              </div>
            </div>

            {/* Stats row */}
            <div className="profile-stats mt-2">
              <button onClick={() => handleTabChange("takipci")} className="profile-stat-btn">
                <strong>{followersCount}</strong> takipçi
              </button>
              <button onClick={() => handleTabChange("takip")} className="profile-stat-btn">
                <strong>{followingCount}</strong> takip
              </button>
              <span>
                <strong>{entries.length}</strong> gönderi
              </span>
               <span>• Katılım: {new Date(author.createdAt).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Showcase (Kadraj) */}
      <div className="photo-showcase">
        <div className="photo-showcase-header">
          <h3>Kadraj</h3>
          {photoEntries.length > 0 && (
            <button onClick={() => handleTabChange("fotograflar")} className="photo-showcase-all">
              Tümünü Gör ({photoEntries.length})
            </button>
          )}
        </div>
        <div className="photo-showcase-grid">
          {isSelf && (
            <label className="photo-showcase-upload" title="Fotoğraf ekle">
              <span className="photo-showcase-upload-icon">+</span>
              <span className="photo-showcase-upload-label">
                {isPending ? "Yükleniyor..." : "Foto ekle catlasinlar"}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={isPending}
                style={{ display: "none" }}
              />
            </label>
          )}
          {photoEntries.slice(0, isSelf ? 5 : 6).map((photo) => (
            <div key={photo.id} className="photo-showcase-item photo-showcase-item--btn">
              <Link href={`/pozkes#entry-${photo.id}`} onClick={() => playBuzzSound()}>
                <img
                  src={photo.imageUrl!}
                  alt="Poz"
                  className="photo-showcase-img"
                  loading="lazy"
                />
              </Link>
            </div>
          ))}
          {/* Empty cells to fill the 6-grid placeholder if empty */}
          {Array.from({ length: Math.max(0, (isSelf ? 5 : 6) - photoEntries.length) }).map((_, idx) => (
            <div key={`empty-${idx}`} className="photo-showcase-item opacity-15"></div>
          ))}
        </div>
      </div>

      {/* Stalksss Section */}
      <div className="stalksss-section">
        <div className="stalksss-header">
          <h2 className="stalksss-title">Stalksss</h2>
        </div>
        <div className="stalksss-tabs">
          <button
            onClick={() => handleTabChange("girdiler")}
            className={`stalksss-tab ${activeTab === "girdiler" ? "active" : ""}`}
          >
            Girdiler ({textEntries.length})
          </button>
          <button
            onClick={() => handleTabChange("yanitlar")}
            className={`stalksss-tab ${activeTab === "yanitlar" ? "active" : ""}`}
          >
            Yorumlar ({comments.length})
          </button>
          <button
            onClick={() => handleTabChange("fotograflar")}
            className={`stalksss-tab ${activeTab === "fotograflar" ? "active" : ""}`}
          >
            Fotoğraflar ({photoEntries.length})
          </button>
          <button
            onClick={() => handleTabChange("takipci")}
            className={`stalksss-tab ${activeTab === "takipci" ? "active" : ""}`}
          >
            Takipçiler ({followers.length})
          </button>
          <button
            onClick={() => handleTabChange("takip")}
            className={`stalksss-tab ${activeTab === "takip" ? "active" : ""}`}
          >
            Takip Edilenler ({following.length})
          </button>
        </div>

        <div className="stalksss-content">
          {/* Active Tab View */}
          {activeTab === "girdiler" && (
            <div className="space-y-4">
              {textEntries.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500 italic">Henüz başlık açılmamış veya entry girilmemiş.</div>
              ) : (
                textEntries.map((entry) => (
                  <article key={entry.id} className="p-4 rounded-xl border border-slate-850 bg-slate-950/20 space-y-2">
                    <div className="flex justify-between items-baseline gap-2">
                      <Link href={`/baslik/${entry.topic.slug}`} className="text-sm font-bold text-white hover:text-teal-400">
                        {entry.topic.title}
                      </Link>
                       <span className="text-[10px] text-slate-500">{new Date(entry.createdAt).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" })}</span>
                    </div>
                    <div className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      <MentionText content={entry.content} />
                    </div>
                  </article>
                ))
              )}
            </div>
          )}

          {activeTab === "yanitlar" && (
            <div className="space-y-4">
              {comments.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500 italic">Henüz yorum yapılmamış.</div>
              ) : (
                comments.map((comment) => (
                  <article key={comment.id} className="p-4 rounded-xl border border-slate-850 bg-slate-950/20 space-y-2">
                    <div className="flex justify-between items-baseline gap-2">
                      <div className="text-[11px] text-slate-400">
                        <Link href={`/baslik/${comment.entry.topic.slug}#entry-${comment.entry.id}`} className="font-semibold text-slate-300 hover:text-teal-400">
                          {comment.entry.topic.title}
                        </Link>{" "}
                        başlığındaki gönderiye vızıldadı
                      </div>
                       <span className="text-[10px] text-slate-500">{new Date(comment.createdAt).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" })}</span>
                    </div>
                    <div className="text-xs text-slate-200">
                      <MentionText content={comment.content} />
                    </div>
                  </article>
                ))
              )}
            </div>
          )}

          {activeTab === "fotograflar" && (
            <div className="space-y-4">
              {photoEntries.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500 italic">Henüz fotoğraf paylaşılmamış.</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {photoEntries.map((photo) => (
                    <div key={photo.id} className="group relative aspect-square rounded-xl overflow-hidden border border-slate-850 bg-slate-900/30">
                      <img src={photo.imageUrl!} alt="Poz" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col justify-end p-2.5 transition-all">
                        <Link href={`/pozkes#entry-${photo.id}`} className="text-[10px] font-bold text-white hover:underline flex items-center gap-1 justify-between">
                          <span>Akışta Gör</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "takipci" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {followers.length === 0 ? (
                <div className="col-span-2 text-center py-6 text-xs text-slate-500 italic">Henüz takipçi bulunmuyor.</div>
              ) : (
                followers.map((f) => (
                  <Link
                    key={f.id}
                    href={`/yazar/${f.username}`}
                    onClick={() => playBuzzSound()}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-850 bg-slate-950/20 hover:border-slate-800 transition-all"
                  >
                    {f.avatarUrl ? (
                      <img src={f.avatarUrl} alt={f.username} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-black text-xs shrink-0" style={{ backgroundColor: f.avatarColor }}>
                        {f.username.substring(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-200 block truncate">@{f.username}</span>
                      {f.role === "ADMIN" && <span className="text-[9px] text-teal-400 font-bold">Admin</span>}
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {activeTab === "takip" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {following.length === 0 ? (
                <div className="col-span-2 text-center py-6 text-xs text-slate-500 italic">Takip edilen yazar bulunmuyor.</div>
              ) : (
                following.map((f) => (
                  <Link
                    key={f.id}
                    href={`/yazar/${f.username}`}
                    onClick={() => playBuzzSound()}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-850 bg-slate-950/20 hover:border-slate-800 transition-all"
                  >
                    {f.avatarUrl ? (
                      <img src={f.avatarUrl} alt={f.username} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-black text-xs shrink-0" style={{ backgroundColor: f.avatarColor }}>
                        {f.username.substring(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-200 block truncate">@{f.username}</span>
                      {f.role === "ADMIN" && <span className="text-[9px] text-teal-400 font-bold">Admin</span>}
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}
