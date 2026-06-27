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
  gifts?: Array<{
    id: string;
    giftType: string;
    note: string | null;
    createdAt: Date;
    givenBy: {
      username: string;
    };
  }>;
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

const ALL_GIFTS_MAP: Record<string, { name: string; emoji: string; description: string }> = {
  SWEET: { name: "Tatlı Sinek", emoji: "🍬", description: "Pozitif, sevecen ve tatlı dilli yazarlara verilir." },
  KING: { name: "Kral Sinek", emoji: "👑", description: "Derin, yüksek kaliteli yazılar yazan bilge yazarlara verilir." },
  SWATTER: { name: "Sinek Raketi", emoji: "🎾", description: "Trolleri raporlayarak asayişi koruyan yazarlara verilir." },
  LIGHTNING: { name: "Yıldırım Vızıltı", emoji: "⚡", description: "Gündemdeki sıcak haberleri çok hızlı giren yazarlara verilir." },
  STEEL: { name: "Çelik Kanat", emoji: "🛡️", description: "Sözlüğün ilk gününden beri destek veren en sadık emektarlara verilir." },
  MIDNIGHT: { name: "Gece Sinekleri", emoji: "☕", description: "Gece geç saatlerde aktif olan, gece kuşu yazarlara verilir." },
  WATERMELON: { name: "Karpuz Dilimi", emoji: "🍉", description: "Sözlükde herkesi güldüren mizah yetenekli yazarlara verilir." },
  TECH: { name: "Detektör Sinek", emoji: "🔍", description: "Teknik hataları bildiren ve gelişime destek veren yazarlara verilir." },
  SOCIAL: { name: "Röportajcı", emoji: "🎤", description: "Sık anket açan ve yazarlarla etkileşimi yüksek olan sosyal yazarlara verilir." },
  TREND: { name: "Alev Kanat", emoji: "🔥", description: "Açtığı başlıklar veya entryler trend olan popüler yazarlara verilir." },
  AMBER: { name: "Kehribar Sinek", emoji: "💎", description: "Sözlük tarihinde ölümsüzleşen, en elit efsane yazarlara verilir." },
  ACHIEVEMENT: { name: "Üstün Başarı Belgesi", emoji: "📜", description: "Sözlüğün kalkınmasında olağanüstü emek veren yazarlara verilir." },
  HONOR: { name: "Sözlük Onur Belgesi", emoji: "🎖️", description: "Hiç ceza almamış, örnek ahlaka sahip saygın yazarlara verilir." },
  AGENT: { name: "Gizli Teşkilat Belgesi", emoji: "🕵️‍♂️", description: "Trolleri ve spam grupları deşifre eden istihbarat yazarlarına verilir." },
  ACADEMY: { name: "Vızıltı Akademisi Diploması", emoji: "🎓", description: "Felsefi, bilimsel veya akademik derinliği olan yazılar yazanlara verilir." }
};

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
  gifts = [],
}: ProfileDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"girdiler" | "yanitlar" | "fotograflar" | "takipci" | "takip">("girdiler");
  const [isPending, startTransition] = useTransition();

  const isSelf = sessionUser?.id === author.id;
  const currentRank = getRankByScore(score);

  // Filter entries
  const textEntries = entries.filter((e) => !e.imageUrl);
  const photoEntries = entries.filter((e) => !!e.imageUrl);

  const [entriesLimit, setEntriesLimit] = useState(10);
  const [commentsLimit, setCommentsLimit] = useState(10);
  const [followersLimit, setFollowersLimit] = useState(10);
  const [followingLimit, setFollowingLimit] = useState(10);
  const [photosLimit, setPhotosLimit] = useState(10);

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setEntriesLimit(10);
    setCommentsLimit(10);
    setFollowersLimit(10);
    setFollowingLimit(10);
    setPhotosLimit(10);
  };

  // Stack gifts by type for display
  const stackedGiftsMap: Record<string, { giftType: string; count: number; note: string | null; givenBy: string }> = {};
  for (const g of gifts) {
    if (!stackedGiftsMap[g.giftType]) {
      stackedGiftsMap[g.giftType] = {
        giftType: g.giftType,
        count: 1,
        note: g.note,
        givenBy: g.givenBy.username
      };
    } else {
      stackedGiftsMap[g.giftType].count += 1;
    }
  }
  const stackedGifts = Object.values(stackedGiftsMap).slice(0, 3);

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
                src={`/api/yazar-image/${encodeURIComponent(author.username)}`}
                alt={author.username}
                width={80}
                height={80}
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
                  <Link 
                    className="btn btn-outline btn-sm text-xs font-bold px-4 py-2 border border-slate-700 hover:border-teal-500 rounded-lg text-slate-350 hover:text-white transition-all bg-slate-900/60" 
                    href="/settings"
                    prefetch={false}
                  >
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
                        prefetch={false}
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

            {/* Hediyeler & Belgeler Vitrini */}
            {stackedGifts.length > 0 && (
              <div className="flex items-center gap-2 mt-2 mb-3 bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-900/60 max-w-sm select-none animate-in fade-in duration-200">
                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider shrink-0 mr-1.5">
                  Vitrin:
                </span>
                <div className="flex items-center gap-2">
                  {stackedGifts.map((sg) => {
                    const giftInfo = ALL_GIFTS_MAP[sg.giftType] || { name: sg.giftType, emoji: "🎁", description: "" };
                    const tooltipText = `${giftInfo.name}${sg.count > 1 ? ` (x${sg.count})` : ""} - @${sg.givenBy} tarafından verildi.${sg.note ? ` "${sg.note}"` : ""}`;
                    
                    return (
                      <div
                        key={sg.giftType}
                        className="group relative cursor-help flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-850 transition-all active:scale-95 duration-150"
                        title={tooltipText}
                      >
                        <span className="text-lg">{giftInfo.emoji}</span>
                        {sg.count > 1 && (
                          <span className="absolute -top-1.5 -right-1.5 px-1 rounded-full bg-amber-500 text-[8px] font-black text-black leading-none py-0.5 min-w-3.5 text-center">
                            {sg.count}
                          </span>
                        )}
                        
                        {/* Custom visual glow for EFSANEVİ Amber Gift */}
                        {sg.giftType === "AMBER" && (
                          <span className="absolute inset-0 rounded-lg border border-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
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
              <Link 
                href={`/pozkes#entry-${photo.id}`} 
                prefetch={false}
                onClick={() => playBuzzSound()}
              >
                <img
                  src={photo.imageUrl!}
                  alt="Poz"
                  width={150}
                  height={150}
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
                <>
                  {textEntries.slice(0, entriesLimit).map((entry) => (
                    <article key={entry.id} className="p-4 rounded-xl border border-slate-850 bg-slate-950/20 space-y-2">
                      <div className="flex justify-between items-baseline gap-2">
                        <Link 
                          href={`/baslik/${entry.topic.slug}`} 
                          prefetch={false}
                          className="text-sm font-bold text-white hover:text-teal-400"
                        >
                          {entry.topic.title}
                        </Link>
                         <span className="text-[10px] text-slate-500">{new Date(entry.createdAt).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" })}</span>
                      </div>
                      <div className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        <MentionText content={entry.content} />
                      </div>
                    </article>
                  ))}
                  {textEntries.length > entriesLimit && (
                    <div className="flex justify-center pt-2">
                      <button
                        onClick={() => { playBuzzSound(); setEntriesLimit(prev => prev + 10); }}
                        className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-350 hover:text-white rounded-lg transition-colors cursor-pointer active:scale-95"
                      >
                        Daha Fazla Göster zzz
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === "yanitlar" && (
            <div className="space-y-4">
              {comments.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500 italic">Henüz yorum yapılmamış.</div>
              ) : (
                <>
                  {comments.slice(0, commentsLimit).map((comment) => (
                    <article key={comment.id} className="p-4 rounded-xl border border-slate-850 bg-slate-950/20 space-y-2">
                      <div className="flex justify-between items-baseline gap-2">
                        <div className="text-[11px] text-slate-400">
                          <Link 
                            href={`/baslik/${comment.entry.topic.slug}#entry-${comment.entry.id}`} 
                            prefetch={false}
                            className="font-semibold text-slate-300 hover:text-teal-400"
                          >
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
                  ))}
                  {comments.length > commentsLimit && (
                    <div className="flex justify-center pt-2">
                      <button
                        onClick={() => { playBuzzSound(); setCommentsLimit(prev => prev + 10); }}
                        className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-350 hover:text-white rounded-lg transition-colors cursor-pointer active:scale-95"
                      >
                        Daha Fazla Göster zzz
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === "fotograflar" && (
            <div className="space-y-4">
              {photoEntries.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500 italic">Henüz fotoğraf paylaşılmamış.</div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {photoEntries.slice(0, photosLimit).map((photo) => (
                      <div key={photo.id} className="group relative aspect-square rounded-xl overflow-hidden border border-slate-850 bg-slate-900/30">
                        <img src={photo.imageUrl!} alt="Poz" width={150} height={150} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col justify-end p-2.5 transition-all">
                          <Link 
                            href={`/pozkes#entry-${photo.id}`} 
                            prefetch={false}
                            className="text-[10px] font-bold text-white hover:underline flex items-center gap-1 justify-between"
                          >
                            <span>Akışta Gör</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                  {photoEntries.length > photosLimit && (
                    <div className="flex justify-center pt-2">
                      <button
                        onClick={() => { playBuzzSound(); setPhotosLimit(prev => prev + 10); }}
                        className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-350 hover:text-white rounded-lg transition-colors cursor-pointer active:scale-95"
                      >
                        Daha Fazla Göster zzz
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === "takipci" && (
            <div className="space-y-4">
              {followers.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500 italic">Henüz takipçi bulunmuyor.</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {followers.slice(0, followersLimit).map((f) => (
                      <Link
                        key={f.id}
                        href={`/yazar/${f.username}`}
                        prefetch={false}
                        onClick={() => playBuzzSound()}
                        className="flex items-center gap-3 p-3 rounded-xl border border-slate-850 bg-slate-950/20 hover:border-slate-800 transition-all"
                      >
                        {f.avatarUrl ? (
                          <img src={`/api/yazar-image/${encodeURIComponent(f.username)}`} alt={f.username} width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
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
                    ))}
                  </div>
                  {followers.length > followersLimit && (
                    <div className="flex justify-center pt-2">
                      <button
                        onClick={() => { playBuzzSound(); setFollowersLimit(prev => prev + 10); }}
                        className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-350 hover:text-white rounded-lg transition-colors cursor-pointer active:scale-95"
                      >
                        Daha Fazla Göster zzz
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === "takip" && (
            <div className="space-y-4">
              {following.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500 italic">Takip edilen yazar bulunmuyor.</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {following.slice(0, followingLimit).map((f) => (
                      <Link
                        key={f.id}
                        href={`/yazar/${f.username}`}
                        prefetch={false}
                        onClick={() => playBuzzSound()}
                        className="flex items-center gap-3 p-3 rounded-xl border border-slate-850 bg-slate-950/20 hover:border-slate-800 transition-all"
                      >
                        {f.avatarUrl ? (
                          <img src={`/api/yazar-image/${encodeURIComponent(f.username)}`} alt={f.username} width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
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
                    ))}
                  </div>
                  {following.length > followingLimit && (
                    <div className="flex justify-center pt-2">
                      <button
                        onClick={() => { playBuzzSound(); setFollowingLimit(prev => prev + 10); }}
                        className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-350 hover:text-white rounded-lg transition-colors cursor-pointer active:scale-95"
                      >
                        Daha Fazla Göster zzz
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}
