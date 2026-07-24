"use client";

import { useCallback, useRef, useState } from "react";

type ModalRequest = {
  type: "confirm" | "alert" | "prompt";
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  danger: boolean;
  placeholder?: string;
  maxLength?: number;
};

type ConfirmOptions = {
  title?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
};

type PromptOptions = {
  title?: string;
  confirmText?: string;
  cancelText?: string;
  placeholder?: string;
  maxLength?: number;
};

/**
 * AGENTS.md "Arayüz Onay ve Uyarı Modalları Standardı" kuralı için paylaşılan
 * onay/uyarı/girdi modalı. Yerel confirm()/alert()/prompt() yerine kullanılır.
 *
 * Kullanım:
 *   const { confirm, alert, prompt, feedbackModal } = useFeedbackModal();
 *   if (await confirm("Silmek istediğinize emin misiniz?")) { ... }
 *   await alert("Bir hata oluştu.");
 *   const reason = await prompt("Şikayet nedeninizi yazın.");
 *   return (<>...{feedbackModal}</>);
 */
export function useFeedbackModal() {
  const [request, setRequest] = useState<ModalRequest | null>(null);
  const [inputValue, setInputValue] = useState("");
  const resolverRef = useRef<((value: string | null) => void) | null>(null);

  const open = useCallback((req: ModalRequest) => {
    return new Promise<string | null>((resolve) => {
      resolverRef.current = resolve;
      setInputValue("");
      setRequest(req);
    });
  }, []);

  const close = useCallback((value: string | null) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setRequest(null);
  }, []);

  const confirm = useCallback(
    async (message: string, options?: ConfirmOptions) => {
      const result = await open({
        type: "confirm",
        title: options?.title ?? "Onay Gerekiyor",
        message,
        confirmText: options?.confirmText ?? "Evet, Onayla",
        cancelText: options?.cancelText ?? "Vazgeç",
        danger: options?.danger ?? true,
      });
      return result !== null;
    },
    [open]
  );

  const alert = useCallback(
    async (message: string, options?: { title?: string }) => {
      await open({
        type: "alert",
        title: options?.title ?? "Bilgilendirme",
        message,
        confirmText: "Tamam",
        cancelText: "",
        danger: false,
      });
    },
    [open]
  );

  const prompt = useCallback(
    async (message: string, options?: PromptOptions) => {
      const result = await open({
        type: "prompt",
        title: options?.title ?? "Girdi Gerekiyor",
        message,
        confirmText: options?.confirmText ?? "Gönder",
        cancelText: options?.cancelText ?? "Vazgeç",
        danger: false,
        placeholder: options?.placeholder,
        maxLength: options?.maxLength ?? 500,
      });
      if (result === null) return null;
      const trimmed = result.trim();
      return trimmed.length > 0 ? trimmed : null;
    },
    [open]
  );

  const feedbackModal = request ? (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 border ${
              request.danger
                ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                : "bg-amber-500/10 border-amber-500/30 text-amber-400"
            }`}
          >
            {request.type === "confirm" ? "⚠️" : request.type === "prompt" ? "✏️" : "💬"}
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white">{request.title}</h3>
            <p className="text-xs text-zinc-400 mt-0.5 whitespace-pre-line">{request.message}</p>
          </div>
        </div>

        {request.type === "prompt" && (
          <textarea
            autoFocus
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={request.placeholder}
            maxLength={request.maxLength}
            rows={3}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 resize-none"
          />
        )}

        <div className="flex items-center justify-end gap-2.5 pt-2">
          {request.type !== "alert" && (
            <button
              type="button"
              onClick={() => close(null)}
              className="px-4 py-2 text-xs font-extrabold text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all active:scale-95 cursor-pointer"
            >
              {request.cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={() => close(request.type === "prompt" ? inputValue : "ok")}
            disabled={request.type === "prompt" && inputValue.trim().length === 0}
            className={`px-4 py-2 text-xs font-extrabold rounded-xl border transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              request.danger
                ? "text-white bg-rose-600 hover:bg-rose-500 border-rose-500"
                : "text-black bg-amber-400 hover:bg-amber-300 border-amber-300"
            }`}
          >
            {request.confirmText}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { confirm, alert, prompt, feedbackModal };
}
