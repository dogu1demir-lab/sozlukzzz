"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { playBuzzSound } from "@/lib/utils";
import Link from "next/link";

interface IntroBannerProps {
  isLoggedIn: boolean;
}

export default function IntroBanner({ isLoggedIn }: IntroBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const dismissed = localStorage.getItem("introDismissed") === "true";
      if (!dismissed) {
        setIsVisible(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    playBuzzSound();
    setIsVisible(false);
    localStorage.setItem("introDismissed", "true");
  };

  if (!isVisible) return null;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-zinc-900 bg-gradient-to-br from-zinc-900 to-black p-4 md:p-6 shadow-xl animate-in fade-in duration-300">
      {/* Close Button */}
      <button
        onClick={handleDismiss}
        title="Kapat"
        className="absolute top-3 right-3 p-1.5 rounded-full text-zinc-500 hover:text-white hover:bg-zinc-800/50 transition-all z-20 active:scale-95"
      >
        <X className="h-4 w-4" />
      </button>
      
      <div className="absolute right-12 top-1/2 -translate-y-1/2 text-6xl select-none opacity-10 animate-pulse z-0 pointer-events-none">
        🪰
      </div>
      
      <div className="relative z-10 max-w-2xl pr-6 flex flex-col items-start">
        <h1 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
          hoş geldin, <span className="text-lime-400">vızzz!</span>
        </h1>
        <p className="mt-2 text-xs md:text-sm text-zinc-400 leading-relaxed">
          sözlükzzz, kütük gibi takılmayan yeni nesil sözlük platformu! Hemen aramıza katılarak yazar ol; entry'lerini özgürce paylaş, fikirlerini tartış ve hatta belki aradığın aşkı bul! vızzz!
        </p>
        {!isLoggedIn && (
          <div className="mt-3.5 flex">
            <Link
              href="/kaydol"
              onClick={() => playBuzzSound()}
              className="inline-flex items-center gap-1.5 px-4.5 py-2 bg-lime-500 hover:bg-lime-400 text-black text-xs font-extrabold rounded-full transition-all active:scale-95 shadow-md shadow-lime-500/10 cursor-pointer"
            >
              aramıza katıl & yazar ol 🪰
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
