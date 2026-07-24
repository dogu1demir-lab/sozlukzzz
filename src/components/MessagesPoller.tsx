"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MessagesPoller() {
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
          if (data.type === "NEW_MESSAGE") {
            // Instantly refresh the page data
            router.refresh();
          }
        } catch {
          // Heartbeat or other events, refresh page data to be sure
          router.refresh();
        }
      };

      eventSource.onerror = () => {
        // Attempt reconnect after 5 seconds if connection drops
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

    // Fallback polling (every 12 seconds) in case of network anomalies
    const fallbackInterval = setInterval(() => {
      if (!document.hidden) {
        router.refresh();
      }
    }, 12000);

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      clearInterval(fallbackInterval);
    };
  }, [router]);

  return null;
}
