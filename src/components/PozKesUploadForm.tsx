"use client";

import { useState, useTransition, useEffect, useRef } from "react";
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
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "redirecting">("idle");
  const [isPending, startTransition] = useTransition();
  const isSubmittingOrPending = isPending || submitStatus !== "idle";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const submittingRef = useRef(false);
  const router = useRouter();

  const [redirectUrl, setRedirectUrl] = useState("");
  const [showEscape, setShowEscape] = useState(false);

  useEffect(() => {
    if (submitStatus === "redirecting") {
      const timer = setTimeout(() => {
        setShowEscape(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShowEscape(false);
    }
  }, [submitStatus]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Lütfen geçerli bir görsel dosyası seçin.");
      return;
    }

    // Validate file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Görsel boyutu en fazla 10MB olabilir.");
      return;
    }

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
          playBuzzSound();
        } else {
          const rawResult = event.target?.result as string;
          setBase64Image(rawResult);
          playBuzzSound();
        }
      };
      img.onerror = () => {
        setError("Görsel işlenirken bir hata oluştu.");
      };
      img.src = event.target?.result as string;
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
    setSubmitStatus("submitting");
    try {
      const result = await createPozKesEntryAction(title, content, base64Image);
      if (result.error) {
        setError(result.error);
        setSubmitStatus("idle");
        submittingRef.current = false;
      } else {
        // Clear form
        setContent("");
        setBase64Image("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        playBuzzSound();
        
        const targetUrl = result.slug ? `/baslik/${result.slug}` : "/?tab=pozkes";
        setRedirectUrl(targetUrl);
        setSubmitStatus("redirecting");
        
        setTimeout(() => {
          window.location.href = targetUrl;
        }, 1600);
      }
    } catch (err) {
      setError("PozKes yüklenirken teknik bir hata oluştu.");
      setSubmitStatus("idle");
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
          disabled={isSubmittingOrPending}
          className="flex items-center gap-1.5 px-6 py-2 rounded-full bg-lime-500 text-black font-bold text-xs hover:bg-lime-400 transition-colors shadow-lg shadow-lime-500/10 disabled:opacity-50"
        >
          <Send className="h-3 w-3" />
          <span>{isSubmittingOrPending ? "fotoğraf vızıldanıyor..." : "PozKes'te Paylaş"}</span>
        </button>
      </div>

      {/* Uçuş Portalı Overlay */}
      {submitStatus === "redirecting" && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="flex flex-col items-center gap-4 text-center p-6 animate-in zoom-in-95 duration-300">
            <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-lime-500/10 border border-lime-500/20 shadow-[0_0_40px_rgba(132,204,22,0.2)] animate-pulse">
              <span className="text-4xl animate-bounce duration-700">📸</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-wide font-sans">
              poz vızıldatıldı! uçuluyor... 🚀
            </h2>
            <p className="text-xs text-zinc-500 font-medium">
              galeriye yönlendiriliyorsunuz, lütfen bekleyin
            </p>

            {/* Escape Hatch */}
            {showEscape && (
              <div className="mt-4 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <p className="text-[11px] text-zinc-500">
                  bağlantı yavaş mı kaldı?
                </p>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      if (redirectUrl) {
                        window.location.href = redirectUrl;
                      } else {
                        window.location.reload();
                      }
                    }}
                    className="text-lime-400 hover:text-lime-300 transition-colors underline cursor-pointer"
                  >
                    zorla yenile
                  </button>
                  <span className="text-zinc-650">|</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitStatus("idle");
                      submittingRef.current = false;
                    }}
                    className="text-red-400 hover:text-red-300 transition-colors underline cursor-pointer"
                  >
                    iptal et
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </form>
  );
}
