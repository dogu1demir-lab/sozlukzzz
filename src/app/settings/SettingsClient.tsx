"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { 
  updateProfileAvatarAction, 
  updateProfileInfoAction, 
  deleteAccountAction 
} from "@/app/actions";
import { playBuzzSound } from "@/lib/utils";
import { CheckCircle2, AlertCircle, Trash2, Camera, ShieldAlert } from "lucide-react";

interface SettingsClientProps {
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarColor: string;
    avatarUrl: string | null;
    bio: string | null;
    role: string;
  };
  disableSelfDeletion?: boolean;
}

export default function SettingsClient({ user, disableSelfDeletion = false }: SettingsClientProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [bio, setBio] = useState(user.bio || "");
  const [avatarColor, setAvatarColor] = useState(user.avatarColor);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [isPending, startTransition] = useTransition();

  // Status & Modal states
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setStatusMessage({ type: "error", text: "Profil fotoğrafı boyutu 10MB'dan küçük olmalıdır." });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setAvatarUrl(base64);

      startTransition(async () => {
        const result = await updateProfileAvatarAction(base64);
        if (result.error) {
          setStatusMessage({ type: "error", text: result.error });
          setAvatarUrl(user.avatarUrl); // Rollback
        } else {
          playBuzzSound();
          setStatusMessage({ type: "success", text: "Profil fotoğrafınız başarıyla güncellendi ve vitrine entegre edildi! 📸" });
          router.refresh();
        }
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    startTransition(async () => {
      const result = await updateProfileInfoAction(displayName, bio, avatarColor);
      if (result.error) {
        setStatusMessage({ type: "error", text: result.error });
      } else {
        playBuzzSound();
        setStatusMessage({ type: "success", text: "Profil bilgileriniz başarıyla kaydedildi! ✨" });
        router.refresh();
      }
    });
  };

  const confirmDeleteAccount = () => {
    setShowDeleteModal(false);
    startTransition(async () => {
      const result = await deleteAccountAction();
      if (result.error) {
        setStatusMessage({ type: "error", text: result.error });
      } else {
        playBuzzSound();
        router.push("/bugun");
        window.location.reload();
      }
    });
  };

  return (
    <div className="settings-page max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-white">Profil Ayarları</h1>
          <p className="text-xs text-zinc-400 mt-1">Kişisel bilgilerinizi ve profil fotoğrafınızı özelleştirin.</p>
        </div>
      </div>

      {/* Global Status Message Toast */}
      {statusMessage && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in fade-in duration-200 ${
          statusMessage.type === "success" 
            ? "bg-lime-500/10 border-lime-500/30 text-lime-400" 
            : "bg-rose-500/10 border-rose-500/30 text-rose-400"
        }`}>
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span className="text-xs font-bold flex-1">{statusMessage.text}</span>
          <button 
            type="button" 
            onClick={() => setStatusMessage(null)}
            className="text-xs opacity-70 hover:opacity-100 font-black px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Profile Photo Card */}
      <section className="settings-section bg-zinc-950/60 border border-zinc-900 rounded-2xl p-5 md:p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5">
          <Camera className="w-4 h-4 text-lime-400 shrink-0" />
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider leading-none">Ana Profil Resmi & Vitrin</h2>
        </div>

        <div className="avatar-upload-row flex items-center gap-5">
          <div className="relative group">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user.username}
                className="w-20 h-20 rounded-full object-cover border-2 border-lime-500/40 shadow-lg ring-4 ring-lime-500/10 shrink-0"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center font-extrabold text-black border-2 border-slate-700 text-3xl shadow-inner select-none shrink-0"
                style={{ backgroundColor: avatarColor }}
              >
                {user.username.substring(0, 1).toUpperCase()}
              </div>
            )}
          </div>

          <div className="avatar-upload-controls flex flex-col gap-2">
            <input
              type="file"
              id="avatar-file"
              accept="image/*"
              onChange={handleAvatarChange}
              disabled={isPending}
              className="hidden"
            />
            <label
              htmlFor="avatar-file"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-lime-500 hover:bg-lime-400 text-black text-xs font-black cursor-pointer transition-all active:scale-95 shadow-md shadow-lime-500/10 w-fit"
            >
              <Camera className="w-3.5 h-3.5" />
              {isPending ? "Yükleniyor..." : "Yeni Profil Resmi Yükle"}
            </label>
            <p className="text-[11px] text-zinc-400">
              Yüklenen görsel otomatik olarak WebP'ye dönüştürülür (Maks 10 MB).
            </p>
            <div className="p-2.5 rounded-xl border border-lime-500/20 bg-lime-500/5 text-[11px] text-lime-300 font-medium">
              Yüklediğiniz bu resim, profildeki <strong>5 Fotoğraf Vitrini'nin #1 numaralı ana resmine</strong> otomatik entegre edilir.
            </div>
          </div>
        </div>
      </section>

      {/* Profile Information Form */}
      <section className="settings-section bg-zinc-950/60 border border-zinc-900 rounded-2xl p-5 md:p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">Profil Bilgileri</h2>
        <form onSubmit={handleSaveInfo} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-1">Kullanıcı Adı</label>
            <input
              type="text"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/50 border border-zinc-850 text-zinc-500 text-xs font-bold opacity-60 cursor-not-allowed"
              readOnly
              value={`@${user.username}`}
            />
            <p className="text-[10px] text-zinc-550 mt-1">Kullanıcı adı benzersizdir ve değiştirilemez.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1" htmlFor="settings-display-name">
              Görünen İsim (Takma Adınız)
            </label>
            <input
              id="settings-display-name"
              type="text"
              required
              maxLength={20}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs font-bold focus:border-lime-500 focus:outline-none transition-colors"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Sitede görünecek isminiz"
            />
            <p className="text-[10px] text-zinc-400 mt-1">Türkçe karakter ve boşluk bırakabilirsiniz (örn: Tuğçe Çiçek).</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1" htmlFor="settings-bio">
              Hakkımda (Biyografi)
            </label>
            <div className="relative">
              <textarea
                id="settings-bio"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs font-medium focus:border-lime-500 focus:outline-none transition-colors pr-14 pb-8"
                maxLength={160}
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Kendinizden kısaca bahsedin..."
              />
              <span className={`absolute right-3 bottom-3 text-[9px] font-black select-none px-1.5 py-0.5 rounded border transition-colors ${
                bio.length >= 160 
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/20" 
                  : bio.length >= 140
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  : "bg-zinc-900 text-zinc-500 border-zinc-800"
              }`}>
                {bio.length}/160
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1" htmlFor="settings-color">
              Varsayılan Avatar Rengi
            </label>
            <div className="flex items-center gap-3">
              <input
                id="settings-color"
                type="color"
                className="w-9 h-9 rounded-lg border-0 bg-transparent cursor-pointer"
                value={avatarColor}
                onChange={(e) => setAvatarColor(e.target.value)}
              />
              <span className="w-7 h-7 rounded-full border border-white/20 shadow" style={{ backgroundColor: avatarColor }} />
              <span className="text-xs font-mono text-zinc-400 uppercase">{avatarColor}</span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2.5 rounded-xl bg-lime-500 hover:bg-lime-400 text-black text-xs font-black transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-md shadow-lime-500/10"
            >
              {isPending ? "Kaydediliyor..." : "Değişiklikleri Kaydet ✨"}
            </button>
          </div>
        </form>
      </section>

      {/* Dangerous Zone Card */}
      <section className="settings-section bg-zinc-950/60 border border-rose-500/20 rounded-2xl p-5 md:p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-500" />
          <h2 className="text-sm font-extrabold text-rose-400 uppercase tracking-wider">Tehlikeli Bölge</h2>
        </div>
        
        {disableSelfDeletion ? (
          <p className="text-xs text-rose-400 font-bold bg-rose-500/10 p-3.5 rounded-xl border border-rose-500/20">
            Hesap silme işlemi yönetici tarafından geçici olarak devre dışı bırakılmıştır.
          </p>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-xs text-zinc-400">
              Hesabınızı sildiğinizde tüm verileriniz kalıcı olarak kaldırılır. Bu işlem geri alınamaz.
            </p>
            <button
              onClick={() => { playBuzzSound(); setShowDeleteModal(true); }}
              disabled={isPending}
              type="button"
              className="px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-black hover:bg-rose-600 hover:text-white transition-all cursor-pointer shrink-0 active:scale-95"
            >
              Hesabımı Sil 🗑️
            </button>
          </div>
        )}
      </section>

      {/* Modern Custom Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 text-lg shrink-0">
                <Trash2 className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">Hesabınızı Silmek İstediğinize Emin Mısınız?</h3>
                <p className="text-xs text-rose-400/90 font-medium mt-0.5">Tüm girdileriniz, beğenileriniz ve mesajlarınız KALICI olarak silinecektir.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-xs text-zinc-300 leading-relaxed">
              ⚠️ Bu işlem geri alınamaz. @{user.username} kullanıcısı sözlükten tamamen silinecektir.
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
                onClick={confirmDeleteAccount}
                disabled={isPending}
                className="px-4.5 py-2 text-xs font-black text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all active:scale-95 shadow-lg shadow-rose-600/20 flex items-center gap-1.5 cursor-pointer"
              >
                {isPending ? "Siliniyor..." : "Evet, Hesabımı Kalıcı Olarak Sil 🗑️"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
