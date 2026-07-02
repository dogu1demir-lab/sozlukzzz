"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { createPozKesEntryAction } from "@/app/actions";
import { playBuzzSound } from "@/lib/utils";
import { Camera, Image as ImageIcon, Send, AlertCircle, Sparkles, X } from "lucide-react";

interface PozKesUploadFormProps {
  isLoggedIn: boolean;
}

export default function PozKesUploadForm({ isLoggedIn }: PozKesUploadFormProps) {
  const [title, setTitle] = useState("pozkes galeri");
  const [content, setContent] = useState("");
  const [base64Image, setBase64Image] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isSubmittingOrPending = isPending || submitting;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const submittingRef = useRef(false);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Lütfen geçerli bir görsel dosyası seçin.");
      return;
    }

    // Validate file size (limit to 1MB for base64 storage)
    if (file.size > 1.5 * 1024 * 1024) {
      setError("Görsel boyutu 1.5MB'dan küçük olmalıdır zzz.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setBase64Image(reader.result as string);
      playBuzzSound();
    };
    reader.onerror = () => {
      setError("Dosya okunurken bir hata oluştu.");
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setBase64Image("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    playBuzzSound();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingOrPending || submittingRef.current) return;
    setError("");

    if (!isLoggedIn) {
      setError("Görsel paylaşmak için giriş yapmalısınız.");
      return;
    }

    if (!content.trim()) {
      setError("Lütfen bir açıklama yazın.");
      return;
    }

    if (!base64Image) {
      setError("Lütfen bir görsel seçin.");
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const result = await createPozKesEntryAction(title, content, base64Image);
      if (result.error) {
        setError(result.error);
        setSubmitting(false);
        submittingRef.current = false;
      } else {
        // Clear form
        setContent("");
        setBase64Image("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        playBuzzSound();
        
        startTransition(() => {
          router.push(result.slug ? `/baslik/${result.slug}` : "/?tab=pozkes");
        });

        // Safe status reset outside the transition tick
        setSubmitting(false);
        submittingRef.current = false;
      }
    } catch (err) {
      setError("PozKes yüklenirken teknik bir hata oluştu.");
      setSubmitting(false);
      submittingRef.current = false;
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-850 p-8 text-center bg-zinc-900/10">
        <p className="text-sm text-zinc-400">
          PozKes'te fotoğraf paylaşmak için lütfen giriş yapın.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-zinc-900 bg-zinc-950/20 p-4 md:p-6 shadow-xl">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4.5 w-4.5 text-lime-400" />
        <h3 className="text-sm font-bold text-white">PozKes'te Fotoğraf Paylaş</h3>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Topic Title Input */}
      <div className="space-y-1.5">
        <label htmlFor="pozkes-title" className="text-xs font-bold text-zinc-400 block">
          Konu / Başlık
        </label>
        <input
          id="pozkes-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="örn: pozkes galeri"
          className="w-full h-10 rounded-lg bg-zinc-900 border border-zinc-800 px-3.5 text-xs text-zinc-200 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-all animate-none"
        />
        <p className="text-[10px] text-zinc-550">Görselin ekleneceği başlık. Boş bırakırsanız varsayılan olarak #pozkes galeri başlığına eklenir.</p>
      </div>

      {/* Image Upload Area */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-zinc-400 block">Fotoğraf Seç</label>
        
        {base64Image ? (
          <div className="relative rounded-xl border border-zinc-800 overflow-hidden bg-zinc-900/40 max-w-sm">
            <img src={base64Image} alt="PozKes Yükleme Önizleme" className="w-full max-h-60 object-cover" />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/60 text-zinc-400 hover:text-white transition-colors border border-white/5 shadow-md"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="group cursor-pointer rounded-xl border border-dashed border-zinc-800 bg-zinc-900/10 hover:bg-zinc-900/20 hover:border-lime-500/30 p-8 text-center transition-all"
          >
            <ImageIcon className="h-6 w-6 text-zinc-650 group-hover:text-lime-400 mx-auto mb-2 transition-colors" />
            <span className="text-xs text-zinc-400 group-hover:text-zinc-300 font-medium block">Cihazından bir fotoğraf seç</span>
            <span className="text-[10px] text-zinc-600 block mt-1">PNG, JPG, WEBP (Maks. 1.5MB)</span>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Caption Content Input */}
      <div className="space-y-1.5">
        <label htmlFor="pozkes-content" className="text-xs font-bold text-zinc-400 block">
          Açıklama
        </label>
        <textarea
          id="pozkes-content"
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Bu fotoğraf hakkında ne söylemek istersin zzz..."
          className="w-full rounded-lg bg-zinc-900 border border-zinc-800 p-3 text-xs text-zinc-200 placeholder-zinc-550 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-all resize-y"
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-1.5 px-6 py-2 rounded-full bg-lime-500 text-black font-bold text-xs hover:bg-lime-400 transition-colors shadow-lg shadow-lime-500/10 disabled:opacity-50"
        >
          <Send className="h-3 w-3" />
          <span>{isPending ? "Paylaşılıyor..." : "PozKes'te Paylaş"}</span>
        </button>
      </div>
    </form>
  );
}
