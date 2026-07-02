"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { 
  updateProfileAvatarAction, 
  updateProfileInfoAction, 
  deleteAccountAction 
} from "@/app/actions";
import { playBuzzSound } from "@/lib/utils";

interface SettingsClientProps {
  user: {
    id: string;
    username: string;
    avatarColor: string;
    avatarUrl: string | null;
    bio: string | null;
    role: string;
  };
  disableSelfDeletion?: boolean;
}

export default function SettingsClient({ user, disableSelfDeletion = false }: SettingsClientProps) {
  const router = useRouter();
  const [bio, setBio] = useState(user.bio || "");
  const [avatarColor, setAvatarColor] = useState(user.avatarColor);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [isPending, startTransition] = useTransition();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Profil fotoğrafı boyutu 2MB'dan küçük olmalıdır.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setAvatarUrl(base64);

      startTransition(async () => {
        const result = await updateProfileAvatarAction(base64);
        if (result.error) {
          alert(result.error);
          setAvatarUrl(user.avatarUrl); // Rollback
        } else {
          router.refresh();
        }
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const result = await updateProfileInfoAction(bio, avatarColor);
      if (result.error) {
        alert(result.error);
      } else {
        alert("Profil bilgileriniz başarıyla güncellendi zzz.");
        router.refresh();
      }
    });
  };

  const handleDeleteAccount = () => {
    if (!confirm("Hesabınızı silmek istediğinize emin misiniz? Tüm girdileriniz, beğenileriniz ve mesajlarınız KALICI olarak silinecektir. Bu işlem geri alınamaz!")) {
      return;
    }

    startTransition(async () => {
      const result = await deleteAccountAction();
      if (result.error) {
        alert(result.error);
      } else {
        alert("Hesabınız başarıyla silinmiştir zzz.");
        router.push("/bugun");
        window.location.reload();
      }
    });
  };

  return (
    <div className="settings-page animate-in fade-in duration-300">
      <h1 className="settings-title">Profil Ayarları</h1>

      {/* Profile Photo Card */}
      <section className="settings-section">
        <h2>Profil Fotoğrafı</h2>
        <div className="avatar-upload-row">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={user.username}
              className="w-16 h-16 rounded-full object-cover border-2 border-slate-700 shadow-md shrink-0"
            />
          ) : (
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-black border-2 border-slate-700 text-2xl shadow-inner select-none shrink-0"
              style={{ backgroundColor: avatarColor }}
            >
              {user.username.substring(0, 1).toUpperCase()}
            </div>
          )}

          <div className="avatar-upload-controls">
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
              className="px-4 py-1.5 rounded-lg border border-slate-700 hover:border-teal-500 text-xs font-bold text-slate-350 hover:text-white cursor-pointer transition-all bg-slate-900/40 text-center"
            >
              {isPending ? "Yükleniyor..." : "Fotoğraf Seç"}
            </label>
            <p className="avatar-hint">JPG, PNG veya GIF · Maks 2 MB</p>
            <p className="text-[10px] text-teal-400 font-semibold mt-1">
              ✓ Seçildiği anda otomatik olarak kaydedilir.
            </p>
          </div>
        </div>
      </section>

      {/* Profile Information Form */}
      <section className="settings-section">
        <h2>Profil Bilgileri</h2>
        <form onSubmit={handleSaveInfo} className="settings-form">
          <label className="form-label">Kullanıcı Adı</label>
          <input
            type="text"
            className="form-input opacity-60 cursor-not-allowed bg-slate-950/40 border-slate-800"
            readOnly
            value={`@${user.username}`}
          />
          <p className="text-[10px] text-slate-500 -mt-2">Kullanıcı adı değiştirilemez.</p>

          <label className="form-label" htmlFor="settings-bio">
            Hakkımda
          </label>
          <div className="relative">
            <textarea
              id="settings-bio"
              className="form-input pr-12 pb-8"
              maxLength={160}
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Kendinizden kısaca bahsedin zzz..."
            />
            <span className={`absolute right-3 bottom-3 text-[9px] font-black select-none px-1.5 py-0.5 rounded border transition-colors ${
              bio.length >= 160 
                ? "bg-red-500/10 text-red-400 border-red-500/20" 
                : bio.length >= 140
                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                : "bg-slate-900 text-slate-500 border-slate-800"
            }`}>
              {bio.length}/160
            </span>
          </div>

          <label className="form-label" htmlFor="settings-color">
            Avatar Rengi
          </label>
          <div className="color-row">
            <input
              id="settings-color"
              type="color"
              value={avatarColor}
              onChange={(e) => setAvatarColor(e.target.value)}
            />
            <span className="color-preview" style={{ backgroundColor: avatarColor }} />
          </div>

          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2 rounded-lg bg-teal-500 text-white text-xs font-bold hover:bg-teal-400 transition-colors disabled:opacity-50"
            >
              {isPending ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </form>
      </section>

      {/* Appearance Card */}
      <section className="settings-section">
        <h2>Görünüm</h2>
        <div className="dark-mode-section">
          <div className="dark-mode-row">
            <div className="dark-mode-label">
              <strong>Karanlık Mod</strong>
              <span>Göz dostu koyu tema</span>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked readOnly />
              <span className="toggle-track"></span>
            </label>
          </div>
        </div>
      </section>

      {/* Dangerous Zone Card */}
      <section className="settings-section settings-danger-zone">
        <h2>Tehlikeli Bölge</h2>
        {disableSelfDeletion ? (
          <p className="text-xs text-red-400 font-bold bg-red-500/5 p-3 rounded-lg border border-red-500/20">
            Hesap silme işlemi yönetici tarafından geçici olarak devre dışı bırakılmıştır zzz.
          </p>
        ) : (
          <>
            <p className="text-xs text-slate-400 mb-4">
              Hesabınızı sildiğinizde tüm verileriniz kalıcı olarak kaldırılır. Bu işlem geri alınamaz.
            </p>
            <button
              onClick={handleDeleteAccount}
              disabled={isPending}
              type="button"
              className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500 hover:text-white transition-all cursor-pointer"
            >
              Hesabı Sil
            </button>
          </>
        )}
      </section>
    </div>
  );
}
