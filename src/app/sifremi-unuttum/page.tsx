"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { forgotPasswordAction } from "@/app/actions";
import { playBuzzSound } from "@/lib/utils";
import { Mail, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";

interface ActionState {
  error?: string;
  success?: boolean;
  message?: string;
}

const initialState: ActionState = {
  error: "",
  success: false,
  message: "",
};

export default function ForgotPassword() {
  const [state, formAction, isPending] = useActionState(forgotPasswordAction, initialState);

  useEffect(() => {
    if (state?.success) {
      playBuzzSound();
    }
  }, [state]);

  return (
    <div className="forgot-password-page flex min-h-[calc(100vh-120px)] items-center justify-center py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-300">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-zinc-850 bg-zinc-950 p-5 md:p-6 shadow-2xl">
        
        {/* Title */}
        <div className="text-center">
          <span className="text-3xl select-none" role="img" aria-label="fly">
            🪰
          </span>
          <h2 className="mt-2 text-lg font-bold tracking-tight text-white">
            şifreni mi <span className="text-lime-400">unuttun?</span>
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            kayıtlı e-posta adresini gir, sana şifre sıfırlama bağlantısı gönderelim zzz.
          </p>
        </div>

        {state?.success ? (
          /* Success Screen */
          <div className="space-y-4 py-4 text-center animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-lime-500/10 text-lime-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-zinc-200">
              {state.message || "Bağlantı başarıyla gönderildi!"}
            </p>
            <p className="text-xs text-zinc-500">
              Lütfen gelen kutunuzu (ve gereksiz/spam klasörünü) kontrol edin.
            </p>
            <div className="pt-4">
              <Link
                href="/giris"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-lime-400 hover:underline hover:text-lime-300 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                giriş ekranına dön
              </Link>
            </div>
          </div>
        ) : (
          /* Request Form */
          <form action={formAction} className="mt-6 space-y-4">
            {state?.error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3.5 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{state.error}</span>
              </div>
            )}

            <div className="space-y-4 rounded-md">
              <div className="relative">
                <label htmlFor="email" className="sr-only">
                  e-posta adresi
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full h-11 rounded-lg bg-zinc-900 border border-zinc-800 px-4 pl-10 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-all"
                  placeholder="e-posta adresiniz"
                />
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-zinc-500" />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isPending}
                onClick={() => playBuzzSound()}
                className="group relative flex w-full justify-center rounded-full bg-lime-500 py-2.5 px-4 text-sm font-bold text-black hover:bg-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2 focus:ring-offset-zinc-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{isPending ? "gönderiliyor..." : "bağlantı gönder"}</span>
              </button>
            </div>

            <div className="text-center pt-2">
              <Link
                href="/giris"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                vazgeç ve geri dön
              </Link>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
