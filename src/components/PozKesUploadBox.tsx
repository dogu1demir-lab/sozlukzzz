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

  const [showTitleInput, setShowTitleInput] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Lütfen geçerli bir resim dosyası seçin.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("Resim boyutu en fazla 10MB olabilir.");
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
      setErrorMsg("Lütfen paylaşmak için bir fotoğraf seçin.");
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
        setShowTitleInput(false);
        setBase64Image(null);
        setImagePreview(null);
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 p-3.5 sm:p-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 shadow-2xl backdrop-blur-md transition-all focus-within:border-teal-500/40 space-y-3">
      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Optional Title Input */}
      {(showTitleInput || topicTitle) && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-teal-400">📌</span>
          <input
            type="text"
            value={topicTitle}
            onChange={(e) => setTopicTitle(e.target.value)}
            placeholder="Özel Fotoğraf Başlığı (İsteğe Bağlı)..."
            className="flex-1 px-3 py-1.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs font-bold text-teal-300 placeholder:text-teal-500/50 focus:outline-none focus:border-teal-500/50 transition-colors"
          />
          <button
            type="button"
            onClick={() => { setTopicTitle(""); setShowTitleInput(false); }}
            className="p-1 text-zinc-500 hover:text-zinc-300 text-xs"
            title="Başlığı Kaldır"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Composer Input Area */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0 space-y-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Fotoğrafın hakkında bir şeyler yaz..."
            rows={2}
            className="w-full bg-transparent text-xs sm:text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none resize-none leading-relaxed"
          />

          {/* Compact Image Preview */}
          {imagePreview && (
            <div className="relative max-h-48 w-fit rounded-xl overflow-hidden border border-teal-500/30 bg-black/60 group">
              <img src={imagePreview} alt="Önizleme" className="max-h-48 object-contain rounded-xl" />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-1.5 right-1.5 p-1 bg-black/80 hover:bg-red-600 text-white rounded-full transition-colors cursor-pointer"
                title="Görseli Kaldır"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Bar: Action Icons & Tweet-style Publish Button */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
        <div className="flex items-center gap-1.5">
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-teal-400 hover:text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 transition-all cursor-pointer select-none">
            <ImageIcon className="w-4 h-4" />
            <span>Fotoğraf Ekle</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>

          {!showTitleInput && !topicTitle && (
            <button
              type="button"
              onClick={() => setShowTitleInput(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-zinc-400 hover:text-teal-400 hover:bg-zinc-900 transition-all cursor-pointer select-none"
              title="Özel Başlık Ekle"
            >
              <span>📌 Başlık Ekle</span>
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending || !base64Image}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-teal-500 hover:bg-teal-400 text-black font-extrabold text-xs rounded-full shadow-md shadow-teal-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95 shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{isPending ? "Paylaşılıyor..." : "PozKes Paylaş 📸"}</span>
        </button>
      </div>
    </form>
  );
}
