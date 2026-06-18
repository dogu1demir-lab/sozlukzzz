"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SidebarPoller() {
  const router = useRouter();

  useEffect(() => {
    let lastActivity = Date.now();

    // Track user activity to detect idle state
    const handleActivity = () => {
      lastActivity = Date.now();
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keypress", handleActivity);
    window.addEventListener("scroll", handleActivity);
    window.addEventListener("click", handleActivity);

    const interval = setInterval(() => {
      // 1. Only poll if the page/tab is currently visible to the user
      if (document.hidden) {
        return;
      }

      // 2. Only poll if the user is active (no inactivity for more than 3 minutes)
      const idleTime = Date.now() - lastActivity;
      if (idleTime > 3 * 60 * 1000) {
        return;
      }

      // 3. Refresh the server components in the background (refreshes sidebar topics & feed)
      router.refresh();
    }, 30000); // Check every 30 seconds

    return () => {
      clearInterval(interval);
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keypress", handleActivity);
      window.removeEventListener("scroll", handleActivity);
      window.removeEventListener("click", handleActivity);
    };
  }, [router]);

  return null;
}
