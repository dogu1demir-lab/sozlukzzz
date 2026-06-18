"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import SidebarContent from "./SidebarContent";

export default function Sidebar() {
  const pathname = usePathname();

  // Hide sidebar completely on PozKes page (equivalent to kadraj tab)
  if (pathname === "/pozkes") {
    return null;
  }

  return (
    <aside className="w-full md:w-64 lg:w-72 shrink-0 border-b md:border-b-0 md:border-r border-zinc-800 bg-zinc-950 p-2.5 md:p-3 h-64 md:h-[calc(100vh-88px)] overflow-y-auto md:sticky top-[88px] z-30 order-first md:order-first scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
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
    </aside>
  );
}
