"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { playBuzzSound } from "@/lib/utils";

interface RealtimeGlobalListenerProps {
  currentUsername?: string;
}

export default function RealtimeGlobalListener({ currentUsername }: RealtimeGlobalListenerProps) {
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

          if (data.type === "NEW_TOPIC") {
            // Trigger buzz flame icon
            if (data.topicId) {
              const buzzEvent = new CustomEvent("topic-buzz", { detail: { topicId: data.topicId } });
              window.dispatchEvent(buzzEvent);
            }
            // Play sinek vızıltısı sound for new topic!
            playBuzzSound(false, "/vizildi.mp3");
            router.refresh();
          } 
          else if (data.type === "NEW_ENTRY" && data.topicId) {
            // Trigger buzz flame icon (No sound for normal entries by others as requested)
            const buzzEvent = new CustomEvent("topic-buzz", { detail: { topicId: data.topicId } });
            window.dispatchEvent(buzzEvent);
            router.refresh();
          } 
          else if (data.type === "NEW_MESSAGE") {
            // Play sinek vızıltısı sound for incoming private messages from other users
            if (data.senderUsername && data.senderUsername !== currentUsername) {
              playBuzzSound(false, "/vizildi.mp3");
            }
            router.refresh();
          }
        } catch (e) {
          // Fallback refresh
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
  }, [router, currentUsername]);

  return null;
}
