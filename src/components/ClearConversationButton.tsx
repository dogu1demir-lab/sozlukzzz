"use client";

import React, { useTransition } from "react";
import { clearConversationAction } from "@/app/actions";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { playBuzzSound } from "@/lib/utils";

interface ClearConversationButtonProps {
  partnerUsername: string;
}

export default function ClearConversationButton({ partnerUsername }: ClearConversationButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClear = () => {
    if (
      !confirm(
        `@${partnerUsername} ile olan tüm sohbet geçmişinizi (gönderilen ve alınan tüm mesajları) kökten silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`
      )
    ) {
      return;
    }

    playBuzzSound(false, "/eylemhareket.mp3");

    startTransition(async () => {
      const res = await clearConversationAction(partnerUsername);
      if (res.error) {
        alert(res.error);
      } else {
        router.push("/mesajlar");
        router.refresh();
      }
    });
  };

  return (
    <button
      onClick={handleClear}
      disabled={isPending}
      title="Sohbeti Sil / Temizle"
      className="p-2 text-zinc-500 hover:text-red-400 hover:bg-zinc-900/60 rounded-lg transition-colors cursor-pointer shrink-0 ml-auto"
    >
      <Trash2 className="h-4.5 w-4.5" />
    </button>
  );
}
