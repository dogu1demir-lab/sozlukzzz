"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginAction } from "@/app/actions";
import { playBuzzSound } from "@/lib/utils";
import { Lock, User, AlertCircle, ArrowRight } from "lucide-react";

interface ActionState {
  error?: string;
  success?: boolean;
}

const initialState: ActionState = {
  error: "",
  success: false,
};

export default function Login() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      playBuzzSound();
      router.push("/");
      router.refresh();
    }
  }, [state, router]);

  return (
    <div className="giris-page flex min-h-[calc(100vh-120px)] items-center justify-center py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-300">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-zinc-850 bg-black/40 p-5 md:p-6 shadow-2xl backdrop-blur-sm">
        
        {/* Title */}
        <div className="text-center">
          <span className="text-3xl select-none" role="img" aria-label="fly">
            🪰
          </span>
          <h2 className="mt-2 text-lg font-bold tracking-tight text-white">
            sözlükzzz'e <span className="text-lime-400">giriş</span>
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            vızıldamaya kaldığın yerden devam et zzz.
          </p>
        </div>

        {/* Form */}
        <form action={formAction} className="mt-6 space-y-4">
          {state?.error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3.5 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}

          <div className="space-y-4 rounded-md">
            {/* Username Input */}
            <div className="relative">
              <label htmlFor="username" className="sr-only">
                kullanıcı adı
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="w-full h-11 rounded-lg bg-zinc-900 border border-zinc-800 px-4 pl-10 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-all"
                placeholder="kullanıcı adı"
              />
              <User className="absolute left-3 top-3.5 h-4 w-4 text-zinc-500" />
            </div>

            {/* Password Input */}
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                şifre
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full h-11 rounded-lg bg-zinc-900 border border-zinc-800 px-4 pl-10 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-all"
                placeholder="şifre"
              />
              <Lock className="absolute left-3 top-3.5 h-4 w-4 text-zinc-500" />
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isPending}
              onClick={() => playBuzzSound()}
              className="group relative flex w-full justify-center rounded-full bg-lime-500 py-2.5 px-4 text-sm font-bold text-black hover:bg-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2 focus:ring-offset-zinc-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{isPending ? "giriş yapılıyor..." : "giriş yap"}</span>
              <ArrowRight className="absolute right-4 top-3 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-zinc-500">
            Hesabın yok mu?{" "}
            <Link 
              href="/kaydol" 
              className="font-bold text-lime-400 hover:underline hover:text-lime-300 transition-colors"
              onClick={() => playBuzzSound()}
            >
              hemen kaydol
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
