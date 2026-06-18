"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SessionUser } from "@/lib/auth";
import { logoutAction, markNotificationsAsReadAction } from "@/app/actions";
import { playBuzzSound } from "@/lib/utils";
import { 
  Bell, 
  Mail, 
  Search, 
  Volume2, 
  VolumeX,
  LogOut, 
  User as UserIcon, 
  MessageSquare,
  PlusCircle,
  Menu,
  X,
  Calendar,
  TrendingUp,
  Camera,
  Users,
  Award,
  Eye
} from "lucide-react";

interface HeaderProps {
  user: SessionUser | null;
  unreadNotificationsCount: number;
  notifications: any[];
}

export default function Header({ user, unreadNotificationsCount, notifications }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [localUnreadCount, setLocalUnreadCount] = useState(unreadNotificationsCount);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMuted(localStorage.getItem("buzzMuted") === "true");
    }
  }, []);

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    localStorage.setItem("buzzMuted", nextMuted ? "true" : "false");
    if (!nextMuted) {
      playBuzzSound(true); // Force play a quick buzz on unmute
    }
  };

  // Periodic background fly buzz (every 15 to 45 seconds)
  useEffect(() => {
    let timerId: NodeJS.Timeout;
    
    function playBackgroundBuzz() {
      const delay = 15000 + Math.random() * 30000;
      timerId = setTimeout(() => {
        if (localStorage.getItem("buzzMuted") !== "true") {
          playBuzzSound();
        }
        playBackgroundBuzz();
      }, delay);
    }
    
    playBackgroundBuzz();
    return () => clearTimeout(timerId);
  }, []);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const activeTab = searchParams.get("tab") || "bugun";

  useEffect(() => {
    setLocalUnreadCount(unreadNotificationsCount);
  }, [unreadNotificationsCount]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    playBuzzSound();
    const cleanSearch = searchQuery.trim().toLowerCase()
      .replaceAll('ı', 'i').replaceAll('ş', 's').replaceAll('ç', 'c')
      .replaceAll('ğ', 'g').replaceAll('ü', 'u').replaceAll('ö', 'o')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    router.push(`/baslik/${cleanSearch}?q=${encodeURIComponent(searchQuery)}`);
    setSearchQuery("");
  };

  const handleLogout = async () => {
    playBuzzSound();
    await logoutAction();
    router.refresh();
  };

  const handleNotificationsClick = async () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && localUnreadCount > 0) {
      setLocalUnreadCount(0);
      await markNotificationsAsReadAction();
    }
  };

  const tabs = [
    { id: "bugun", label: "bugün", icon: Calendar },
    { id: "gundem", label: "gündem", icon: TrendingUp },
    { id: "pozkes", label: "PozKes 📸", icon: Camera },
    { id: "takip", label: "takip ettiklerim", icon: Users, authRequired: true },
    { id: "begenilen", label: "en çok beğenilen", icon: Award },
    { id: "goruntulenen", label: "en çok görüntülenen", icon: Eye },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-850 bg-zinc-950/90 backdrop-blur-md">
      
      {/* Top Navbar */}
      <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-2 sm:px-4">
        
        {/* Logo */}
        <div className="flex items-center gap-1.5">
          <Link 
            href="/" 
            className="flex items-center gap-1 group text-sm sm:text-base font-bold tracking-tight text-white hover:text-lime-400 transition-colors"
          >
            <span className="inline-block animate-pulse text-lime-400 text-lg group-hover:animate-bounce">
              🪰
            </span>
            <span>sözlük<span className="text-lime-400 font-extrabold italic inline-block group-hover:skew-y-3 transition-transform">zzz</span></span>
          </Link>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-xs mx-4 relative">
          <input
            type="text"
            placeholder="ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 rounded-full bg-zinc-900 border border-zinc-800 px-3 pl-8 text-xs sm:text-sm text-zinc-200 placeholder-zinc-550 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-all"
          />
          <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-zinc-500" />
          <button type="submit" className="hidden">Ara</button>
        </form>

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={toggleMute}
            title={isMuted ? "Sesi Aç" : "Sesi Kapat"}
            className="p-1.5 rounded-full hover:bg-zinc-900 text-zinc-400 hover:text-lime-400 transition-all active:scale-95 shrink-0"
          >
            {isMuted ? (
              <VolumeX className="h-4.5 w-4.5 text-red-400" />
            ) : (
              <Volume2 className="h-4.5 w-4.5" />
            )}
          </button>

          {user ? (
            <>
              <Link
                href="/yeni"
                className="hidden sm:flex items-center gap-1 px-3 h-8 rounded-full bg-lime-500 text-black font-bold text-xs sm:text-sm hover:bg-lime-400 transition-colors active:scale-95 shrink-0"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>yaz</span>
              </Link>

              <Link
                href="/mesajlar"
                title="Özel Mesajlar"
                className="p-1.5 rounded-full hover:bg-zinc-900 text-zinc-400 hover:text-lime-400 transition-all relative shrink-0"
              >
                <Mail className="h-4.5 w-4.5" />
              </Link>

              <div className="relative shrink-0" ref={notifRef}>
                <button
                  onClick={handleNotificationsClick}
                  className="p-1.5 rounded-full hover:bg-zinc-900 text-zinc-400 hover:text-lime-400 transition-all relative"
                >
                  <Bell className="h-4.5 w-4.5" />
                  {localUnreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white animate-pulse">
                      {localUnreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-72 rounded-xl border border-zinc-800 bg-zinc-950 p-1.5 shadow-xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-100">
                    <div className="px-2.5 py-1.5 border-b border-zinc-900 font-bold text-xs text-zinc-300 flex justify-between items-center">
                      <span>Bildirimler</span>
                      {localUnreadCount > 0 && <span className="text-[10px] text-lime-400">{localUnreadCount} yeni</span>}
                    </div>
                    <div className="max-h-60 overflow-y-auto divide-y divide-zinc-900 mt-1">
                      {notifications.length === 0 ? (
                        <div className="px-3 py-6 text-center text-[10px] text-zinc-550 italic">
                          Henüz bir bildirim yok zzz.
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <Link
                            key={notif.id}
                            href={notif.relatedUrl || "/"}
                            onClick={() => {
                              setShowNotifications(false);
                              playBuzzSound();
                            }}
                            className={`flex flex-col gap-0.5 px-2.5 py-2 hover:bg-zinc-900 transition-colors ${!notif.isRead ? 'bg-zinc-900/30 font-medium' : ''}`}
                          >
                            <span className="text-[11px] text-zinc-200">{notif.content}</span>
                            <span className="text-[9px] text-zinc-500">
                              {new Date(notif.createdAt).toLocaleDateString("tr-TR")}
                            </span>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative shrink-0" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1 focus:outline-none"
                >
                  <div 
                    className="w-7.5 h-7.5 rounded-full flex items-center justify-center font-bold text-black border border-white/5 text-xs"
                    style={{ backgroundColor: user.avatarColor }}
                  >
                    {user.username.substring(0, 2).toUpperCase()}
                  </div>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-40 rounded-xl border border-zinc-800 bg-zinc-950 p-1 shadow-xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-100">
                    <div className="px-2.5 py-1.5 border-b border-zinc-900 text-[10px] text-zinc-500">
                      Yazar: <span className="font-semibold text-zinc-300">@{user.username}</span>
                    </div>
                    <Link
                      href={`/yazar/${user.username}`}
                      onClick={() => {
                        setShowUserMenu(false);
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:bg-zinc-900 transition-colors animate-none"
                    >
                      <UserIcon className="h-3.5 w-3.5" />
                      <span>Profilim</span>
                    </Link>
                    <Link
                      href="/mesajlar"
                      onClick={() => {
                        setShowUserMenu(false);
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:bg-zinc-900 transition-colors"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Mesajlar</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-red-450 hover:bg-red-500/10 transition-colors text-left"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Çıkış Yap</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1">
              <Link
                href="/giris"
                className="px-2 py-1 text-xs sm:text-sm font-bold text-zinc-400 hover:text-white transition-colors"
              >
                giriş
              </Link>
              <Link
                href="/kaydol"
                className="px-3 py-1 text-xs sm:text-sm font-bold rounded-full bg-zinc-900 hover:bg-zinc-800 text-white transition-all active:scale-95 border border-zinc-800"
              >
                kaydol
              </Link>
            </div>
          )}

          <button 
            className="p-1.5 md:hidden hover:bg-zinc-900 text-zinc-400 rounded-full shrink-0"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </button>
        </div>
      </div>

      <div className="border-t border-zinc-900 bg-zinc-950/40">
        <div className="mx-auto max-w-7xl flex gap-2.5 sm:gap-3.5 overflow-x-auto px-3 py-2 scrollbar-none">
          {tabs.map((t) => {
            if (t.authRequired && !user) return null;
            
            const isActive = t.id === "pozkes" 
              ? pathname === "/pozkes" 
              : (pathname === "/" && activeTab === t.id);
              
            const Icon = t.icon;
            const href = t.id === "pozkes" ? "/pozkes" : `/?tab=${t.id}`;

            return (
              <Link
                key={t.id}
                href={href}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border active:scale-95 ${
                  isActive
                    ? "bg-lime-500 text-black border-lime-500 shadow-md shadow-lime-500/5"
                    : "bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-white hover:bg-zinc-850"
                }`}
              >
                <Icon className="h-3 w-3" />
                <span>{t.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-850 bg-zinc-950 p-3 space-y-3 animate-in slide-in-from-top duration-200">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              placeholder="başlık ara veya yeni başlık yaz..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8.5 rounded-full bg-zinc-900 border border-zinc-800 px-3.5 pl-9 text-xs text-zinc-200 placeholder-zinc-550"
            />
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-550" />
          </form>
          {user && (
            <div className="flex gap-2">
              <Link
                href="/yeni"
                className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-full bg-lime-500 text-black font-bold text-xs animate-none"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                }}
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Yeni Başlık Yaz</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
