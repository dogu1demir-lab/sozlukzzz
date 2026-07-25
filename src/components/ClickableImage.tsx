"use client";

import { useState } from "react";
import Image from "next/image";

interface ClickableImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
}

/**
 * Kırpılmış kart görselini tıklayınca tam ekran lightbox'ta kırpmadan
 * (object-contain) gösterir. Feed/PozKes/entry resimlerinde ortak bileşen.
 * Tüm kaynaklar zaten optimize WebP; AGENTS.md kuralı gereği unoptimized.
 */
export default function ClickableImage({ src, alt, width = 600, height = 400, sizes, className }: ClickableImageProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        unoptimized
        onClick={() => setIsOpen(true)}
        className={`${className ?? ""} cursor-zoom-in`}
        title="Tam boyut görüntüle 🔍"
      />
      {isOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200 cursor-zoom-out"
          onClick={() => setIsOpen(false)}
        >
          <Image
            src={src}
            alt={alt}
            width={1920}
            height={1920}
            unoptimized
            style={{ width: "auto", height: "auto" }}
            className="max-w-full max-h-[92vh] object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-zinc-900/80 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center justify-center text-sm font-black transition-all active:scale-95 cursor-pointer"
            title="Kapat"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
