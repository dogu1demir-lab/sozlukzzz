"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { playBuzzSound } from "@/lib/utils";

export default function IntroBanner() {
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
      
      <div className="relative z-10 max-w-2xl pr-6">
        <h1 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
          hoş geldin, <span className="text-lime-400">vızzz!</span>
        </h1>
        <p className="mt-2 text-xs md:text-sm text-zinc-450 leading-relaxed">
          sözlükzzz, Türkiye'nin ilk ve tek sinek sever platformu. Burada kütük gibi takılmak yok, yağ gibi akan bir arayüz ve sinek vızıltıları eşliğinde her şeyi özgürce tartışıyoruz.
        </p>
      </div>
    </section>
  );
}
