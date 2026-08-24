"use client";

import { Suspense, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import SidebarContent from "./SidebarContent";

export default function Sidebar() {
  const pathname = usePathname();
  const [isSearchMode, setIsSearchMode] = useState(false);

  useEffect(() => {
    // Header'ın GERÇEK yüksekliğini CSS değişkenine yaz: aside'ın sticky
    // konumu ve yüksekliği buna göre ayarlanır; yoksa alttaki sabit buton
    // sayfa tepesindeyken viewport dışında kalır.
    const updateHeaderHeight = () => {
      const header = document.querySelector("header");
      if (header) {
        document.documentElement.style.setProperty("--header-h", `${header.offsetHeight}px`);
      }
    };
    const id = setTimeout(updateHeaderHeight, 0);
    window.addEventListener("resize", updateHeaderHeight);
    return () => {
      clearTimeout(id);
      window.removeEventListener("resize", updateHeaderHeight);
    };
  }, []);

  useEffect(() => {
    // ?q= parametresini mount/yönlendirme sonrası güvenli şekilde oku
    const id = setTimeout(() => {
      const searchParams = new URLSearchParams(window.location.search);
      const hasQ = !!searchParams.get("q");
      setIsSearchMode(pathname.startsWith("/baslik/") && hasQ);
    }, 0);
    return () => clearTimeout(id);
  }, [pathname]);

  // Hide sidebar completely on PozKes page, messages page and admin page
  if (pathname === "/pozkes" || pathname.startsWith("/mesajlar") || pathname.startsWith("/yonetim")) {
    return null;
  }

  const isProfileOrSettings = pathname.startsWith("/yazar") || pathname.startsWith("/settings");
  const shouldHideOnMobile = isProfileOrSettings || isSearchMode;

  return (
    <aside className={`${
      shouldHideOnMobile ? "hidden md:block" : ""
    } w-full md:w-64 lg:w-72 shrink-0 border-b md:border-b-0 md:border-r border-zinc-800 bg-zinc-950 h-64 md:h-[calc(100vh-var(--header-h,_88px))] md:sticky md:top-[var(--header-h,_88px)] z-30 order-first md:order-first flex flex-col overflow-hidden`}>
      {/* Liste kendi alanında kayar; buton ayrı, kaplamasız alt bar'da durur */}
      <div className="flex-1 overflow-y-auto p-2.5 md:p-3 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        <Suspense fallback={
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-900 mb-3 animate-pulse">
              <div className="h-4 w-24 bg-zinc-900 rounded"></div>
              <div className="h-4 w-8 bg-zinc-900 rounded-full"></div>
            </div>
            <div className="space-y-2 py-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center px-2 py-1 animate-pulse">
                  <div className="h-4 w-32 bg-zinc-900 rounded"></div>
                  <div className="h-4 w-6 bg-zinc-900 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        }>
          <SidebarContent />
        </Suspense>
      </div>
      {/* "daha fazla vızzz" butonu buraya portal ile basılır (SidebarContent) */}
      <div id="sidebar-loadmore-slot" className="shrink-0 border-t border-zinc-900 p-2.5 md:p-3 bg-zinc-950" />
    </aside>
  );
}
