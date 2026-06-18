"use client";

import { useState } from "react";
import { X, Trophy, Check } from "lucide-react";
import { playBuzzSound } from "@/lib/utils";

// Define the 24 ranks for the fly-themed dictionary
export interface FlyRank {
  level: number;
  name: string;
  minScore: number;
  description: string;
  emoji: string;
  frameColor: string; // Tail/Hex color for SVG border
}

export const FLY_RANKS: FlyRank[] = [
  { level: 1, name: "Sinek Yumurtası", minScore: 0, description: "Yeni Başlangıç", emoji: "🥚", frameColor: "from-amber-800 to-amber-950" },
  { level: 2, name: "Çatlak Yumurta", minScore: 10, description: "İlk Adımlar", emoji: "⚡", frameColor: "from-amber-700 to-amber-900" },
  { level: 3, name: "Minik Larva", minScore: 25, description: "Keşfediyor", emoji: "🐛", frameColor: "from-emerald-700 to-emerald-900" },
  { level: 4, name: "Obur Larva", minScore: 50, description: "Isınıyor", emoji: "🐛", frameColor: "from-emerald-600 to-emerald-800" },
  { level: 5, name: "Pupa Dönemi", minScore: 80, description: "Dönüşüyor", emoji: "🕸️", frameColor: "from-teal-700 to-teal-900" },
  { level: 6, name: "Kozadan Çıkış", minScore: 120, description: "İlk Uçuş", emoji: "🪰", frameColor: "from-teal-600 to-teal-800" },
  { level: 7, name: "Meyve Sineği", minScore: 170, description: "Meraklı", emoji: "🍉", frameColor: "from-sky-700 to-sky-900" },
  { level: 8, name: "Ev Sineği", minScore: 230, description: "Aramızda", emoji: "🪰", frameColor: "from-sky-600 to-sky-800" },
  { level: 9, name: "Vız Vız Sinek", minScore: 300, description: "Kendini Gösteren", emoji: "🔊", frameColor: "from-blue-700 to-blue-900" },
  { level: 10, name: "Karasinek", minScore: 380, description: "Kararlı Uçucu", emoji: "🪰", frameColor: "from-slate-500 to-slate-700" },
  { level: 11, name: "Yeşil Sinek", minScore: 470, description: "Parlak ve Dikkat Çekici", emoji: "🟢", frameColor: "from-green-500 to-green-700" },
  { level: 12, name: "At Sineği", minScore: 570, description: "Israrcı ve Güçlü", emoji: "🐴", frameColor: "from-stone-500 to-stone-700" },
  { level: 13, name: "Arı Sineği", minScore: 680, description: "Çalışkan", emoji: "🐝", frameColor: "from-yellow-600 to-yellow-800" },
  { level: 14, name: "Avcı Sinek", minScore: 800, description: "Keskin Gözlü", emoji: "🎯", frameColor: "from-orange-600 to-orange-800" },
  { level: 15, name: "Aerodinamik Sinek", minScore: 930, description: "Akrobatik Uçucu", emoji: "✈️", frameColor: "from-cyan-500 to-cyan-700" },
  { level: 16, name: "Kanat Ustası", minScore: 1070, description: "Süratli", emoji: "⚡", frameColor: "from-indigo-600 to-indigo-800" },
  { level: 17, name: "Vızıltı Efendisi", minScore: 1220, description: "Sesi Gür", emoji: "📣", frameColor: "from-rose-600 to-rose-800" },
  { level: 18, name: "Çelik Kanat", minScore: 1380, description: "Dayanıklı", emoji: "🛡️", frameColor: "from-slate-400 to-zinc-600" },
  { level: 19, name: "Soylu Sinek", minScore: 1550, description: "Saygı Duyulan", emoji: "🎖️", frameColor: "from-yellow-500 to-amber-600" },
  { level: 20, name: "Kral Sinek", minScore: 1730, description: "Bölgenin Lideri", emoji: "👑", frameColor: "from-yellow-400 to-orange-500" },
  { level: 21, name: "Altın Sinek", minScore: 1920, description: "Nadir ve Değerli", emoji: "🪙", frameColor: "from-amber-400 to-yellow-300" },
  { level: 22, name: "Efsane Vızıltı", minScore: 2120, description: "Herkesin Dilinde", emoji: "🌟", frameColor: "from-violet-500 to-fuchsia-600" },
  { level: 23, name: "Sözlükzzz Ruhu", minScore: 2330, description: "Topluluk Ruhu", emoji: "🔮", frameColor: "from-purple-500 to-indigo-500" },
  { level: 24, name: "Sonsuz Vızıltı", minScore: 2550, description: "Zirvenin Ötesi", emoji: "🌌", frameColor: "from-cyan-400 via-pink-500 to-yellow-400" },
];

