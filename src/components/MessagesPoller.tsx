"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MessagesPoller() {
  const router = useRouter();

  useEffect(() => {
    // Poll the server component data every 5 seconds to load new messages automatically
    const interval = setInterval(() => {
      router.refresh();
    }, 5000);

    return () => clearInterval(interval);
  }, [router]);

  return null;
}
