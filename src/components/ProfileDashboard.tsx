"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Calendar, Shield, MessageSquare, BookOpen, ThumbsUp, Users, ArrowRight, X, Send, AlertCircle } from "lucide-react";
import { playBuzzSound, formatDate } from "@/lib/utils";
import MentionText from "@/components/MentionText";
import FollowButton from "@/components/FollowButton";
import FlyRankBadge, { getRankByScore } from "@/components/FlyRankBadge";
import { createPozKesEntryAction, setAvatarFromPozKesAction, addProfilePhotoAction, removeProfilePhotoAction } from "@/app/actions";

interface ProfileDashboardProps {
  gifts?: Array<{
    id: string;
    giftType: string;
    note: string | null;
    createdAt: Date;
    givenBy: {
      username: string;
      displayName?: string | null;
    };
  }>;
  author: {
    id: string;
    username: string;
    displayName?: string | null;
    avatarColor: string;
    avatarUrl: string | null;
    profilePhotos?: string[];
    role: string;
    bio: string | null;
    createdAt: Date;
  };
  sessionUser: {
    id: string;
    username: string;
    displayName?: string | null;
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
    displayName?: string | null;
    avatarColor: string;
    avatarUrl: string | null;
    role: string;
  }>;
  following: Array<{
    id: string;
    username: string;
    displayName?: string | null;
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

  const displayAvatarUrl = author.avatarUrl || (photoEntries.length > 0 ? photoEntries[0].imageUrl : null);

  const avatarImgUrl = author.avatarUrl ? `/api/yazar-image/${encodeURIComponent(author.username)}` : null;

  let displayProfilePhotos: string[] = [];
  if (author.profilePhotos && author.profilePhotos.length > 0) {
    displayProfilePhotos = [...author.profilePhotos];
    if (avatarImgUrl && author.avatarUrl && !author.profilePhotos.includes(author.avatarUrl) && !author.profilePhotos.includes(avatarImgUrl)) {
      displayProfilePhotos = [avatarImgUrl, ...author.profilePhotos].slice(0, 5);
    }
  } else if (avatarImgUrl) {
    displayProfilePhotos = [avatarImgUrl];
  }

  const [entriesLimit, setEntriesLimit] = useState(10);
  const [commentsLimit, setCommentsLimit] = useState(10);
  const [followersLimit, setFollowersLimit] = useState(10);
  const [followingLimit, setFollowingLimit] = useState(10);
  const [photosLimit, setPhotosLimit] = useState(10);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const handleSetAsAvatar = (photoUrl: string) => {
    startTransition(async () => {
      const res = await setAvatarFromPozKesAction(photoUrl);
      if (res.success) {
        playBuzzSound();
        router.refresh();
      }
    });
  };

  const handleRemoveProfilePhoto = (photoUrl: string) => {
    if (!confirm("Bu profil fotoğrafını silmek istediğinize emin misiniz?")) return;
    startTransition(async () => {
      const res = await removeProfilePhotoAction(photoUrl);
      if (res.success) {
        playBuzzSound();
        router.refresh();
      }
    });
  };
  
  const [uploadPhotoBase64, setUploadPhotoBase64] = useState<string>("");
  const [uploadPhotoDesc, setUploadPhotoDesc] = useState<string>("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);

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

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setUploadPhotoBase64(base64);
      setUploadPhotoDesc("");
      setUploadError("");
      setIsUploadModalOpen(true);
      
      // Clear input to allow uploading same file again
      e.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmUpload = async () => {
    setIsUploading(true);
    setUploadError("");

    try {
      const result = await addProfilePhotoAction(uploadPhotoBase64);
      if (result.error) {
        setUploadError(result.error);
        setIsUploading(false);
      } else {
        playBuzzSound();
        setIsUploadModalOpen(false);
        setUploadPhotoBase64("");
        router.refresh();
      }
    } catch (err) {
      setUploadError("Profil fotoğrafı yüklenirken hata oluştu.");
      setIsUploading(false);
    }
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
                className="w-20 h-20 rounded-full object-cover border-4 border-slate-800 shadow-md shrink-0 ring-2 ring-lime-500/40"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center font-bold text-black border-4 border-slate-800 text-3xl shadow-inner select-none shrink-0"
                style={{ backgroundColor: author.avatarColor }}
              >
                {(author.displayName ?? author.username).substring(0, 1).toUpperCase()}
              </div>
            )}
          </div>

          <div className="profile-identity">
            <div className="profile-identity-top">
              <div className="profile-name-row">
                <div className="flex flex-col gap-0.5">
                  <h1 className="profile-username flex items-center gap-1.5 text-xl font-bold text-white leading-tight">
                    <span>{author.displayName ?? author.username}</span>
                    {author.role === "ADMIN" && (
                      <span title="Yönetici (Admin)">
                        <Shield className="h-4.5 w-4.5 text-teal-400" />
                      </span>
                    )}
                  </h1>
                  <span className="text-xs text-zinc-550 font-normal">@{author.username}</span>
                </div>
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

      {/* Profil Resimleri (5 Adet Dedicated Profil Fotoğrafı Vitrini) */}
      <div className="photo-showcase">
        <div className="photo-showcase-header">
          <div className="flex items-center gap-2">
            <h3>Profil Resimleri</h3>
            <span className="text-[10px] font-extrabold bg-lime-500/10 text-lime-400 border border-lime-500/20 px-2 py-0.5 rounded-full">
              5 Fotoğraf Vitrini
            </span>
          </div>
          {photoEntries.length > 0 && (
            <button onClick={() => handleTabChange("fotograflar")} className="photo-showcase-all">
              PozKes Galerisi ({photoEntries.length})
            </button>
          )}
        </div>

        {/* Ana Büyük Profil Resmi Hero View */}
        {displayProfilePhotos.length > 0 ? (
          <div className="mb-3 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 relative group">
            <div className="block relative aspect-video sm:aspect-[16/9] max-h-[320px] overflow-hidden">
              <img
                src={displayProfilePhotos[selectedPhotoIndex] || displayProfilePhotos[0]}
                alt="Profil Resmi"
                onClick={() => setLightboxUrl(displayProfilePhotos[selectedPhotoIndex] || displayProfilePhotos[0])}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-pointer"
                title="Fotoğrafı Tam Ekran Büyüt 🔍"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3 sm:p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-zinc-200">
                    Profil Fotoğrafı #{selectedPhotoIndex + 1}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {isSelf && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSetAsAvatar(displayProfilePhotos[selectedPhotoIndex] || displayProfilePhotos[0])}
                          disabled={isPending}
                          className="text-[10px] font-black bg-lime-500 text-black px-2.5 py-1 rounded-md hover:bg-lime-400 active:scale-95 transition-all shadow"
                          title="Bu fotoğrafı Ana Profil Resmi Yap"
                        >
                          Ana Profil Resmi Yap 🖼️
                        </button>
                        {author.profilePhotos && author.profilePhotos.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveProfilePhoto(author.profilePhotos![selectedPhotoIndex] || author.profilePhotos![0])}
                            disabled={isPending}
                            className="text-[10px] font-black bg-rose-500/20 border border-rose-500/40 text-rose-400 px-2 py-1 rounded-md hover:bg-rose-500/30 active:scale-95 transition-all"
                            title="Fotoğrafı Sil"
                          >
                            Sil 🗑️
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-3 p-6 text-center border border-dashed border-zinc-850 rounded-xl bg-zinc-950/30">
            <p className="text-xs text-zinc-400 font-medium italic">
              {isSelf 
                ? "Henüz profil fotoğrafı yüklemediniz. Aşağıdaki + butonundan hemen 5 adet profil resmini ekle, çatlasınlar! 📸" 
                : "Bu yazar henüz profil fotoğrafı eklememiş."}
            </p>
          </div>
        )}

        {/* 5'li Profil Resimleri Şeridi Grid */}
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 5 }).map((_, idx) => {
            const photoUrl = displayProfilePhotos[idx];
            if (photoUrl) {
              const isSelected = selectedPhotoIndex === idx;
              return (
                <button
                  key={`prof-photo-${idx}`}
                  type="button"
                  onClick={() => {
                    setSelectedPhotoIndex(idx);
                    playBuzzSound();
                  }}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all relative group cursor-pointer ${
                    isSelected 
                      ? "border-lime-500 ring-2 ring-lime-500/30 scale-[1.02]" 
                      : "border-zinc-850 hover:border-zinc-700 opacity-80 hover:opacity-100"
                  }`}
                >
                  <img
                    src={photoUrl}
                    alt={`Profil Resmi ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {isSelected && (
                    <div className="absolute top-1 right-1 bg-lime-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full shadow">
                      ✓
                    </div>
                  )}
                </button>
              );
            }

            if (isSelf) {
              return (
                <label
                  key={`upload-slot-${idx}`}
                  className="aspect-square rounded-lg border-2 border-dashed border-lime-500/40 bg-lime-500/5 hover:bg-lime-500/10 hover:border-lime-400 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all p-1 text-center group"
                  title="Profil resmi ekle"
                >
                  <span className="text-lime-400 font-black text-base group-hover:scale-125 transition-transform">+</span>
                  <span className="text-[9px] font-bold text-lime-400/90 leading-tight">Foto Ekle</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={isPending}
                    style={{ display: "none" }}
                  />
                </label>
              );
            }

            return (
              <div
                key={`empty-slot-${idx}`}
                className="aspect-square rounded-lg border border-zinc-900 bg-zinc-950/40 opacity-30 flex items-center justify-center"
              >
                <span className="text-zinc-700 text-xs">📷</span>
              </div>
            );
          })}
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
            PozKes ({photoEntries.length})
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
                    <article key={entry.id} className="p-4 rounded-xl border border-slate-850 bg-slate-950/20 space-y-2 min-w-0 overflow-hidden">
                      <div className="flex justify-between items-baseline gap-2 min-w-0">
                        <Link 
                          href={`/baslik/${entry.topic.slug}#entry-${entry.id}`} 
                          prefetch={false}
                          className="text-sm font-bold text-white hover:text-teal-400 break-words min-w-0"
                        >
                          {entry.topic.title}
                        </Link>
                        <span className="text-[10px] text-slate-500">
                          {formatDate(entry.createdAt)}
                        </span>
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
                  {comments.slice(0, commentsLimit).map((comment) => {
                    const isPozKes = comment.entry.topic.slug === "pozkes-galeri";
                    const targetUrl = isPozKes
                      ? `/pozkes#entry-${comment.entry.id}`
                      : `/baslik/${comment.entry.topic.slug}#entry-${comment.entry.id}`;

                    return (
                      <article key={comment.id} className="p-4 rounded-xl border border-slate-850 bg-slate-950/20 space-y-2 min-w-0 overflow-hidden">
                        <div className="flex justify-between items-baseline gap-2 min-w-0">
                          <div className="text-[11px] text-slate-400 break-words min-w-0">
                            <Link 
                              href={targetUrl} 
                              prefetch={false}
                              className="font-semibold text-slate-300 hover:text-teal-400 break-words min-w-0"
                            >
                              {isPozKes ? "PozKes Fotoğrafı" : comment.entry.topic.title}
                            </Link>{" "}
                            {isPozKes ? "için yorum yaptı" : "konusundaki gönderiye yorum yaptı"}
                          </div>
                          <span className="text-[10px] text-slate-500">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <div className="text-xs text-slate-200">
                          <MentionText content={comment.content} />
                        </div>
                      </article>
                    );
                  })}
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
                <div className="text-center py-6 text-xs text-slate-500 italic">Henüz PozKes veya konulu fotoğraf paylaşılmamış.</div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {photoEntries.slice(0, photosLimit).map((photo) => {
                      const isPozKes = photo.topic.slug === "pozkes-galeri";
                      const targetUrl = isPozKes
                        ? `/pozkes#entry-${photo.id}`
                        : `/baslik/${photo.topic.slug}#entry-${photo.id}`;

                      return (
                        <Link
                          key={photo.id}
                          href={targetUrl}
                          prefetch={false}
                          onClick={() => playBuzzSound()}
                          className="group relative aspect-square rounded-xl overflow-hidden border border-slate-850 bg-slate-900/30 block cursor-pointer transition-all hover:border-lime-500/50"
                        >
                          <img
                            src={photo.imageUrl!}
                            alt={photo.topic.title}
                            width={150}
                            height={150}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-2.5 transition-all">
                            <div className="text-[10px] font-bold text-zinc-200 line-clamp-1 mb-0.5" title={photo.topic.title}>
                              {photo.topic.title}
                            </div>
                            <div className="text-[10px] font-black text-lime-400 flex items-center gap-1 justify-between">
                              <span>{isPozKes ? "PozKes'te Gör ↗" : "Konuda Gör ↗"}</span>
                              <ArrowRight className="h-3 w-3" />
                            </div>
                          </div>
                        </Link>
                      );
                    })}
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
                            {(f.displayName ?? f.username).substring(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold text-slate-200 block truncate">{f.displayName ?? f.username}</span>
                          <span className="text-[10px] text-zinc-550 block truncate">@{f.username}</span>
                          {f.role === "ADMIN" && <span className="text-[9px] text-teal-400 font-bold block mt-0.5">Admin</span>}
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
                            {(f.displayName ?? f.username).substring(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold text-slate-200 block truncate">{f.displayName ?? f.username}</span>
                          <span className="text-[10px] text-zinc-550 block truncate">@{f.username}</span>
                          {f.role === "ADMIN" && <span className="text-[9px] text-teal-400 font-bold block mt-0.5">Admin</span>}
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
      
      {/* Photo Showcase Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-md flex flex-col rounded-2xl border border-zinc-850 bg-zinc-950 p-5 md:p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-300">
            
            {/* Close Button */}
            <button
              onClick={() => { playBuzzSound(); setIsUploadModalOpen(false); }}
              className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-500 hover:text-white hover:bg-zinc-900 transition-all active:scale-95 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Modal Title */}
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-3 mb-4 shrink-0">
              <span className="text-xl select-none">📸</span>
              <h2 className="text-sm md:text-base font-black text-white uppercase tracking-wider">
                Kadraja <span className="text-lime-400">Fotoğraf Ekle</span>
              </h2>
            </div>

            {/* Image Preview */}
            {uploadPhotoBase64 && (
              <div className="relative w-full max-h-56 bg-zinc-900/40 rounded-xl overflow-hidden mb-4 border border-zinc-900 flex items-center justify-center">
                <img
                  src={uploadPhotoBase64}
                  alt="Kadraj Önizleme"
                  className="max-h-56 w-auto object-contain"
                />
              </div>
            )}

            {/* Description Textarea */}
            <div className="flex flex-col gap-1.5 mb-4">
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                Fotoğraf Açıklaması (en az 5 karakter)
              </label>
              <textarea
                value={uploadPhotoDesc}
                onChange={(e) => {
                  setUploadPhotoDesc(e.target.value);
                  if (uploadError) setUploadError("");
                }}
                placeholder="Fotoğrafını anlat, çatlasınlar zzz..."
                disabled={isUploading}
                className="w-full bg-zinc-900/50 border border-zinc-850 rounded-xl p-3 text-xs md:text-sm text-zinc-150 focus:outline-none focus:border-lime-500/50 min-h-[90px] resize-none leading-relaxed transition-all placeholder:text-zinc-600"
              />
            </div>

            {/* Error Message */}
            {uploadError && (
              <div className="mb-4 flex items-center gap-1.5 p-2.5 rounded-xl bg-red-950/20 border border-red-900/30 text-red-400 text-xs">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-900">
              <button
                type="button"
                onClick={() => { playBuzzSound(); setIsUploadModalOpen(false); }}
                disabled={isUploading}
                className="px-4 py-2 border border-zinc-850 hover:border-zinc-800 text-zinc-400 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95"
              >
                vazgeç
              </button>
              <button
                type="button"
                onClick={handleConfirmUpload}
                disabled={isUploading}
                className="px-5 py-2 bg-lime-500 hover:bg-lime-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-black text-xs font-extrabold rounded-xl transition-all cursor-pointer active:scale-95 shadow-md shadow-lime-500/10 flex items-center gap-1.5"
              >
                {isUploading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                    <span>yükleniyor...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3 w-3" />
                    <span>kadraja fırlat 🚀</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 p-2.5 bg-zinc-900/80 hover:bg-rose-600 text-white rounded-full transition-colors cursor-pointer z-10"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightboxUrl}
            alt="Profil Resmi Tam Ekran"
            className="max-w-full max-h-[90vh] object-contain rounded-2xl border border-zinc-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