export function getRankByScore(score: number): FlyRank {
  let matched = FLY_RANKS[0];
  for (const r of FLY_RANKS) {
    if (score >= r.minScore) {
      matched = r;
    } else {
      break;
    }
  }
  return matched;
}

// Subcomponent to render customized high-quality fly stage SVGs
function RenderFlyStageSvg({ level }: { level: number }) {
  if (level <= 2) {
    // Stage 1: Egg (Sinek Yumurtası)
    return (
      <svg viewBox="0 0 64 64" className="w-12 h-12 filter drop-shadow-[0_2px_8px_rgba(251,191,36,0.3)] animate-pulse">
        <defs>
          <linearGradient id="eggGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="60%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>
        </defs>
        {/* Egg Background glow */}
        <circle cx="32" cy="36" r="14" fill="#fbbf24" opacity="0.15" filter="blur(4px)" />
        {/* Nest/Leaf under egg */}
        <path d="M20 42 C24 45, 40 45, 44 42" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M16 44 C22 48, 42 48, 48 44" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        {/* Egg Shell */}
        <ellipse cx="32" cy="33" rx="11" ry="14" fill="url(#eggGrad)" stroke="#1e293b" strokeWidth="2" />
        {/* Egg details / texture dots */}
        <ellipse cx="32" cy="33" rx="9" ry="12" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeDasharray="2 4" />
        {/* Egg Highlight */}
        <path d="M26 26 C28 24, 32 24, 34 26" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.7" fill="none" />
        {/* Crack line for Level 2 (Çatlak Yumurta) */}
        {level === 2 && (
          <path d="M32 19 L30 26 L35 30 L31 38" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="drop-shadow(0 0 2px #f59e0b)" />
        )}
      </svg>
    );
  } else if (level <= 4) {
    // Stage 2: Larva
    return (
      <svg viewBox="0 0 64 64" className="w-12 h-12 filter drop-shadow-[0_2px_8px_rgba(16,185,129,0.3)]">
        <defs>
          <linearGradient id="larvaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="larvaHeadGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
        </defs>
        {/* Ground shadow */}
        <ellipse cx="32" cy="45" rx="16" ry="4" fill="#000" opacity="0.3" />
        {/* Leaf for level 4 (Obur Larva) */}
        {level === 4 && (
          <path d="M12 44 C22 36, 42 42, 46 45 C38 48, 20 48, 12 44" fill="#22c55e" stroke="#15803d" strokeWidth="1.2" opacity="0.85" />
        )}
        {/* Larva Body (Segmented segments) */}
        <g stroke="#064e3b" strokeWidth="1.5" strokeLinejoin="round">
          {/* Tails segment */}
          <circle cx="18" cy="40" r="5" fill="url(#larvaGrad)" />
          <circle cx="23" cy="38" r="6" fill="url(#larvaGrad)" />
          <circle cx="29" cy="36" r="6.5" fill="url(#larvaGrad)" />
          <circle cx="36" cy="35" r="7" fill="url(#larvaGrad)" />
          <circle cx="43" cy="36" r="6.5" fill="url(#larvaGrad)" />
          {/* Head segment */}
          <circle cx="49" cy="39" r="6" fill="url(#larvaHeadGrad)" />
        </g>
        {/* Eyes */}
        <circle cx="51" cy="37" r="1.5" fill="#fff" />
        <circle cx="51.5" cy="37.2" r="0.6" fill="#000" />
        {/* Cute antenna */}
        <path d="M51 34 Q54 28, 52 26" stroke="#064e3b" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        {/* Highlights */}
        <path d="M34 31 A 5 5 0 0 0 26 33" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>
    );
  } else if (level <= 6) {
    // Stage 3: Pupa (Chrysalis / Koza)
    return (
      <svg viewBox="0 0 64 64" className="w-12 h-12 filter drop-shadow-[0_2px_8px_rgba(20,184,166,0.3)]">
        <defs>
          <linearGradient id="pupaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#b45309" />
            <stop offset="50%" stopColor="#78350f" />
            <stop offset="100%" stopColor="#451a03" />
          </linearGradient>
        </defs>
        {/* Branch */}
        <path d="M12 14 L52 22" stroke="#451a03" strokeWidth="4" strokeLinecap="round" />
        {/* Hanging silk */}
        <path d="M32 18 L32 25" stroke="#94a3b8" strokeWidth="2" />
        {/* Pupa Shell */}
        <path d="M22 35 C22 23, 42 23, 42 35 C42 47, 34 52, 32 54 C30 52, 22 47, 22 35 Z" fill="url(#pupaGrad)" stroke="#0f172a" strokeWidth="2.5" strokeLinejoin="round" />
        {/* Outer silk thread cocoon wraps */}
        <path d="M23 32 Q32 27, 41 32" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" fill="none" />
        <path d="M22 38 Q32 35, 42 38" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" fill="none" />
        <path d="M24 44 Q32 42, 40 44" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" fill="none" />
        <path d="M27 49 Q32 47, 37 49" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" fill="none" />
        {/* Kozadan Çıkış (Level 6) glowing cracks */}
        {level === 6 && (
          <path d="M32 28 L32 48 M28 36 L36 36 M29 42 L35 42" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" opacity="0.9" filter="drop-shadow(0 0 3px #14b8a6)" />
        )}
      </svg>
    );
  } else if (level <= 18) {
    // Stage 4: Adult Fly (Karasinek)
    let bodyFill = "url(#flyBodyGrad)";
    let wingFill = "url(#wingGrad)";
    let wingStroke = "#1e3a8a";
    let eyeFill = "url(#eyeGrad)";
    let legsColor = "#0f172a";
    let strokeColor = "#0f172a";
    let headFill = "#1e293b";
    let glowFilter = "drop-shadow-[0_4px_10px_rgba(59,130,246,0.3)]";
    let showBeeStripes = false;
    let showSoundWaves = false;
    let showTarget = false;
    let customWings = false;
    let showSpeedTrails = false;
    let showArmor = false;

    if (level === 7) {
      // Meyve Sineği (Fruit Fly / Watermelon theme)
      bodyFill = "url(#fruitBodyGrad)";
      wingFill = "rgba(253, 224, 71, 0.45)";
      wingStroke = "#b45309";
      eyeFill = "#22c55e";
      glowFilter = "drop-shadow-[0_4px_10px_rgba(239,68,68,0.4)]";
    } else if (level === 8) {
      // Ev Sineği (House Fly)
      bodyFill = "url(#houseBodyGrad)";
      wingFill = "rgba(148, 163, 184, 0.35)";
      wingStroke = "#64748b";
      eyeFill = "#991b1b";
    } else if (level === 9) {
      // Vız Vız Sinek (Buzzing Fly - Cyan electric)
      bodyFill = "url(#buzzBodyGrad)";
      wingFill = "rgba(34, 211, 238, 0.5)";
      wingStroke = "#0891b2";
      eyeFill = "#f97316";
      glowFilter = "drop-shadow-[0_4px_10px_rgba(6,182,212,0.5)]";
      showSoundWaves = true;
    } else if (level === 10) {
      // Karasinek (Black Fly)
      bodyFill = "url(#blackBodyGrad)";
      wingFill = "rgba(71, 85, 105, 0.45)";
      wingStroke = "#1e293b";
      eyeFill = "#ef4444";
      glowFilter = "drop-shadow-[0_4px_10px_rgba(15,23,42,0.6)]";
    } else if (level === 11) {
      // Yeşil Sinek (Green Bottle Fly - Metallic green)
      bodyFill = "url(#greenBodyGrad)";
      wingFill = "rgba(52, 211, 153, 0.4)";
      wingStroke = "#047857";
      eyeFill = "#dc2626";
      glowFilter = "drop-shadow-[0_4px_12px_rgba(16,185,129,0.5)]";
    } else if (level === 12) {
      // At Sineği (Horse Fly - Heavy brown)
      bodyFill = "url(#horseBodyGrad)";
      wingFill = "rgba(180, 83, 9, 0.4)";
      wingStroke = "#78350f";
      eyeFill = "#1d4ed8";
      glowFilter = "drop-shadow-[0_4px_10px_rgba(120,53,15,0.4)]";
    } else if (level === 13) {
      // Arı Sineği (Bee Fly - Yellow striped)
      bodyFill = "url(#beeBodyGrad)";
      wingFill = "rgba(251, 191, 36, 0.35)";
      wingStroke = "#b45309";
      eyeFill = "#0f172a";
      glowFilter = "drop-shadow-[0_4px_10px_rgba(234,179,8,0.4)]";
      showBeeStripes = true;
    } else if (level === 14) {
      // Avcı Sinek (Hunter Fly - Rose copper)
      bodyFill = "url(#hunterBodyGrad)";
      wingFill = "rgba(245, 158, 11, 0.45)";
      wingStroke = "#d97706";
      eyeFill = "#f43f5e";
      glowFilter = "drop-shadow-[0_4px_10px_rgba(244,63,94,0.4)]";
      showTarget = true;
    } else if (level === 15) {
      // Aerodinamik Sinek (Aerodynamic Fly - Cyan plane)
      bodyFill = "url(#aeroBodyGrad)";
      wingFill = "rgba(6, 182, 212, 0.5)";
      wingStroke = "#0891b2";
      eyeFill = "#facc15";
      glowFilter = "drop-shadow-[0_4px_12px_rgba(6,182,212,0.5)]";
      customWings = true;
    } else if (level === 16) {
      // Kanat Ustası (Wing Master - Speed violet)
      bodyFill = "url(#wingMasterBodyGrad)";
      wingFill = "rgba(165, 180, 252, 0.55)";
      wingStroke = "#6366f1";
      eyeFill = "#f43f5e";
      glowFilter = "drop-shadow-[0_4px_12px_rgba(99,102,241,0.5)]";
      showSpeedTrails = true;
    } else if (level === 17) {
      // Vızıltı Efendisi (Lord of Buzz - Pink magic)
      bodyFill = "url(#buzzLordBodyGrad)";
      wingFill = "rgba(236, 72, 153, 0.55)";
      wingStroke = "#db2777";
      eyeFill = "#f59e0b";
      glowFilter = "drop-shadow-[0_6px_14px_rgba(219,39,119,0.5)]";
      showSoundWaves = true;
    } else if (level === 18) {
      // Çelik Kanat (Steel Wing - Armored plates)
      bodyFill = "url(#steelBodyGrad)";
      wingFill = "url(#steelWingGrad)";
      wingStroke = "#475569";
      eyeFill = "#cbd5e1";
      glowFilter = "drop-shadow-[0_4px_12px_rgba(148,163,184,0.4)]";
      showArmor = true;
    }

    return (
      <svg viewBox="0 0 64 64" className={`w-14 h-14 filter ${glowFilter}`}>
        <defs>
          <linearGradient id="fruitBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="60%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#b91c1c" />
          </linearGradient>
          <linearGradient id="houseBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="50%" stopColor="#475569" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
          <linearGradient id="buzzBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="65%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#0891b2" />
          </linearGradient>
          <linearGradient id="blackBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="70%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>
          <linearGradient id="greenBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="40%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#064e3b" />
          </linearGradient>
          <linearGradient id="horseBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a16207" />
            <stop offset="60%" stopColor="#78350f" />
            <stop offset="100%" stopColor="#451a03" />
          </linearGradient>
          <linearGradient id="beeBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>
          <linearGradient id="hunterBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="60%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#7c2d12" />
          </linearGradient>
          <linearGradient id="aeroBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#0891b2" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="wingMasterBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="60%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#31108f" />
          </linearGradient>
          <linearGradient id="buzzLordBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f472b6" />
            <stop offset="50%" stopColor="#db2777" />
            <stop offset="100%" stopColor="#831843" />
          </linearGradient>
          <linearGradient id="steelBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="50%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
          <linearGradient id="steelWingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="wingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.45" />
          </linearGradient>
          <linearGradient id="eyeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#b91c1c" />
          </linearGradient>
          <linearGradient id="flyBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="70%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>

        {/* Shadow */}
        <ellipse cx="32" cy="50" rx="14" ry="4" fill="#000" opacity="0.3" />

        {/* Sound wave rings for buzzing types */}
        {showSoundWaves && (
          <g>
            <circle cx="32" cy="34" r="16" fill="none" stroke={level === 17 ? "#ec4899" : "#22d3ee"} strokeWidth="1" strokeDasharray="3 6" opacity="0.4" className="animate-ping" />
            <circle cx="32" cy="34" r="22" fill="none" stroke={level === 17 ? "#ec4899" : "#22d3ee"} strokeWidth="0.8" strokeDasharray="2 4" opacity="0.25" />
          </g>
        )}

        {/* Speed trails for Kanat Ustası */}
        {showSpeedTrails && (
          <g stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" opacity="0.6">
            <line x1="6" y1="18" x2="14" y2="18" />
            <line x1="50" y1="18" x2="58" y2="18" />
            <line x1="4" y1="26" x2="12" y2="26" />
            <line x1="52" y1="26" x2="60" y2="26" />
            <line x1="8" y1="34" x2="15" y2="34" />
            <line x1="49" y1="34" x2="56" y2="34" />
          </g>
        )}

        {/* Wings */}
        {customWings ? (
          // Sweptback wings for Aerodinamik Sinek
          <>
            <path d="M20 25 L4 12 L16 31 Z" fill={wingFill} stroke={wingStroke} strokeWidth="1.5" />
            <path d="M44 25 L60 12 L48 31 Z" fill={wingFill} stroke={wingStroke} strokeWidth="1.5" />
          </>
        ) : level === 17 ? (
          // Double wings for Vızıltı Efendisi
          <>
            {/* Main Wings */}
            <path d="M20 22 C10 12, 6 28, 22 34 Z" fill={wingFill} stroke={wingStroke} strokeWidth="1.5" opacity="0.8" />
            <path d="M44 22 C54 12, 58 28, 42 34 Z" fill={wingFill} stroke={wingStroke} strokeWidth="1.5" opacity="0.8" />
            {/* Secondary lower wings */}
            <path d="M22 28 C14 20, 8 36, 24 38 Z" fill="rgba(244, 114, 182, 0.45)" stroke="#db2777" strokeWidth="1" opacity="0.7" />
            <path d="M42 28 C50 20, 56 36, 40 38 Z" fill="rgba(244, 114, 182, 0.45)" stroke="#db2777" strokeWidth="1" opacity="0.7" />
          </>
        ) : (
          // Standard wings
          <>
            <path d="M20 22 C10 12, 6 28, 22 34 Z" fill={wingFill} stroke={wingStroke} strokeWidth="1.5" opacity="0.75" />
            <path d="M44 22 C54 12, 58 28, 42 34 Z" fill={wingFill} stroke={wingStroke} strokeWidth="1.5" opacity="0.75" />
          </>
        )}

        {/* Armored lines on wings for Steel Wing */}
        {showArmor && (
          <g stroke="#475569" strokeWidth="1" opacity="0.8">
            <path d="M12 20 L22 28" />
            <path d="M52 20 L42 28" />
            <path d="M16 26 L23 30" />
            <path d="M48 26 L41 30" />
          </g>
        )}

        {/* Legs */}
        <path d="M24 38 L16 42 M24 34 L14 36 M40 38 L48 42 M40 34 L50 36" stroke={legsColor} strokeWidth="2" strokeLinecap="round" />

        {/* Body */}
        <ellipse cx="32" cy="34" rx="8" ry="11" fill={bodyFill} stroke={strokeColor} strokeWidth="2" />
        
        {/* Armor plating segments / stripes */}
        {showBeeStripes ? (
          <g stroke="#1c0d02" strokeWidth="2.5" strokeLinecap="round">
            <path d="M26 31 L38 31" />
            <path d="M24 35 L40 35" />
            <path d="M26 39 L38 39" />
          </g>
        ) : showArmor ? (
          <g stroke="#1e293b" strokeWidth="1.8" strokeLinecap="round">
            <path d="M26 30 L38 30" />
            <path d="M24 34 L40 34" />
            <path d="M26 38 L38 38" />
          </g>
        ) : (
          <ellipse cx="32" cy="34" rx="6" ry="9" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        )}

        {/* Head */}
        <circle cx="32" cy="22" r="5.5" fill={headFill} stroke={strokeColor} strokeWidth="2" />

        {/* Target lock visual for Hunter Fly */}
        {showTarget && (
          <g stroke="#f43f5e" strokeWidth="0.8" opacity="0.8">
            <circle cx="28.5" cy="20.5" r="4.5" fill="none" strokeDasharray="1.5 1.5" />
            <circle cx="35.5" cy="20.5" r="4.5" fill="none" strokeDasharray="1.5 1.5" />
          </g>
        )}

        {/* Eyes */}
        <circle cx="28.5" cy="20.5" r="3" fill={eyeFill} />
        <circle cx="35.5" cy="20.5" r="3" fill={eyeFill} />

        {/* Antenna */}
        <path d="M30 17 Q28 13, 26 14 M34 17 Q36 13, 38 14" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  } else {
    // Stage 5: Golden / Legendary Fly (Soylu / Kral / Altın / Efsane Sinek / Sonsuz Vızıltı)
    let bodyFill = "url(#goldBodyGrad)";
    let wingFill = "url(#goldWingGrad)";
    let wingStroke = "#78350f";
    let eyeFill = "url(#goldEyeGrad)";
    let auraFill = "url(#goldGlow)";
    let sparklesColor = "#fef08a";
    let glowFilter = "drop-shadow-[0_4px_12px_rgba(234,179,8,0.5)]";
    let showCrown = false;
    let headFill = "#f59e0b";
    
    // Level-specific styles
    if (level === 19) {
      // Soylu Sinek
      bodyFill = "url(#nobleBodyGrad)";
      wingFill = "url(#nobleWingGrad)";
      wingStroke = "#b45309";
      eyeFill = "#fbbf24";
      auraFill = "url(#nobleGlow)";
      sparklesColor = "#d8b4fe";
      glowFilter = "drop-shadow-[0_4px_12px_rgba(139,92,246,0.55)]";
      headFill = "#7c3aed";
    } else if (level === 20) {
      // Kral Sinek
      bodyFill = "url(#royalBodyGrad)";
      wingFill = "url(#royalWingGrad)";
      wingStroke = "#b45309";
      eyeFill = "#10b981"; // Emerald eyes
      auraFill = "url(#royalGlow)";
      sparklesColor = "#fde047";
      glowFilter = "drop-shadow-[0_6px_14px_rgba(239,68,68,0.55)]";
      showCrown = true;
      headFill = "#dc2626";
    } else if (level === 21) {
      // Altın Sinek
      bodyFill = "url(#goldBodyGrad)";
      wingFill = "url(#goldWingGrad)";
      wingStroke = "#92400e";
      eyeFill = "#ffffff"; // Diamond eyes
      auraFill = "url(#goldGlow)";
      sparklesColor = "#fef08a";
      glowFilter = "drop-shadow-[0_8px_16px_rgba(251,191,36,0.7)]";
      headFill = "#fbbf24";
    } else if (level === 22) {
      // Efsane Vızıltı
      bodyFill = "url(#legendBodyGrad)";
      wingFill = "url(#legendWingGrad)";
      wingStroke = "#701a75";
      eyeFill = "#22d3ee";
      auraFill = "url(#legendGlow)";
      sparklesColor = "#f472b6";
      glowFilter = "drop-shadow-[0_6px_16px_rgba(236,72,153,0.65)]";
      headFill = "#ec4899";
    } else if (level === 23) {
      // Sözlükzzz Ruhu
      bodyFill = "url(#spiritBodyGrad)";
      wingFill = "url(#spiritWingGrad)";
      wingStroke = "#3730a3";
      eyeFill = "#fbbf24";
      auraFill = "url(#spiritGlow)";
      sparklesColor = "#a5b4fc";
      glowFilter = "drop-shadow-[0_6px_16px_rgba(99,102,241,0.65)]";
      headFill = "#6366f1";
    } else if (level === 24) {
      // Sonsuz Vızıltı
      bodyFill = "url(#infiniteBodyGrad)";
      wingFill = "url(#infiniteWingGrad)";
      wingStroke = "#db2777";
      eyeFill = "#10b981"; // Emerald eyes
      auraFill = "url(#infiniteGlow)";
      sparklesColor = "#fdf2f8";
      glowFilter = "drop-shadow-[0_8px_22px_rgba(236,72,153,0.85)]";
      showCrown = true;
      headFill = "#c084fc";
    }

    return (
      <svg viewBox="0 0 64 64" className={`w-14 h-14 filter ${glowFilter}`}>
        <defs>
          {/* Gradients for Level 19-24 */}
          <radialGradient id="goldGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="goldWingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#ca8a04" stopOpacity="0.75" />
          </linearGradient>
          <linearGradient id="goldBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#92400e" />
          </linearGradient>
          <radialGradient id="goldEyeGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </radialGradient>
          
          <radialGradient id="nobleGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#c084fc" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="nobleBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="60%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#4c1d95" />
          </linearGradient>
          <linearGradient id="nobleWingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fde047" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.6" />
          </linearGradient>

          <radialGradient id="royalGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f87171" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#b91c1c" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="royalBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#b91c1c" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </linearGradient>
          <linearGradient id="royalWingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.6" />
          </linearGradient>

          <radialGradient id="legendGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f472b6" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#db2777" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="legendBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f472b6" />
            <stop offset="50%" stopColor="#db2777" />
            <stop offset="100%" stopColor="#701a75" />
          </linearGradient>
          <linearGradient id="legendWingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#f472b6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#c084fc" stopOpacity="0.6" />
          </linearGradient>

          <radialGradient id="spiritGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#a5b4fc" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="spiritBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="55%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#31108f" />
          </linearGradient>
          <linearGradient id="spiritWingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a5b4fc" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.4" />
          </linearGradient>

          <radialGradient id="infiniteGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#c084fc" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#ec4899" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="infiniteBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e1b4b" />
            <stop offset="50%" stopColor="#4c1d95" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <linearGradient id="infiniteWingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f472b6" stopOpacity="0.9" />
            <stop offset="30%" stopColor="#a78bfa" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* Radiant glow background */}
        <circle cx="32" cy="32" r="22" fill={auraFill} />
        
        {/* Sparkle stars / Magic particles */}
        <g fill={sparklesColor}>
          <path d="M32 3 L33.2 8 L38 9.2 L33.2 10.4 L32 15 L30.8 10.4 L26 9.2 L30.8 8 Z" />
          <path d="M12 46 L12.5 48.5 L15 49 L12.5 49.5 L12 52 L11.5 49.5 L9 49 L11.5 48.5 Z" />
          <path d="M52 46 L52.5 48.5 L55 49 L52.5 49.5 L52 52 L51.5 49.5 L49 49 L51.5 48.5 Z" />
        </g>

        {/* Rotating ring for Level 24 (Sonsuz Vızıltı) */}
        {level === 24 && (
          <circle cx="32" cy="32" r="24" fill="none" stroke="url(#infiniteWingGrad)" strokeWidth="1.2" strokeDasharray="3 6" opacity="0.6" />
        )}

        {/* Crown on top (Visible for King Fly or Sonsuz Vızıltı) */}
        {showCrown && (
          <g>
            <path d="M25 12 L28 16 L32 12 L36 16 L39 12 L36 19 L28 19 Z" fill="#eab308" stroke="#78350f" strokeWidth="1" />
            <circle cx="32" cy="11.5" r="1.2" fill={level === 24 ? "#10b981" : "#ef4444"} />
            <circle cx="25" cy="11.5" r="0.8" fill={level === 24 ? "#ec4899" : "#ef4444"} />
            <circle cx="39" cy="11.5" r="0.8" fill={level === 24 ? "#ec4899" : "#ef4444"} />
          </g>
        )}

        {/* Shadow */}
        <ellipse cx="32" cy="50" rx="14" ry="4" fill="#000" opacity="0.35" />

        {/* Fly Legs */}
        <path d="M24 38 L16 42 M24 34 L14 36 M40 38 L48 42 M40 34 L50 36" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />

        {/* Golden/Divine Wings */}
        <path d="M20 22 C8 10, 4 28, 22 34 Z" fill={wingFill} stroke={wingStroke} strokeWidth="1.5" />
        <path d="M44 22 C56 10, 60 28, 42 34 Z" fill={wingFill} stroke={wingStroke} strokeWidth="1.5" />

        {/* Fly Body */}
        <ellipse cx="32" cy="34" rx="8" ry="11" fill={bodyFill} stroke={wingStroke} strokeWidth="2" />
        <ellipse cx="32" cy="34" rx="6" ry="9" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />

        {/* Fly Head */}
        <circle cx="32" cy="22" r="5.5" fill={headFill} stroke={wingStroke} strokeWidth="2" />
        
        {/* Fly Eyes */}
        <circle cx="28.5" cy="20.5" r="3.2" fill={eyeFill} />
        <circle cx="35.5" cy="20.5" r="3.2" fill={eyeFill} />

        {/* Antenna */}
        <path d="M30 17 Q28 13, 26 14 M34 17 Q36 13, 38 14" stroke={wingStroke} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
}

interface FlyRankBadgeProps {
  score: number;
  interactive?: boolean;
}

export default function FlyRankBadge({ score, interactive = true }: FlyRankBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentRank = getRankByScore(score);

  const handleOpen = () => {
    if (!interactive) return;
    playBuzzSound();
    setIsOpen(true);
  };

  const handleClose = () => {
    playBuzzSound();
    setIsOpen(false);
  };

  return (
    <>
      {/* Badge button */}
      <button
        onClick={handleOpen}
        type="button"
        disabled={!interactive}
        className={`focus:outline-none transition-transform active:scale-95 ${
          interactive ? "cursor-pointer hover:scale-105" : "cursor-default"
        }`}
        title={`${currentRank.name} (${currentRank.description}) - Puan: ${score}`}
      >
        <div className="relative w-28 h-28 flex items-center justify-center">
          {/* Badge SVG Frame */}
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
            <defs>
              <linearGradient id={`frameGrad-${currentRank.level}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: currentRank.level >= 22 ? "#c084fc" : currentRank.level >= 19 ? "#fbbf24" : currentRank.level >= 10 ? "#94a3b8" : "#d97706" }} />
                <stop offset="100%" style={{ stopColor: currentRank.level >= 22 ? "#db2777" : currentRank.level >= 19 ? "#ea580c" : currentRank.level >= 10 ? "#334155" : "#78350f" }} />
              </linearGradient>
              <radialGradient id="innerBg" cx="50%" cy="50%" r="50%">
                <stop offset="0%" style={{ stopColor: "#1e293b" }} />
                <stop offset="100%" style={{ stopColor: "#020617" }} />
              </radialGradient>

              {/* Stage 1: Egg Gradients */}
              <linearGradient id="eggGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="60%" stopColor="#e2e8f0" />
                <stop offset="100%" stopColor="#cbd5e1" />
              </linearGradient>

              {/* Stage 2: Larva Gradients */}
              <linearGradient id="larvaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id="larvaHeadGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#059669" />
                <stop offset="100%" stopColor="#047857" />
              </linearGradient>

              {/* Stage 3: Pupa Gradients */}
              <linearGradient id="pupaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#b45309" />
                <stop offset="50%" stopColor="#78350f" />
                <stop offset="100%" stopColor="#451a03" />
              </linearGradient>

              {/* Stage 4: Adult Fly Gradients */}
              <linearGradient id="wingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.45" />
              </linearGradient>
              <linearGradient id="flyBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#475569" />
                <stop offset="70%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
              <linearGradient id="eyeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#b91c1c" />
              </linearGradient>

              {/* Stage 5: Golden Fly Gradients */}
              <radialGradient id="goldGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fef08a" stopOpacity="0.65" />
                <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="goldWingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#ca8a04" stopOpacity="0.7" />
              </linearGradient>
              <linearGradient id="goldBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbd23" />
                <stop offset="50%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#92400e" />
              </linearGradient>
              <linearGradient id="goldEyeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
            </defs>

            {/* Hexagonal/Circular shield outline */}
            <polygon 
              points="50,5 90,25 90,75 50,95 10,75 10,25" 
              fill="url(#innerBg)" 
              stroke={`url(#frameGrad-${currentRank.level})`} 
              strokeWidth="6" 
              strokeLinejoin="round"
            />
            
            {/* Inner rim */}
            <polygon 
              points="50,11 84,28 84,72 50,89 16,72 16,28" 
              fill="none" 
              stroke="#0f172a" 
              strokeWidth="2.5" 
            />
          </svg>

          {/* Centered Fly Stage Illustration */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4 scale-105">
            <RenderFlyStageSvg level={currentRank.level} />
          </div>

          {/* Level Badge text overlay */}
          <div className="absolute -bottom-1 bg-slate-900 border border-slate-700 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold text-slate-300 shadow-md">
            Rütbe {currentRank.level}
          </div>
        </div>
      </button>

      {/* Lightbox Modal Table */}
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200">
          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
              <div className="flex items-center gap-2 text-teal-400 font-extrabold text-sm sm:text-base">
                <Trophy className="h-5 w-5 text-amber-500" />
                <span>Rütbeler ve Gelişim Tablosu</span>
              </div>
              <button
                onClick={handleClose}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Scroll Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
              <p className="text-xs text-slate-400 leading-relaxed">
                Yazarlarımızın girdikleri vızıltılar (entryler), yaptıkları yorumlar ve aldıkları beğeniler sayesinde puanları artar. Toplam puanınız arttıkça sineğiniz yumurtadan çıkıp gelişim basamaklarını tırmanarak <strong>Sonsuz Vızıltı</strong> mertebesine ulaşır! 
                <span className="block mt-1 text-[11px] text-teal-400/90 font-bold">Puan Formülü: (Entry × 10) + (Yorum × 5) + (Alınan Beğeni × 3)</span>
              </p>

              {/* Grid of Ranks */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {FLY_RANKS.map((rank) => {
                  const isCurrent = rank.level === currentRank.level;
                  return (
                    <div
                      key={rank.level}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        isCurrent
                          ? "bg-slate-800/60 border-teal-500/50 shadow-lg shadow-teal-500/5 ring-1 ring-teal-500/30"
                          : "bg-slate-950/40 border-slate-850 hover:bg-slate-950/70"
                      }`}
                    >
                      {/* Mini Badge Icon */}
                      <div className="relative shrink-0 w-12 h-12 flex items-center justify-center">
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                          <polygon 
                            points="50,5 90,25 90,75 50,95 10,75 10,25" 
                            fill="#0f172a" 
                            stroke={isCurrent ? "#14b8a6" : "#475569"} 
                            strokeWidth="8" 
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center scale-90">
                          <RenderFlyStageSvg level={rank.level} />
                        </div>
                      </div>

                      {/* Rank Detail */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 justify-between">
                          <span className="text-xs font-extrabold text-slate-200 truncate leading-none">
                            {rank.level}. {rank.name}
                          </span>
                          {isCurrent && (
                            <span className="shrink-0 bg-teal-500/15 text-teal-400 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                              <Check className="h-2 w-2" /> Mevcut
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-1 font-semibold">{rank.description}</span>
                        <span className="text-[9px] text-teal-550 block mt-0.5 font-bold">Gerekli Puan: {rank.minScore}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-center text-[10px] text-slate-500">
              Şu anki toplam puanınız: <strong className="text-slate-350">{score}</strong> • Sıradaki rütbeye ulaşmak için vızıldamaya devam edin!
            </div>
          </div>
        </div>
      )}
    </>
  );
}
