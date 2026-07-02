"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { sendMessageAction } from "@/app/actions";
import { playBuzzSound } from "@/lib/utils";
import { Send } from "lucide-react";

interface SendMessageFormProps {
  receiverUsername: string;
}

export default function SendMessageForm({ receiverUsername }: SendMessageFormProps) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isSubmittingOrPending = isPending || submitting;
  const router = useRouter();
  const submittingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmittingOrPending || submittingRef.current) return;

    playBuzzSound();
    submittingRef.current = true;
    setSubmitting(true);

    try {
      const result = await sendMessageAction(receiverUsername, content);
      if (result.error) {
        alert(result.error);
      } else {
        setContent("");
        router.refresh();
      }
    } catch (err) {
      alert("Mesaj gönderilirken teknik bir hata oluştu.");
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-3 bg-zinc-950 border-t border-zinc-900">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={isSubmittingOrPending}
        maxLength={2000}
        placeholder="Mesajını buraya vızıldat zzz..."
        className="flex-1 h-10 rounded-full bg-zinc-900 border border-zinc-800 px-4 text-sm text-zinc-200 placeholder-zinc-550 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-all"
      />
      <button
        type="submit"
        disabled={isSubmittingOrPending || !content.trim()}
        className="w-10 h-10 rounded-full bg-lime-500 text-black flex items-center justify-center hover:bg-lime-400 transition-colors disabled:opacity-50 active:scale-95 shrink-0"
      >
        <Send className="h-4 w-4" />
      </button>
    </form>
  );
}
