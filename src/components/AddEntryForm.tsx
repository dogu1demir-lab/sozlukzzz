"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createEntryAction } from "@/app/actions";
import { playBuzzSound } from "@/lib/utils";
import { Send, AlertCircle } from "lucide-react";

interface AddEntryFormProps {
  topicId: string;
  isLoggedIn: boolean;
}

export default function AddEntryForm({ topicId, isLoggedIn }: AddEntryFormProps) {
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isSubmittingOrPending = isPending || submitting;
  const router = useRouter();
  const searchParams = useSearchParams();
  const submittingRef = useRef(false);

  const replyTo = searchParams.get("replyTo");
  const replyIndex = searchParams.get("replyIndex");

  useEffect(() => {
    if (replyTo) {
      setContent(prev => {
        if (!prev.trim() || prev === `@${replyTo} `) {
          return `@${replyTo} `;
        }
        if (!prev.includes(`@${replyTo}`)) {
          return `@${replyTo} ${prev}`;
        }
        return prev;
      });
    }
  }, [replyTo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingOrPending || submittingRef.current) return;
    setError("");

    if (!isLoggedIn) {
      setError("Entry girmek için lütfen giriş yapın.");
      return;
    }

    if (!content.trim()) {
      setError("Entry içeriği boş olamaz.");
      return;
    }

    if (content.trim().length < 45) {
      setError("Entry en az 45 karakter olmalıdır zzz.");
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    startTransition(async () => {
      try {
        const result = await createEntryAction(topicId, content);
        if (result.error) {
          setError(result.error);
          setSubmitting(false);
          submittingRef.current = false;
        } else {
          setContent("");
          playBuzzSound(false, "/eylemhareket.mp3");
          router.refresh();
          setSubmitting(false);
          submittingRef.current = false;
        }
      } catch (err) {
        setError("Entry gönderilirken teknik bir hata oluştu.");
        setSubmitting(false);
        submittingRef.current = false;
      }
    });
  };

  if (!isLoggedIn) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 p-6 text-center bg-zinc-900/10">
        <p className="text-sm text-zinc-400">
          Bu başlığa vızıldamak için lütfen{" "}
          <a href="/giris" className="text-lime-400 font-bold hover:underline">giriş yapın</a>{" "}
          veya{" "}
          <a href="/kaydol" className="text-lime-400 font-bold hover:underline">kaydolun</a>.
        </p>
      </div>
    );
  }

  return (
    <form id="reply-form" onSubmit={handleSubmit} className="space-y-4 border-t border-zinc-900 pt-6">
      <h3 className="text-sm font-bold text-zinc-300">başlığa vızılda</h3>
      
      {replyTo && (
        <div className="flex items-center justify-between rounded-lg bg-zinc-900/50 border border-zinc-800 p-2.5 text-xs text-zinc-400 animate-in fade-in duration-200">
          <span className="flex items-center gap-1">
            <span className="text-lime-400 font-bold">@{replyTo}</span>
            <span>isimli yazarın {replyIndex ? `#${replyIndex} nolu` : ""} entry'sine cevap yazıyorsunuz</span>
          </span>
          <button
            type="button"
            onClick={() => {
              const params = new URLSearchParams(window.location.search);
              params.delete("replyTo");
              params.delete("replyIndex");
              const newSearch = params.toString() ? "?" + params.toString() : "";
              router.replace(`${window.location.pathname}${newSearch}#reply-form`, { scroll: false });
            }}
            className="text-zinc-500 hover:text-white transition-colors font-bold"
          >
            vazgeç
          </button>
        </div>
      )}
      
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="relative">
        <textarea
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="fikirlerini buraya vızıldat zzz..."
          disabled={isSubmittingOrPending}
          className="w-full rounded-xl bg-zinc-900 border border-zinc-800 p-4 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-all resize-y"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmittingOrPending}
          className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-lime-500 text-black font-semibold text-xs hover:bg-lime-400 transition-colors shadow-lg shadow-lime-500/10 disabled:opacity-50"
        >
          <Send className="h-3 w-3" />
          <span>{isSubmittingOrPending ? "gönderiliyor..." : "vızıldat"}</span>
        </button>
      </div>
    </form>
  );
}
