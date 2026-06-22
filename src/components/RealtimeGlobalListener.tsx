"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RealtimeGlobalListener() {
  const router = useRouter();

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    function connectSSE() {
      if (eventSource) {
        eventSource.close();
      }

      eventSource = new EventSource("/api/messages/stream");

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "NEW_MESSAGE" || data.type === "NEW_ENTRY") {
            // Instantly refresh Next.js Server Components to pull the new data
            router.refresh();
          }
        } catch (e) {
          // Fallback refresh for heartbeat or raw format
          router.refresh();
        }
      };

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        reconnectTimeout = setTimeout(() => {
          connectSSE();
        }, 5000);
      };
    }

    connectSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [router]);

  return null;
}
