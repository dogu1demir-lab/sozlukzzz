"use client";

import { useState, useRef, useTransition, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createTopicAndEntryAction, createPollTopicAction } from "@/app/actions";
import { playBuzzSound } from "@/lib/utils";
import confetti from "canvas-confetti";
import { X, Plus } from "lucide-react";

function NewThreadContent() {
  const [type, setType] = useState<"normal" | "poll">("normal");
  const searchParams = useSearchParams();
  const titleParam = searchParams.get("title") || "";
  
  // Normal Thread State
  const [title, setTitle] = useState(titleParam);

  useEffect(() => {
    if (titleParam) {
      setTitle(titleParam);
    }
  }, [titleParam]);
  const [content, setContent] = useState("");
  const [base64Image, setBase64Image] = useState<string | null>(null);

  // Poll State
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);

  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTabChange = (newType: "normal" | "poll") => {
    setType(newType);
    setError("");
    playBuzzSound();
  };

  const handleAddOption = () => {
    playBuzzSound();
    if (pollOptions.length < 10) {
      setPollOptions([...pollOptions, ""]);
    }
  };

  const handleRemoveOption = (index: number) => {
    playBuzzSound();
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...pollOptions];
    updated[index] = val;
    setPollOptions(updated);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1.5 * 1024 * 1024) {
      alert("Görsel boyutu 1.5MB'dan küçük olmalıdır zzz.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setBase64Image(reader.result as string);
      playBuzzSound();
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setBase64Image(null);
    playBuzzSound();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Lütfen başlık girin.");
      return;
    }

    if (type === "normal") {
      if (!content.trim()) {
        setError("Lütfen içerik girin.");
        return;
      }

      if (content.trim().length < 45) {
        setError("İçerik en az 45 karakter olmalıdır zzz.");
        return;
      }

      startTransition(async () => {
        try {
          const result = await createTopicAndEntryAction(title, content, base64Image || undefined);
          if (result.error) {
            setError(result.error);
          } else if (result.success && result.slug) {
            triggerConfetti();
            playBuzzSound();
            router.push(`/baslik/${result.slug}`);
            router.refresh();
          }
        } catch (e) {
          setError("Başlık oluşturulurken teknik bir sorun oluştu.");
        }
      });
    } else {
      if (!pollQuestion.trim()) {
        setError("Lütfen anket sorusunu girin.");
        return;
      }

      const validOptions = pollOptions.map(o => o.trim()).filter(Boolean);
      if (validOptions.length < 2) {
        setError("Lütfen en az 2 geçerli seçenek girin.");
        return;
      }

      startTransition(async () => {
        try {
          const result = await createPollTopicAction(title, pollQuestion, validOptions);
          if (result.error) {
            setError(result.error);
          } else if (result.success && result.slug) {
            triggerConfetti();
            playBuzzSound();
            router.push(`/baslik/${result.slug}`);
            router.refresh();
          }
        } catch (e) {
          setError("Anket oluşturulurken teknik bir sorun oluştu.");
        }
      });
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#14b8a6", "#3b82f6", "#8b5cf6"],
    });
  };

  const handleCancel = () => {
    playBuzzSound();
    router.push("/");
  };

  return (
    <div className="new-thread-page animate-in fade-in duration-300">
      <h1>Yeni Konu Aç</h1>
      
      <div className="post-type-selector">
        <button
          type="button"
          className={`post-type-btn ${type === "normal" ? "active" : ""}`}
          onClick={() => handleTabChange("normal")}
        >
          💬 Normal Konu
        </button>
        <button
          type="button"
          className={`post-type-btn ${type === "poll" ? "active" : ""}`}
          onClick={() => handleTabChange("poll")}
        >
          📊 Anket
        </button>
      </div>

      <form onSubmit={handleSubmit} className="new-thread-form" noValidate>
        {error && (
          <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-xs text-red-400">
            {error}
          </div>
        )}

        <label>
          Başlık
          <input
            type="text"
            required
            maxLength={80}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Konunun başlığı…"
            disabled={isPending}
          />
        </label>

        {type === "normal" ? (
          <>
            <label>
              İçerik
              <div className="mention-wrap">
                <textarea
                  required
                  rows={8}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Konunuzun içeriğini buraya yazın…"
                  disabled={isPending}
                />
              </div>
            </label>

            {base64Image && (
              <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-slate-750 mt-2 shrink-0 group">
                <img src={base64Image} alt="Yüklenen görsel" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="poll-builder flex flex-col gap-4">
            <label>
              Anket Sorusu
              <textarea
                className="poll-question-input"
                required
                maxLength={300}
                rows={3}
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                placeholder="Sorunuzu buraya yazın…"
                disabled={isPending}
              />
              <span className="text-[10px] text-slate-500 self-end mt-1">
                {pollQuestion.length}/300
              </span>
            </label>

            <div className="poll-options-list flex flex-col gap-2">
              <p className="text-xs font-bold text-slate-350">Seçenekler</p>
              {pollOptions.map((opt, idx) => (
                <div key={idx} className="poll-option-row flex items-center gap-2">
                  <input
                    type="text"
                    required={idx < 2}
                    maxLength={200}
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Seçenek ${idx + 1}`}
                    className="flex-1"
                    disabled={isPending}
                  />
                  {pollOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="p-2 border border-slate-800 hover:border-red-500/50 rounded-lg hover:text-red-400 transition-colors text-slate-500 shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              {pollOptions.length < 10 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 mt-1 rounded-lg border border-dashed border-slate-700 hover:border-teal-500 text-xs font-bold text-slate-350 hover:text-white transition-all bg-slate-900/10 hover:bg-slate-900/30"
                  disabled={isPending}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Seçenek Ekle</span>
                </button>
              )}
            </div>
          </div>
        )}

        <div className="form-actions mt-4 flex items-center justify-end gap-2.5">
          <button
            type="button"
            className="px-4 py-2 rounded-lg border border-slate-700 hover:border-teal-500 text-xs font-bold text-slate-350 hover:text-white transition-all bg-slate-900/60"
            onClick={handleCancel}
            disabled={isPending}
          >
            İptal
          </button>
          
          {type === "normal" && (
            <>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                disabled={isPending}
              />
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-slate-700 hover:border-teal-500 text-xs font-bold text-slate-350 hover:text-white transition-all bg-slate-900/60"
                onClick={() => fileInputRef.current?.click()}
                disabled={isPending}
              >
                Fotoğraf Ekle
              </button>
            </>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2 rounded-lg bg-teal-500 text-white text-xs font-bold hover:bg-teal-400 transition-colors disabled:opacity-50"
          >
            {isPending ? "Paylaşılıyor..." : type === "normal" ? "Konuyu Paylaş" : "Anketi Paylaş"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewThread() {
  return (
    <Suspense fallback={<div className="text-zinc-500 text-xs p-6 text-center animate-pulse">yükleniyor zzz...</div>}>
      <NewThreadContent />
    </Suspense>
  );
}
