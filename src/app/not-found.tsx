import Link from "next/link";
import { ArrowLeft, Home, Edit3 } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-12 px-4 text-center animate-in fade-in duration-300">
      {/* Visual illustration of the lost fly */}
      <div className="relative w-24 h-24 flex items-center justify-center mb-6">
        {/* Pulsing radar ripples */}
        <div className="absolute inset-0 rounded-full bg-lime-500/5 border border-lime-500/10 animate-ping"></div>
        <div className="absolute inset-2 rounded-full bg-zinc-900/60 border border-zinc-800 flex items-center justify-center shadow-inner">
          {/* Confused fly emoji rotating/wobbling */}
          <span className="text-4xl select-none animate-bounce" style={{ animationDuration: "2s" }} role="img" aria-label="confused fly">
            🪰❓
          </span>
        </div>
      </div>

      {/* Heading */}
      <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
        404 - Bu Sayfa <span className="text-lime-500">Vızıldayıp Uçtu!</span>
      </h1>
      
      {/* Subtext */}
      <p className="mt-3 max-w-md text-sm text-zinc-500 leading-relaxed">
        Aradığınız yol boş kovan zzz... Gitmek istediğiniz yazar veya başlık burada uçmuyor. Belki de yanlış yöne saptınız?
      </p>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center w-full max-w-sm">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-lime-500 text-black font-bold hover:bg-lime-400 active:scale-95 transition-all text-sm shadow-lg shadow-lime-500/10"
        >
          <Home className="h-4 w-4" />
          Ana Sayfa'ya Dön
        </Link>
        <Link
          href="/yeni"
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold hover:bg-zinc-800 hover:text-white active:scale-95 transition-all text-sm"
        >
          <Edit3 className="h-4 w-4" />
          Yeni Başlık Vızıldat
        </Link>
      </div>

      {/* Secondary Back Button */}
      <div className="mt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-zinc-650 hover:text-zinc-400 font-semibold transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          önceki sayfaya geri dön
        </Link>
      </div>
    </div>
  );
}
