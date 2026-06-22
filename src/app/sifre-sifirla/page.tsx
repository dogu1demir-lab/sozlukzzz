"use client";

import { useActionState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPasswordAction } from "@/app/actions";
import { playBuzzSound } from "@/lib/utils";
import { Lock, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

interface ActionState {
  error?: string;
  success?: boolean;
}

const initialState: ActionState = {
  error: "",
  success: false,
};

function ResetPasswordFormContent() {
  const [state, formAction, isPending] = useActionState(resetPasswordAction, initialState);
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      playBuzzSound();
      // Auto redirect to login after 3 seconds
      const timer = setTimeout(() => {
        router.push("/giris");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state, router]);

  return (
    <div className="w-full max-w-md space-y-6 rounded-2xl border border-zinc-850 bg-zinc-950 p-5 md:p-6 shadow-2xl animate-in fade-in duration-300">
      {/* Title */}
      <div className="text-center">
        <span className="text-3xl select-none" role="img" aria-label="fly">
          🪰
        </span>
        <h2 className="mt-2 text-lg font-bold tracking-tight text-white">
          yeni şifre <span className="text-lime-400">belirle</span>
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          hesabın için güçlü ve güvenli yeni bir şifre gir zzz.
        </p>
      </div>

      {state?.success ? (
        /* Success Screen */
        <div className="space-y-4 py-4 text-center animate-in zoom-in-95 duration-200">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-lime-500/10 text-lime-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-zinc-200">
            Şifreniz başarıyla güncellendi!
          </p>
          <p className="text-xs text-zinc-500">
            Giriş sayfasına yönlendiriliyorsunuz zzz...
          </p>
          <div className="pt-2">
            <Link
              href="/giris"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-lime-400 hover:underline"
            >
              hemen giriş yap
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : (
        /* Reset Form */
        <form action={formAction} className="mt-6 space-y-4">
          {state?.error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3.5 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}

          {/* Hidden Token Input */}
          <input type="hidden" name="token" value={token} />

          <div className="space-y-4 rounded-md">
            {/* Password Input */}
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                yeni şifre (en az 6 karakter)
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full h-11 rounded-lg bg-zinc-900 border border-zinc-800 px-4 pl-10 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-all"
                placeholder="yeni şifre (en az 6 karakter)"
              />
              <Lock className="absolute left-3 top-3.5 h-4 w-4 text-zinc-500" />
            </div>

            {/* Confirm Password Input */}
            <div className="relative">
              <label htmlFor="confirmPassword" className="sr-only">
                yeni şifre tekrarı
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="w-full h-11 rounded-lg bg-zinc-900 border border-zinc-800 px-4 pl-10 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-all"
                placeholder="yeni şifre tekrarı"
              />
              <Lock className="absolute left-3 top-3.5 h-4 w-4 text-zinc-500" />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isPending}
              onClick={() => playBuzzSound()}
              className="group relative flex w-full justify-center rounded-full bg-lime-500 py-2.5 px-4 text-sm font-bold text-black hover:bg-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2 focus:ring-offset-zinc-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{isPending ? "güncelleniyor..." : "şifreyi güncelle"}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function ResetPassword() {
  return (
    <div className="reset-password-page flex min-h-[calc(100vh-120px)] items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={
        <div className="w-full max-w-md text-center py-12 text-zinc-500 text-sm font-medium">
          Yükleniyor zzz...
        </div>
      }>
        <ResetPasswordFormContent />
      </Suspense>
    </div>
  );
}
