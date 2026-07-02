"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getEntryPageAction } from "@/app/actions";

interface HashRedirectorProps {
  currentEntryIds: string[];
}

export default function HashRedirector({ currentEntryIds }: HashRedirectorProps) {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  useEffect(() => {
    const handleHash = async () => {
      const hash = window.location.hash;
      if (!hash) return;

      const match = hash.match(/#entry-(.+)/);
      if (!match) return;

      const entryId = match[1];
      
      // If the entry is already visible on the current page, scroll to it smoothly
      if (currentEntryIds.includes(entryId)) {
        setTimeout(() => {
          const el = document.getElementById(`entry-${entryId}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth" });
          }
        }, 100);
        return;
      }

      try {
        const res = await getEntryPageAction(entryId);
        if (res && res.success && res.page && res.page > 0) {
          router.replace(`/baslik/${slug}?p=${res.page}#entry-${entryId}`);
        }
      } catch (err) {
        console.error("HashRedirector error:", err);
      }
    };

    // Listen for hashchange events as well
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, [currentEntryIds, slug, router]);

  return null;
}
