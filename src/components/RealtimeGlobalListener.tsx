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

    // Request browser notification permissions on mount
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(console.error);
      }
    }

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
            // Trigger sidebar refresh
            const refreshEvent = new CustomEvent("sidebar-refresh");
            window.dispatchEvent(refreshEvent);

            // Play sinek vızıltısı sound for new topic!
            playBuzzSound(false, "/vizildi.mp3");

            // Native notification if backgrounded
            if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted" && document.hidden) {
              new Notification("Yeni Başlık! 🔥", {
                body: `"${data.title || "Yeni bir konu açıldı!"}" başlığı vızıldatıldı!`,
                icon: "/icon.jpg"
              });
            }

            router.refresh();
          } 
          else if (data.type === "NEW_ENTRY" && data.topicId) {
            // Trigger buzz flame icon (No sound for normal entries by others as requested)
            const buzzEvent = new CustomEvent("topic-buzz", { detail: { topicId: data.topicId } });
            window.dispatchEvent(buzzEvent);

            // Trigger sidebar refresh
            const refreshEvent = new CustomEvent("sidebar-refresh");
            window.dispatchEvent(refreshEvent);

            router.refresh();
          } 
          else if (data.type === "NEW_MESSAGE") {
            // Play Nokia SMS sound for incoming private messages from other users
            if (data.senderUsername && data.senderUsername !== currentUsername) {
              playBuzzSound(false, "/sms_nokia_old.mp3");

              // Native notification if backgrounded
              if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted" && document.hidden) {
                new Notification(`@${data.senderUsername}`, {
                  body: "Sana yeni bir vızzz gönderdi! 💬",
                  icon: "/icon.jpg"
                });
              }
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
