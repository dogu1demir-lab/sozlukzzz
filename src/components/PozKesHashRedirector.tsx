"use client";

import { useEffect, useState } from "react";
import { getSinglePozKesAction } from "@/app/actions";
import PozKesCard from "./PozKesCard";

interface PozKesHashRedirectorProps {
  initialEntryIds: string[];
  isLoggedIn: boolean;
  currentUserId?: string;
  isAdmin?: boolean;
}

export default function PozKesHashRedirector({
  initialEntryIds,
  isLoggedIn,
  currentUserId,
  isAdmin
}: PozKesHashRedirectorProps) {
  const [targetEntry, setTargetEntry] = useState<any>(null);

  useEffect(() => {
    const handleHash = async () => {
      const hash = window.location.hash;
      if (!hash) return;

      const match = hash.match(/#entry-(.+)/);
      if (!match) return;

      const entryId = match[1];

      // 1. If entry is already rendered on the page, scroll to it smoothly
      const el = document.getElementById(`entry-${entryId}`);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth" });
        }, 300);
        return;
      }

      // 2. If entry is older and not in the initial feed, fetch it from server
      try {
        const res = await getSinglePozKesAction(entryId);
        if (res && res.success && res.entry) {
          setTargetEntry(res.entry);
          setTimeout(() => {
            const targetEl = document.getElementById(`entry-${entryId}`);
            if (targetEl) {
              targetEl.scrollIntoView({ behavior: "smooth" });
            }
          }, 300);
        }
      } catch (err) {
        console.error("PozKesHashRedirector error:", err);
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, [initialEntryIds]);

  if (!targetEntry) return null;

  return (
    <div className="mb-6 pb-6 border-b border-lime-500/20 bg-lime-500/5 p-3 rounded-2xl">
      <div className="text-[11px] font-bold text-lime-400 mb-2 px-1 flex items-center gap-1.5">
        <span>🎯 Hedeflenen PozKes Gönderisi</span>
      </div>
      <PozKesCard
        entry={targetEntry}
        isLoggedIn={isLoggedIn}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
      />
    </div>
  );
}
