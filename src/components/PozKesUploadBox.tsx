"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPozKesEntryAction } from "@/app/actions";
import { playBuzzSound } from "@/lib/utils";
import { Camera, Image as ImageIcon, X, Send, Sparkles } from "lucide-react";
import Link from "next/link";

interface PozKesUploadBoxProps {
  isLoggedIn: boolean;
}

export default function PozKesUploadBox({ isLoggedIn }: PozKesUploadBoxProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [topicTitle, setTopicTitle] = useState("");
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isLoggedIn) {
    return (
      <div className="mb-6 p-4 rounded-2xl border border-zinc-850 bg-zinc-950/40 text-center space-y-2">
        <p className="text-xs text-zinc-400">
          PozKes'te anlık fotoğraf paylaşmak ve vızıldamak için giriş yapmalısın.
        </p>
        <div className="flex justify-center gap-2 pt-1">
          <Link href="/giris" prefetch={false} className="px-4 py-1.5 bg-teal-500 hover:bg-teal-400 text-white font-bold text-xs rounded-full transition-colors">
            Giriş Yap
          </Link>
          <Link href="/kaydol" prefetch={false} className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-full transition-colors">
            Kaydol
          </Link>
        </div>
      </div>
    );
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Lütfen geçerli bir resim dosyası seçin.");
      return;
    }

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1920;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.85);
          setBase64Image(compressedBase64);
          setImagePreview(compressedBase64);
        } else {
          const rawResult = event.target?.result as string;
          setBase64Image(rawResult);
          setImagePreview(rawResult);
        }
      };
      img.onerror = () => {
        setErrorMsg("Görsel işlenirken bir hata oluştu.");
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setBase64Image(null);
    setImagePreview(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!base64Image) {
      setErrorMsg("Lütfen paylaşmak için bir fotoğraf seçin zzz.");
      return;
    }
    if (!content.trim()) {
      setErrorMsg("Lütfen fotoğraf için bir açıklama yazın.");
      return;
    }

    playBuzzSound();
    setErrorMsg(null);

    startTransition(async () => {
      const result = await createPozKesEntryAction(
        topicTitle.trim() || "pozkes galeri",
        content,
        base64Image
      );

      if (result.error) {
        setErrorMsg(result.error);
      } else {
        setContent("");
        setTopicTitle("");
        setBase64Image(null);
        setImagePreview(null);
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 p-4 sm:p-5 rounded-2xl border border-teal-500/20 bg-gradient-to-b from-zinc-950 to-teal-950/20 shadow-xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-teal-400 font-bold text-xs sm:text-sm">
          <Camera className="w-4 h-4" />
          <span>Anlık Fotoğraf Paylaş (PozKes)</span>
        </div>
        <span className="text-[10px] text-zinc-500 font-medium">📸 Fotoğrafın anında yayında</span>
      </div>

      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Image Preview Box */}
      {imagePreview ? (
        <div className="relative aspect-video max-h-56 w-full rounded-xl overflow-hidden border border-teal-500/30 bg-black/60 group">
          <img src={imagePreview} alt="Önizleme" className="w-full h-full object-contain" />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-red-600 text-white rounded-full transition-colors cursor-pointer"
            title="Görseli Kaldır"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-800 hover:border-teal-500/50 rounded-xl bg-zinc-900/30 hover:bg-teal-500/5 transition-all cursor-pointer group">
          <ImageIcon className="w-8 h-8 text-zinc-500 group-hover:text-teal-400 mb-1.5 transition-colors" />
          <span className="text-xs font-bold text-zinc-300 group-hover:text-white">Fotoğraf Seç veya Sürükle</span>
          <span className="text-[10px] text-zinc-500 mt-0.5">PNG, JPG, WEBP (Max 8MB)</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </label>
      )}

      {/* Textarea for Caption */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Fotoğrafın hakkında bir şeyler yaz... (vızzz!)"
        rows={2}
        className="w-full p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-teal-500/50 transition-all resize-none"
      />

      {/* Bottom Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <input
          type="text"
          value={topicTitle}
          onChange={(e) => setTopicTitle(e.target.value)}
          placeholder="İsteğe bağlı başlık (boş bırakırsan 'pozkes galeri' olur)"
          className="flex-1 min-w-[200px] px-3 py-1.5 rounded-lg bg-zinc-900/40 border border-zinc-850 text-[11px] text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-teal-500/30"
        />

        <button
          type="submit"
          disabled={isPending || !base64Image || !content.trim()}
          className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95 shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{isPending ? "Paylaşılıyor..." : "PozKes'te Paylaş 📸"}</span>
        </button>
      </div>
    </form>
  );
}
